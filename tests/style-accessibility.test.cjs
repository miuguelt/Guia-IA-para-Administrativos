const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const cssDir = path.join(root, 'css');
const sheets = fs.readdirSync(cssDir).filter(name => name.endsWith('.css'));
const read = name => fs.readFileSync(path.join(cssDir, name), 'utf8');

function luminance(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map(c => c + c).join('') : value.slice(0, 6);
  const channel = index => {
    const c = parseInt(full.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(foreground, background = '#ffffff') {
  const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

function token(name) {
  const match = read('tokens.css').match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(match, `Falta el token --${name}`);
  return match[1];
}

test('los tokens de texto atenuado cumplen contraste AA sobre las superficies claras', () => {
  for (const name of ['muted', 'text-accent-muted', 'amber-contrast-text', 'amber-feedback-text']) {
    for (const surface of ['#ffffff', '#f8fafc', '#edf3e8']) {
      assert.ok(contrast(token(name), surface) >= 4.5, `--${name} sobre ${surface}`);
    }
  }
  assert.ok(contrast(token('decor-muted')) >= 3, 'Los símbolos decorativos necesitan al menos 3:1');
});

test('las hojas del curso no usan los tonos de texto con contraste insuficiente', () => {
  const retired = ['#698152', '#658052', '#79945b', '#92a085', '#6d885b', '#63824e', '#658575', '#668371', '#638151', '#9caf8f', '#73806c', '#6c7c62', '#f57f17', '#e65100'];
  for (const sheet of sheets) {
    const css = read(sheet).toLowerCase();
    for (const color of retired) assert.ok(!css.includes(color), `${sheet} todavía usa ${color}`);
  }
});

test('ningún texto del curso baja de 0,8rem', () => {
  for (const sheet of sheets) {
    for (const match of read(sheet).matchAll(/font-size:\s*(0?\.\d+)rem/gu)) {
      assert.ok(Number(match[1]) >= 0.8, `${sheet}: font-size ${match[1]}rem`);
    }
  }
});

test('la prosa no activa la división automática de palabras', () => {
  assert.match(read('tokens.css'), /--hyphens-reading:\s*none/u);
  for (const sheet of sheets) {
    assert.doesNotMatch(read(sheet), /hyphens:\s*(?:var\(--hyphens-reading,\s*)?auto/u, sheet);
  }
});

test('los controles del encabezado conservan un área táctil de 44 px', () => {
  assert.match(read('course-shell.css'), /\.resource-link\s*\{[^}]*min-height:\s*44px/su);
});

test('ningún texto natural del curso se recorta con puntos suspensivos ni con límite de líneas', () => {
  for (const sheet of sheets) {
    const css = read(sheet).replace(/\/\*[\s\S]*?\*\//gu, '');
    assert.doesNotMatch(css, /text-overflow:\s*ellipsis|line-clamp/u, sheet);
  }
});
