/**
 * Integração AT — fase 1: deep links e metadados (sem API certificada).
 */
const AT_PORTAL_BASE = 'https://www.portaldasfinancas.gov.pt';

function buildAtPortalLinks({ nif } = {}) {
  const nifClean = String(nif || '').replace(/\D/g, '');
  return {
    portalHome: AT_PORTAL_BASE,
    declaracoes: `${AT_PORTAL_BASE}/at/html/index.html`,
    eFatura: `${AT_PORTAL_BASE}/faturas`,
    consultarNif: nifClean
      ? `${AT_PORTAL_BASE}/at/html/index.html?nif=${encodeURIComponent(nifClean)}`
      : null,
    safT: `${AT_PORTAL_BASE}/faturas/saft`,
    iva: `${AT_PORTAL_BASE}/main.jsp?body=/de/jsp/deEntregas/deEntregaIvaForm.jsp`,
  };
}

function getClientAtStatus({ nif, lastVerifiedAt } = {}) {
  const links = buildAtPortalLinks({ nif });
  return {
    integrated: false,
    phase: 'deep-links',
    message:
      'Integração directa com a AT (SAF-T automático, e-Fatura) requer credenciais de software certificado. Utilize os atalhos abaixo até activação da API.',
    links,
    lastVerifiedAt: lastVerifiedAt || null,
    capabilities: {
      safTImport: false,
      eFaturaSync: false,
      obligationAutoStatus: false,
      portalDeepLinks: true,
    },
  };
}

module.exports = { buildAtPortalLinks, getClientAtStatus };
