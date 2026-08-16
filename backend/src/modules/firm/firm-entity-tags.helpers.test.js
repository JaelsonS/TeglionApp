const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

describe('firm-inquiry-tags.repository helpers', () => {
  it('mapLinkRowsToTagsByKey groups embedded tags by entity', () => {
    // Require after we can rely on module; helpers are pure.
    const { mapLinkRowsToTagsByKey } = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
    const rows = [
      {
        client_id: 'c1',
        tag_id: 't1',
        firm_inquiry_tags: { id: 't1', name: 'VIP', color_hex: '#123456' },
      },
      {
        client_id: 'c1',
        tag_id: 't2',
        firm_inquiry_tags: { id: 't2', name: 'Urgente', color_hex: null },
      },
      {
        client_id: 'c2',
        tag_id: 't1',
        firm_inquiry_tags: { id: 't1', name: 'VIP', color_hex: '#123456' },
      },
      { client_id: 'c3', tag_id: 'x', firm_inquiry_tags: null },
    ];
    const byClient = mapLinkRowsToTagsByKey(rows, 'client_id');
    assert.equal(byClient.get('c1')?.length, 2);
    assert.deepEqual(byClient.get('c1')?.[0], { id: 't1', name: 'VIP', colorHex: '#123456' });
    assert.equal(byClient.get('c1')?.[1].colorHex, '#0F2942');
    assert.equal(byClient.get('c2')?.length, 1);
    assert.equal(byClient.has('c3'), false);
  });

  it('resolveAllowedTagIds filters unknown ids', async () => {
    const repo = require('../../db/supabase/repositories/firm-inquiry-tags.repository');
    mock.method(repo, 'listByFirm', async () => [
      { id: 'allowed-1', name: 'A', colorHex: '#000' },
      { id: 'allowed-2', name: 'B', colorHex: '#111' },
    ]);
    const ids = await repo.resolveAllowedTagIds('firm-1', ['allowed-1', 'evil', 'allowed-1', 'allowed-2']);
    assert.deepEqual(ids, ['allowed-1', 'allowed-2']);
  });
});
