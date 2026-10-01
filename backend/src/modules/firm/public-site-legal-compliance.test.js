const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  evaluatePublicSiteLegalGaps,
  parseLegalPublishAcknowledgement,
} = require('./public-site-legal-compliance');
const { DEFAULT_COMPLAINTS_BOOK_URL, DEFAULT_TERMS_TEMPLATE } = require('./public-site-legal-templates');

test('evaluatePublicSiteLegalGaps: config completa', () => {
  const gaps = evaluatePublicSiteLegalGaps({
    complaintsBookUrl: DEFAULT_COMPLAINTS_BOOK_URL,
    termsText: `${DEFAULT_TERMS_TEMPLATE}\n\nAdaptado pelo escritório XYZ.`,
    privacyText: 'Política personalizada do escritório.',
  });
  assert.deepEqual(gaps, []);
});

test('evaluatePublicSiteLegalGaps: detecta livro e políticas em falta', () => {
  const gaps = evaluatePublicSiteLegalGaps({
    complaintsBookUrl: null,
    termsText: null,
    privacyText: null,
  });
  assert.deepEqual(gaps, ['complaintsBook', 'terms', 'privacy']);
});

test('parseLegalPublishAcknowledgement: exige accepted true', () => {
  assert.equal(parseLegalPublishAcknowledgement({}), null);
  assert.deepEqual(
    parseLegalPublishAcknowledgement({
      legalPublishAcknowledgement: { accepted: true, missingItems: ['terms'] },
    }),
    { accepted: true, missingItems: ['terms'] },
  );
});
