/**
 * Resumo Sentry para Control Center — link-out + issues se token configurado.
 * DSN = captura de erros (já configurado no Render).
 * Token+org+project = listar issues DENTRO do painel (API Sentry).
 */
const { env } = require('../../config/env');
const { logger } = require('../../utils/logger');
const { isStagingFrontendUrl } = require('../../utils/cors-critical-origins');

function sentryConfig() {
  const token = String(process.env.SENTRY_AUTH_TOKEN || '').trim() || null;
  const org =
    String(process.env.SENTRY_ORG_SLUG || '').trim() ||
    // Fallback só para links (nunca inventa token)
    'jaelson-santos';
  const projectExplicit = String(process.env.SENTRY_PROJECT_SLUG || '').trim() || null;
  const project =
    projectExplicit ||
    (isStagingFrontendUrl(env.FRONTEND_URL) ? 'teglion-staging' : 'teglion-app');
  const regionBase = String(process.env.SENTRY_REGION_URL || 'https://de.sentry.io')
    .trim()
    .replace(/\/+$/, '');
  const dsnConfigured = Boolean(env.SENTRY_DSN);
  const listingConfigured = Boolean(token && org && project);
  return { token, org, project, regionBase, dsnConfigured, listingConfigured };
}

function projectUrl(org, project) {
  if (!org || !project) return null;
  // UI Sentry (slug da org no path)
  return `https://${encodeURIComponent(org)}.sentry.io/projects/${encodeURIComponent(project)}/`;
}

function issuesUrl(org, project) {
  if (!org || !project) return null;
  return `https://${encodeURIComponent(org)}.sentry.io/issues/?project=${encodeURIComponent(project)}`;
}

async function listRecentIssues({ limit = 20 } = {}) {
  const cfg = sentryConfig();
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);

  const base = {
    configured: cfg.listingConfigured,
    dsnConfigured: cfg.dsnConfigured,
    capturingOk: cfg.dsnConfigured,
    listingOk: false,
    org: cfg.org,
    project: cfg.project,
    regionBase: cfg.regionBase,
    projectUrl: projectUrl(cfg.org, cfg.project),
    issuesUrl: issuesUrl(cfg.org, cfg.project),
    items: [],
    hint: null,
    statusMessage: null,
  };

  if (cfg.dsnConfigured) {
    base.statusMessage =
      'O Sentry já está a receber erros (DSN no Render). Isso é a monitorização real.';
  } else {
    base.statusMessage = 'DSN em falta — a API não está a enviar erros para o Sentry.';
  }

  if (!cfg.listingConfigured) {
    base.hint =
      'Para ver a lista de issues DENTRO deste painel (além do link para o Sentry), defina no Render: SENTRY_AUTH_TOKEN + SENTRY_ORG_SLUG=jaelson-santos + SENTRY_PROJECT_SLUG=teglion-staging (staging) ou teglion-app (prod). O DSN sozinho não autoriza a API de listagem.';
    return base;
  }

  try {
    const url = new URL(
      `${cfg.regionBase}/api/0/projects/${encodeURIComponent(cfg.org)}/${encodeURIComponent(cfg.project)}/issues/`,
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
      base.hint = `API Sentry respondeu ${res.status}. Confirme token (scopes project:read), org/project e SENTRY_REGION_URL=${cfg.regionBase}.`;
      return base;
    }
    const data = await res.json();
    base.listingOk = true;
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
    base.hint = 'Falha ao contactar a API Sentry (rede/região). Use o link directo abaixo.';
    return base;
  }
}

module.exports = {
  sentryConfig,
  listRecentIssues,
};
