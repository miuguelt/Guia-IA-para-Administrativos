const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

test('los retos del módulo 01 dicen que sus textos se copian y no se descargan', () => {
  const source = fs.readFileSync(path.join(__dirname, '../content/lessons/m01-fundamentos.html'), 'utf8');
  assert.doesNotMatch(source, /se reutiliza el paquete común|Adjunta reto-0|\.csv/u);
  assert.equal((source.match(/No hay archivos que descargar/gu) || []).length, 2);
});

test('el módulo de instrucciones conserva completo el rótulo de la explicación', () => {
  const source = fs.readFileSync(path.join(__dirname, '../content/lessons/m02-diseno.html'), 'utf8');
  assert.doesNotMatch(source, /LO ESENCIA\+/u);
  assert.match(source, /LO ESENCIAL/u);
});

test('el esquema de porcentaje muestra la conversión a porcentaje', () => {
  const source = fs.readFileSync(path.join(__dirname, '../content/lessons/m04-validacion.html'), 'utf8');
  const text = new JSDOM(source).window.document.body.textContent;
  assert.match(text, /42 deserciones ÷ 840 matriculados × 100 = 5,0 %/u);
  assert.equal(42 / 840 * 100, 5);
});

test('el diagrama del reto 7 revisa la urgencia antes de los datos requeridos', () => {
  const source = fs.readFileSync(path.join(__dirname, '../content/lessons/m03-implementacion.html'), 'utf8');
  const document = new JSDOM(source).window.document;
  const flow = document.querySelector('#reto-7 .flow-visual');
  assert.ok(flow, 'El reto conserva una representación legible del flujo.');
  const stages = [...flow.querySelectorAll(':scope > div')].map(node => node.textContent);
  assert.match(stages[1], /urgente/iu);
  assert.match(stages[2], /datos requeridos/iu);
  assert.match(flow.textContent, /detener|detención/iu);
});
