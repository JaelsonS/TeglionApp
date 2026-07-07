const { mapObligationRow, clientHealthFromObligations } = require('./mappers');

const OPEN_STATUSES = ['PENDING', 'IN_PROGRESS', 'WAITING_CLIENT', 'OVERDUE'];

function buildClientLookups(clients) {
  const clientNameById = new Map(clients.map((c) => [c.id, c.display_name]));
  const clientTaxById = new Map(clients.map((c) => [c.id, c.tax_id || null]));
  return { clientNameById, clientTaxById };
}

function enrichObligations(obligations, clientNameById, clientTaxById) {
  return obligations.map((row) => {
    const ob = mapObligationRow(row);
    return {
      ...ob,
      clientName: clientNameById.get(ob.clientId) || ob.clientName || null,
      clientTaxId: clientTaxById.get(ob.clientId) || ob.clientTaxId || null,
    };
  });
}

function partitionOpenObligations(obligations, now, in48h) {
  const overdue = obligations.filter(
    (o) => !['DELIVERED', 'CANCELLED'].includes(o.status) && (new Date(o.dueDate) < now || o.status === 'OVERDUE'),
  );
  const waitingClient = obligations.filter((o) => OPEN_STATUSES.includes(o.status));
  const criticalNext48h = obligations.filter((o) => {
    if (['DELIVERED', 'CANCELLED'].includes(o.status)) return false;
    const due = new Date(o.dueDate);
    return due >= now && due <= in48h;
  });
  return { overdue, waitingClient, criticalNext48h };
}

function computePortfolioHealth(clients, obligations, now) {
  const healthCounts = { ok: 0, attention: 0, critical: 0 };
  for (const c of clients) {
    const obs = obligations.filter((o) => o.clientId === c.id);
    const h = clientHealthFromObligations(obs, now);
    healthCounts[h] += 1;
  }
  const totalClients = clients.length || 0;
  const pct = (n) => (totalClients ? Math.round((n / totalClients) * 100) : 0);
  return {
    totalClients,
    portfolioHealth: {
      ok: healthCounts.ok,
      attention: healthCounts.attention,
      critical: healthCounts.critical,
      pctOk: pct(healthCounts.ok),
      pctAttention: pct(healthCounts.attention),
      pctCritical: pct(healthCounts.critical),
    },
  };
}

module.exports = {
  OPEN_STATUSES,
  buildClientLookups,
  enrichObligations,
  partitionOpenObligations,
  computePortfolioHealth,
};
