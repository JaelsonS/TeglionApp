/**
 * Serviços personalizados (sem catalogKey) no Maya Setup.
 */
function parseCustomServices(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 6)
    .map((item) => {
      const name = String(item?.name || '').trim().slice(0, 200);
      if (!name) return null;
      const description = item?.description != null ? String(item.description).trim().slice(0, 4000) : null;
      let durationMinutes = Number(item?.durationMinutes);
      if (!Number.isFinite(durationMinutes) || durationMinutes < 15) durationMinutes = 60;
      if (durationMinutes > 480) durationMinutes = 480;
      let priceCents = Number(item?.priceCents);
      if (!Number.isFinite(priceCents) || priceCents < 0) priceCents = 0;
      if (priceCents > 99999999) priceCents = 99999999;
      return { name, description: description || null, durationMinutes, priceCents };
    })
    .filter(Boolean);
}

module.exports = { parseCustomServices };
