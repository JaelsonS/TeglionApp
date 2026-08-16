const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const firmInquiryTagsRepository = require('../../db/supabase/repositories/firm-inquiry-tags.repository');

/**
 * Isolamento multi-tenant das etiquetas: resolveAllowedTagIds só devolve IDs
 * que existem no catálogo da firm pedida — nunca tags de outra firm.
 */
test('resolveAllowedTagIds: Firm A não obtém tagIds que só existem na Firm B', async () => {
  mock.restoreAll();
  mock.method(firmInquiryTagsRepository, 'listByFirm', async (firmId) => {
    assert.equal(firmId, 'firm-a');
    return [
      { id: 'tag-a1', name: 'VIP', colorHex: '#111' },
      { id: 'tag-a2', name: 'Urgente', colorHex: '#222' },
    ];
  });

  const allowed = await firmInquiryTagsRepository.resolveAllowedTagIds('firm-a', [
    'tag-a1',
    'tag-b-foreign',
    'tag-a2',
  ]);

  assert.deepEqual(allowed.sort(), ['tag-a1', 'tag-a2'].sort());
  mock.restoreAll();
});

test('resolveAllowedTagIds: lista vazia da firm → nenhum tagId aceite', async () => {
  mock.restoreAll();
  mock.method(firmInquiryTagsRepository, 'listByFirm', async () => []);
  const allowed = await firmInquiryTagsRepository.resolveAllowedTagIds('firm-b', ['tag-a1']);
  assert.deepEqual(allowed, []);
  mock.restoreAll();
});
