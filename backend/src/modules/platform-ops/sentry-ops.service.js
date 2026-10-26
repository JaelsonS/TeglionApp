/**
 * Resumo Sentry para Control Center — link-out + issues se token configurado.
 * Sem PII; falha aberta se token/org ausentes.
 */
const { env } = require('../../config/env');
const { logger } = require('../../utils/logger');

function sentryConfig() {
  const token = String(process.env.SENTRY_AUTH_TOKEN || '').trim() || null;
  const org = String(process.env.SENTRY_ORG_SLUG || '').trim() || null;
  const project = String(process.env.SENTRY_PROJECT_SLUG || '').trim() || null;
  const dsnConfigured = Boolean(env.SENTRY_DSN);
  return { token, org, project, dsnConfigured };
}

function projectUrl(org, project) {
  if (!org || !project) return null;
  return `https://sentry.io/organizations/${encodeURIComponent(org)}/projects/${encodeURIComponent(project)}/`;
}

function issuesUrl(org, project) {
  if (!org || !project) return null;
  return `https://sentry.io/organizations/${encodeURIComponent(org)}/issues/?project=${encodeURIComponent(project)}`;
}

async function listRecentIssues({ limit = 20 } = {}) {
  const cfg = sentryConfig();
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  const base = {
    configured: Boolean(cfg.token && cfg.org && cfg.project),
    dsnConfigured: cfg.dsnConfigured,
    org: cfg.org,
    project: cfg.project,
    projectUrl: projectUrl(cfg.org, cfg.project),
    issuesUrl: issuesUrl(cfg.org, cfg.project),
    items: [],
    hint: null,
  };

  if (!base.configured) {
    base.hint =
      'Defina SENTRY_AUTH_TOKEN, SENTRY_ORG_SLUG e SENTRY_PROJECT_SLUG no Render staging para listar issues. O DSN sozinho permite link-out manual.';
    return base;
  }

  try {
    const url = new URL(
      `https://sentry.io/api/0/projects/${encodeURIComponent(cfg.org)}/${encodeURIComponent(cfg.project)}/issues/`,
    );
    url.searchParams.set('query', 'is:unresolved');
    url.searchParams.set('sort', 'date');
    url.searchParams.set('limit', String(safeLimit));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      logger.warn('[sentry-ops] issues HTTP', { status: res.status });
      base.hint = `Sentry API respondeu ${res.status}. Verifique token e slugs.`;
      return base;
    }
    const data = await res.json();
    base.items = (Array.isArray(data) ? data : []).map((issue) => ({
      id: String(issue.id || ''),
      shortId: issue.shortId || null,
      title: String(issue.title || '').slice(0, 240),
      count: Number(issue.count) || 0,
      userCount: Number(issue.userCount) || 0,
      lastSeen: issue.lastSeen || null,
      firstSeen: issue.firstSeen || null,
      permalink: issue.permalink || null,
      level: issue.level || null,
    }));
    return base;
  } catch (err) {
    logger.warn('[sentry-ops] fetch falhou', { message: String(err?.message || err).slice(0, 120) });
    base.hint = 'Falha ao contactar a API Sentry.';
    return base;
  }
}

module.exports = {
  sentryConfig,
  listRecentIssues,
};
