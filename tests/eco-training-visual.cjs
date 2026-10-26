const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.isReady = new Promise((resolve) => {
      this.ws.onopen = resolve;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        this.callbacks.get(msg.id)(msg);
        this.callbacks.delete(msg.id);
      }
    };
  }

  async send(method, params = {}) {
    await this.isReady;
    const msgId = this.id++;
    return new Promise((resolve) => {
      this.callbacks.set(msgId, (res) => {
        if (res.error) {
          console.error(`CDP Error in ${method}:`, res.error);
        }
        resolve(res.result);
      });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    return res && res.result ? res.result.value : null;
  }

  close() {
    this.ws.close();
  }
}


async function run() {
  const assert = require('node:assert/strict');
  const browserPath = process.env.ECO_BROWSER_PATH || (process.platform === 'win32'
    ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    : '/usr/bin/google-chrome');
  assert.ok(fs.existsSync(browserPath), `No se encontró el navegador: ${browserPath}`);
  const portServer = http.createServer();
  await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve));
  const port = portServer.address().port;
  await new Promise(resolve => portServer.close(resolve));
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-eco-'));
  const output = path.resolve('output/revision-eco/visual');
  fs.mkdirSync(output, {recursive:true});
  const browser = spawn(browserPath, [`--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${userDataDir}`, 'about:blank']);
  let cdp;
  const evidence = [];
  try {
    let tabs;
    for (let i=0;i<50;i++) {
      try { tabs=await getJson(`http://127.0.0.1:${port}/json/list`); break; } catch (_) { await wait(100); }
    }
    assert.ok(tabs?.length, 'El navegador no inició.');
    cdp = new CDPClient(tabs.find(tab=>tab.type==='page').webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.navigate',{url:'file:///'+path.resolve('index.html').replace(/\\/g,'/')+'#ecobogota'});
    for(let i=0;i<50;i++) {
      if(await cdp.evaluate(`Boolean(document.querySelector('[data-ai-delivery="ECO-A02"][data-delivery-ready]'))`)) break;
      await wait(100);
    }
    assert.equal(await cdp.evaluate(`Boolean(document.querySelector('[data-ai-delivery="ECO-A02"][data-delivery-ready]'))`),true);
    // La selección de formato se realiza con las flechas nativas del grupo de radios.
    await cdp.evaluate(`document.querySelector('#eco-route-video').focus()`);
    await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
    await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});
    assert.equal(await cdp.evaluate(`document.querySelector('input[name="eco-route"]:checked').value`),'canva');
    const widths = [320,390,768,1440,1920,2560];
    for(const width of widths) {
      // El zoom del 200 % se verifica desde 768 px: conserva al menos 384 CSS px.
      for(const zoom of (width >= 768 ? [1,2] : [1])) {
        await cdp.send('Emulation.setDeviceMetricsOverride',{width:Math.round(width/zoom),height:Math.round(1000/zoom),deviceScaleFactor:zoom,mobile:false});
        // La alineación de la prosa responde a ResizeObserver; se espera a que se asiente con el nuevo ancho.
        await wait(800);
        for(const route of ['video','canva','simulacion']) {
          await cdp.evaluate(`document.querySelector('#eco-route-${route}').click();document.querySelectorAll('#ecobogota details').forEach(el=>el.open=true);`);
          await wait(70);
          const audit = await cdp.evaluate(`(async()=>{
            // Sin ventana, ResizeObserver puede llegar tarde: se aplica la regla de prosa al ancho actual antes de medir.
            window.DevBrainProseLayout?.refresh();
            const page=document.querySelector('#ecobogota');
            await Promise.all(Array.from(page.querySelectorAll('img')).map(img=>img.decode()));
            const visible=el=>el.getClientRects().length>0;
            const problems=[];
            for(const el of page.querySelectorAll('h1,h2,h3,h4,p,li,label,summary,blockquote,figcaption,button')) {
              if(!visible(el))continue;
              const css=getComputedStyle(el);
              if(el.scrollWidth>el.clientWidth+2)problems.push('ancho:'+el.tagName+':'+el.textContent.slice(0,50));
              // Regla 7.4: solo la prosa de 40rem o más se justifica; títulos, listas y controles conservan su alineación.
              const rem=parseFloat(getComputedStyle(document.documentElement).fontSize);
              const justifyAllowed=['P','BLOCKQUOTE'].includes(el.tagName)&&el.getBoundingClientRect().width>=40*rem;
              if(['nowrap'].includes(css.whiteSpace)||css.wordBreak==='break-all'||css.overflowWrap==='anywhere'||css.textOverflow==='ellipsis'||(css.textAlign==='justify'&&!justifyAllowed))problems.push('texto:'+el.tagName);
              if(['hidden','clip'].includes(css.overflowY)&&el.scrollHeight>el.clientHeight+2)problems.push('alto:'+el.tagName);
            }
            const panels=Array.from(page.querySelectorAll('.eco-route-panel')).filter(visible);
            const controls=Array.from(page.querySelectorAll('.button')).filter(visible);
            const intro=page.querySelector('.page-intro');
            return {width:innerWidth,documentWidth:document.documentElement.scrollWidth,pageWidth:page.clientWidth,pageScroll:page.scrollWidth,route:panels.map(p=>p.dataset.ecoRoute),problems,
              controls:controls.every(el=>el.getBoundingClientRect().height>=43),
              introFills:Math.abs(intro.getBoundingClientRect().width-intro.parentElement.clientWidth)<=2,
              images:page.querySelectorAll('img').length,imagesLoaded:Array.from(page.querySelectorAll('img')).every(img=>img.complete&&img.naturalWidth>0&&img.alt.trim()),
              promptScroll:Array.from(page.querySelectorAll('pre')).filter(visible).every(el=>getComputedStyle(el).whiteSpace==='pre'&&getComputedStyle(el).overflowX==='auto')};
          })()`);
          assert.ok(audit, 'El navegador no devolvió el diagnóstico.');
          assert.deepEqual(audit.route,[route]);
          assert.ok(audit.documentWidth<=audit.width+2,JSON.stringify(audit));
          assert.ok(audit.pageScroll<=audit.pageWidth+2,JSON.stringify(audit));
          assert.deepEqual(audit.problems,[],JSON.stringify(audit));
          assert.ok(audit.controls&&audit.introFills&&audit.imagesLoaded&&audit.promptScroll,JSON.stringify(audit));
          assert.equal(audit.images,10);
          const receiver = `document.querySelector('[data-ai-delivery="ECO-A02"]')`;
          // Estados reales del receptor: entrada inválida, vista previa, guardado y revisión.
          await cdp.evaluate(`(()=>{const r=${receiver};r.querySelector('[data-result-text]').value='{error}';r.querySelector('[data-result-paste]').click();})()`);
          await wait(70);
          assert.equal(await cdp.evaluate(`${receiver}.querySelector('[data-result-status]').getAttribute('role')`),'alert');
          const values={contexto:'Personal de oficina; '+route,encargo:'Crear capacitación con fuentes',material:'Insumos preparados; preparación pendiente de producción',verificacion:'Autocomprobación con fuentes; revisión humana pendiente.'};
          const payload=JSON.stringify({schemaVersion:1,artifactId:'ECO-A02',fields:values,tool:'no identificado'});
          await cdp.evaluate(`(()=>{const r=${receiver};r.querySelector('[data-result-text]').value=${JSON.stringify(payload)};r.querySelector('[data-result-paste]').click();})()`);
          await wait(70);
          assert.equal(await cdp.evaluate(`${receiver}.querySelector('[data-result-save]').disabled`),false);
          await cdp.evaluate(`${receiver}.querySelector('[data-result-save]').click()`);
          assert.equal(await cdp.evaluate(`document.querySelector('[data-db-evidence="ECO-A02"]').dataset.dbEvidenceStatus`),'borrador');
          await cdp.evaluate(`${receiver}.querySelector('[data-result-review]').click()`);
          assert.equal(await cdp.evaluate(`document.querySelector('[data-db-evidence="ECO-A02"]').dataset.dbEvidenceStatus`),'lista');
          assert.ok(await cdp.evaluate(`document.documentElement.scrollWidth<=innerWidth+2`));
          await cdp.evaluate(`document.querySelectorAll('#ecobogota .eco-prompt-details').forEach(el=>el.open=false);document.querySelector('#eco-fase-2').scrollIntoView()`);
          const screenshot=await cdp.send('Page.captureScreenshot',{format:'png'});
          const filename=`${width}-${zoom*100}-${route}.png`;
          fs.writeFileSync(path.join(output,filename),Buffer.from(screenshot.data,'base64'));
          evidence.push({...audit,viewport:width,zoom:zoom*100,states:['error','vista previa','borrador','revisión registrada'],screenshot:filename});
          console.log(`PASS ${width}px · ${zoom*100}% · ${route}`);
        }
      }
    }
    // Las tres guías independientes deben conservar sus imágenes y contener el código largo.
    for(const key of ['eco','eco-canva','eco-simulacion']) {
      await cdp.send('Page.navigate',{url:'file:///'+path.resolve(`materiales/ia/${key}/LEEME.html`).replace(/\\/g,'/')});
      await wait(120);
      for(const width of widths) {
        await cdp.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
        await cdp.evaluate(`document.querySelectorAll('details').forEach(el=>el.open=true)`);
        assert.ok(await cdp.evaluate(`document.documentElement.scrollWidth<=innerWidth+2`),`${key}: ${width}px`);
      }
    }
    await cdp.send('Page.navigate',{url:'file:///'+path.resolve('materiales/eco-capacitacion/simulacion.html').replace(/\\/g,'/')});
    await wait(150);
    for(let index=0;index<6;index++) {
      await cdp.evaluate(`document.querySelectorAll('[data-office-scene] summary')[${index}].focus()`);
      await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',text:' '});
      await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space'});
      assert.equal(await cdp.evaluate(`document.querySelectorAll('[data-office-scene] details')[${index}].open`),true);
    }
    for(const width of widths) {
      for(const zoom of (width>=768?[1,2]:[1])) {
        await cdp.send('Emulation.setDeviceMetricsOverride',{width:Math.round(width/zoom),height:Math.round(1000/zoom),deviceScaleFactor:zoom,mobile:false});
        assert.ok(await cdp.evaluate(`document.documentElement.scrollWidth<=innerWidth+2`),`Ejemplo ${width}px, ${zoom*100}%`);
        assert.equal(await cdp.evaluate(`Array.from(document.querySelectorAll('h1,h2,p,li,summary')).some(el=>el.scrollWidth>el.clientWidth+2||getComputedStyle(el).textAlign==='justify')`),false);
      }
    }
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await cdp.evaluate('window.scrollTo(0,0)');
    const exampleScreenshot=await cdp.send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(output,'ejemplo-simulacion.png'),Buffer.from(exampleScreenshot.data,'base64'));
    fs.writeFileSync(path.join(output,'evidencia.json'),JSON.stringify({routes:evidence,example:{scenes:3,alternatives:6,keyboard:true,responsive:true}},null,2));
    console.log(`Verificadas ${evidence.length} combinaciones, tres guías, selección por teclado y el ejemplo completo.`);
  } finally {
    cdp?.close();
    browser.kill();
    await wait(250);
    const tempRoot=path.resolve(os.tmpdir())+path.sep;
    const resolved=path.resolve(userDataDir);
    if(!resolved.startsWith(tempRoot)||!path.basename(resolved).startsWith('edge-eco-'))throw new Error('La carpeta temporal no pertenece a esta prueba.');
    try {fs.rmSync(resolved,{recursive:true,force:true});} catch (_) {}
  }
}
run().catch(error=>{console.error(error);process.exitCode=1;});
