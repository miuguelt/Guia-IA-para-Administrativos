(function (root) {
  'use strict';
  class Simulator {
    static type = 'analysis-result';

    constructor({ container }) {
      this.container = container;
      this.win = container.ownerDocument.defaultView;
      this.events = [];
      this.result = null;
    }

    render() {
      if (this.events.length) return;
      const form = this.container.querySelector('form');
      this.listen(form, 'change', () => this.refresh());
      this.listen(form, 'submit', event => { event.preventDefault(); this.refresh(); });
      this.listen(form, 'reset', () => this.win.queueMicrotask(() => this.refresh()));
      this.listen(this.container.querySelector('[data-result-retry]'), 'click', () => this.refresh());
      this.listen(this.container.querySelector('[data-result-download]'), 'click', () => this.download());
      this.refresh(true);
    }

    listen(node, event, callback) {
      node.addEventListener(event, callback);
      this.events.push([node, event, callback]);
    }

    refresh(passive = false) {
      const output = this.container.querySelector('[data-result-output]');
      const download = this.container.querySelector('[data-result-download]');
      const retry = this.container.querySelector('[data-result-retry]');
      output.setAttribute('aria-busy', 'true');
      this.result = null;
      download.disabled = true;
      try {
        if (!this.win.AnalysisResultsModel || !this.win.AnalysisResultsView) throw new Error('No se cargaron las herramientas del simulador. Intenta recargar la página.');
        const loader = this.win.LabDataLoader;
        if (loader && !loader.isReady(this.container.ownerDocument)) {
          this.waitForData(output, !passive);
          return;
        }
        let data;
        try { data = JSON.parse(this.container.ownerDocument.getElementById('lab-source-data').textContent); }
        catch { throw new Error('No fue posible leer los datos incluidos. Recarga la página o descarga el paquete del laboratorio.'); }
        const options = Object.fromEntries(new this.win.FormData(this.container.querySelector('form')));
        this.result = this.win.AnalysisResultsModel.simulate(data, this.container.dataset.case, options);
        this.win.AnalysisResultsView.render(output, this.result);
        download.disabled = !this.result.count;
        retry.hidden = true;
        this.container.querySelector('[data-result-status]').textContent = 'Resultado actualizado con la selección actual.';
      } catch (error) {
        const alert = this.container.ownerDocument.createElement('p');
        alert.setAttribute('role', 'alert'); alert.className = 'result-error'; alert.textContent = error.message;
        output.replaceChildren(alert);
        retry.hidden = false;
        this.container.querySelector('[data-result-status]').textContent = '';
      } finally { output.setAttribute('aria-busy', 'false'); }
    }

    waitForData(output, load) {
      const message = this.container.ownerDocument.createElement('p');
      message.textContent = 'Los datos del laboratorio se cargan al abrirlo. El resultado aparecerá aquí en unos segundos.';
      output.replaceChildren(message);
      if (!this.waiting) {
        const stop = () => {
          this.win.removeEventListener('lab-data:ready', this.waiting.ready);
          this.win.removeEventListener('lab-data:error', this.waiting.error);
          this.waiting = null;
        };
        this.waiting = {
          ready: () => { stop(); this.refresh(); },
          error: event => {
            stop();
            const alert = this.container.ownerDocument.createElement('p');
            alert.setAttribute('role', 'alert'); alert.className = 'result-error'; alert.textContent = event.detail.message;
            output.replaceChildren(alert);
            this.container.querySelector('[data-result-retry]').hidden = false;
          }
        };
        this.win.addEventListener('lab-data:ready', this.waiting.ready);
        this.win.addEventListener('lab-data:error', this.waiting.error);
      }
      if (load) this.win.LabDataLoader.ensure(this.container.ownerDocument, this.win).catch(() => {});
    }

    download() {
      if (!this.result?.count) return;
      const status = this.container.querySelector('[data-result-status]');
      try {
        const csv = this.win.AnalysisResultsModel.toCSV(this.result);
        const url = this.win.URL.createObjectURL(new this.win.Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = this.container.ownerDocument.createElement('a');
        link.href = url; link.download = `resultado-${this.container.dataset.case}.csv`;
        try { link.click(); } finally { this.win.URL.revokeObjectURL(url); }
        status.textContent = 'Se descargó la tabla de la selección actual. Conserva también la fuente y sus filtros.';
      } catch { status.textContent = 'No fue posible descargar el resultado. Revisa la tabla o descarga el paquete del laboratorio e inténtalo de nuevo.'; }
    }

    destroy() {
      for (const [node, event, callback] of this.events) node.removeEventListener(event, callback);
      this.events = [];
    }
  }
  root.AnalysisResults = { Simulator };
})(window);
