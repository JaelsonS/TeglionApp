const { getSupabaseAdmin } = require('../client');

async function upsertSubscriber({ email, audience = 'blog', source = null, locale = 'pt-PT' }) {
  const sb = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) {
    const err = new Error('EMAIL_REQUIRED');
    err.code = 'EMAIL_REQUIRED';
    throw err;
  }

  const { data, error } = await sb
    .from('blog_newsletter_subscribers')
    .upsert(
      {
        email: normalized,
        audience,
        source: source || null,
        locale,
        consent_at: new Date().toISOString(),
      },
      { onConflict: 'email,audience' },
    )
    .select('id, email, created_at')
    .single();

  if (error) throw error;
  return data;
}

module.exports = {
  upsertSubscriber,
};
