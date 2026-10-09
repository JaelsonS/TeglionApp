const test = require('node:test');
const assert = require('node:assert/strict');
const { parseMediaAssets, mergeMediaAssetsIntoDraft } = require('./media-assets');

test('parseMediaAssets: rejeita ids inválidos', () => {
  assert.equal(parseMediaAssets({ heroImage: { id: 'x', storageKey: 'ok/path.png' } }), null);
});

test('mergeMediaAssetsIntoDraft: liga hero imageIds', () => {
  const draft = {
    images: { hero: [], institutional: [], bySection: {} },
    sections: [{ type: 'hero', key: 'h1', content: { title: 'T', tagline: 'a', bio: 'b', imageIds: [] } }],
  };
  const ref = { id: 'img_abc12345', storageKey: 'firms/1/hero.png', alt: '' };
  const merged = mergeMediaAssetsIntoDraft(draft, { heroImage: ref });
  assert.equal(merged.images.hero.length, 1);
  assert.deepEqual(merged.sections[0].content.imageIds, ['img_abc12345']);
});
