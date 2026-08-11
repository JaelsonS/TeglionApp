const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const quotePdfSettingsService = require('./quote-pdf-settings.service');

function resetMocks() {
  mock.restoreAll();
}

test('normalizeQuotePdfSettings: undefined/null vira objecto vazio', () => {
  assert.deepEqual(quotePdfSettingsService.normalizeQuotePdfSettings(undefined), {});
  assert.deepEqual(quotePdfSettingsService.normalizeQuotePdfSettings(null), {});
});

test('normalizeQuotePdfSettings: corta texto no limite e ignora campos não reconhecidos', () => {
  const result = quotePdfSettingsService.normalizeQuotePdfSettings({
    introText: 'a'.repeat(3000),
    naoReconhecido: 'x',
  });
  assert.equal(result.introText.length, 2000);
  assert.equal(result.naoReconhecido, undefined);
});

test('normalizeQuotePdfSettings: string vazia limpa o campo (não fica "")', () => {
  const result = quotePdfSettingsService.normalizeQuotePdfSettings({ introText: '   ' });
  assert.equal(result.introText, undefined);
});

test('getQuotePdfSettings: escritório inexistente devolve 404', async () => {
  resetMocks();
  mock.method(firmsRepository, 'findFirmById', async () => null);

  await assert.rejects(
    () => quotePdfSettingsService.getQuotePdfSettings('firm-x'),
    (err) => {
      assert.equal(err.statusCode, 404);
      return true;
    },
  );
});

test('updateQuotePdfSettings: faz merge parcial — actualizar só termsText preserva introText já gravado', async () => {
  resetMocks();
  mock.method(firmsRepository, 'findFirmById', async () => ({
    id: 'firm-1',
    settings: { quotePdf: { introText: 'Olá!', termsText: 'Antigo' } },
  }));
  let mergedValue = null;
  mock.method(firmsRepository, 'mergeSettingsKey', async (firmId, key, value) => {
    mergedValue = value;
    return { id: firmId, settings: { [key]: value } };
  });

  const result = await quotePdfSettingsService.updateQuotePdfSettings('firm-1', { termsText: 'Novo' });

  assert.equal(result.introText, 'Olá!');
  assert.equal(result.termsText, 'Novo');
  assert.deepEqual(mergedValue, result);
});
