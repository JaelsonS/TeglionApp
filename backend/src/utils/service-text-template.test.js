const test = require('node:test');
const assert = require('node:assert/strict');

const { interpolateServiceTemplate } = require('./service-text-template');

test('interpolateServiceTemplate: {{ano}} vira o ano civil actual', () => {
  const result = interpolateServiceTemplate('Declaração de IRS {{ano}}', { now: new Date('2026-08-11') });
  assert.equal(result, 'Declaração de IRS 2026');
});

test('interpolateServiceTemplate: {{ano_fiscal}} vira o ano anterior (rendimentos a declarar)', () => {
  const result = interpolateServiceTemplate('Declaração de IRS {{ano_fiscal}}', { now: new Date('2026-08-11') });
  assert.equal(result, 'Declaração de IRS 2025');
});

test('interpolateServiceTemplate: mistura os dois tokens na mesma frase', () => {
  const result = interpolateServiceTemplate(
    'IRS {{ano_fiscal}} — entrega até final de {{ano}}',
    { now: new Date('2026-01-05') },
  );
  assert.equal(result, 'IRS 2025 — entrega até final de 2026');
});

test('interpolateServiceTemplate: comparação de tokens não é sensível a maiúsculas nem a espaços internos', () => {
  const result = interpolateServiceTemplate('IRS {{ ANO_FISCAL }}', { now: new Date('2026-08-11') });
  assert.equal(result, 'IRS 2025');
});

test('interpolateServiceTemplate: texto sem tokens fica inalterado', () => {
  assert.equal(interpolateServiceTemplate('Consultoria Individual'), 'Consultoria Individual');
});

test('interpolateServiceTemplate: null/undefined/vazio passam por undefined-safe', () => {
  assert.equal(interpolateServiceTemplate(null), null);
  assert.equal(interpolateServiceTemplate(undefined), undefined);
  assert.equal(interpolateServiceTemplate(''), '');
});

test('interpolateServiceTemplate: em HTML só substitui nós de texto, não atributos', () => {
  const result = interpolateServiceTemplate(
    '<p>IRS {{ano}}</p><ul data-year="{{ano}}"><li>{{ano_fiscal}}</li></ul>',
    { now: new Date('2026-08-11') },
  );
  assert.equal(result, '<p>IRS 2026</p><ul data-year="{{ano}}"><li>2025</li></ul>');
});

test('interpolateServiceTemplate: negrito com token no meio', () => {
  const result = interpolateServiceTemplate('<p>Declaração <strong>IRS {{ano}}</strong></p>', {
    now: new Date('2026-08-11'),
  });
  assert.equal(result, '<p>Declaração <strong>IRS 2026</strong></p>');
});
