const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const feeChargesRepository = require('../../db/supabase/repositories/client-fee-charges.repository');
const {
  FEE_CHARGE_STATUSES,
  FEE_PAYMENT_METHODS,
  STATUS_LABELS,
} = require('./fee-charges.constants');
const { getPlatformFeePercentLabel } = require('../connect/connect-fees');

function assertYear(year) {
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) {
    throw new AppError('Ano inválido', 400, 'INVALID_YEAR');
  }
  return y;
}

function assertYearMonth(ym) {
  const s = String(ym || '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) {
    throw new AppError('Período inválido (use AAAA-MM)', 400, 'INVALID_YEAR_MONTH');
  }
  return s;
}

function dueDateForMonth(yearMonth, dueDay) {
  const [y, m] = yearMonth.split('-').map(Number);
  const day = Math.min(Math.max(Number(dueDay) || 1, 1), 28);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(day, last);
  return `${yearMonth}-${String(d).padStart(2, '0')}`;
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(charge, today = todayISODate()) {
  if (!charge || charge.status === 'paid' || charge.status === 'cancelled' || charge.status === 'draft') {
    return false;
  }
  if (!['confirmed', 'sent'].includes(charge.status)) return false;
  const due = charge.dueDate ? String(charge.dueDate).slice(0, 10) : null;
  return Boolean(due && due < today);
}

function mapBillingFromClient(client) {
  return {
    retainerAmountCents: client.retainerAmountCents ?? null,
    retainerCurrency: client.retainerCurrency || 'EUR',
    retainerActive: Boolean(client.retainerActive),
    retainerDueDay: client.retainerDueDay || 1,
    retainerStartMonth: client.retainerStartMonth || null,
    retainerEndMonth: client.retainerEndMonth || null,
  };
}

function monthInRetainerRange(yearMonth, client) {
  const start = client.retainerStartMonth || null;
  const end = client.retainerEndMonth || null;
  if (start && yearMonth < start) return false;
  if (end && yearMonth > end) return false;
  return true;
}

/** Lista AAAA-MM inclusiva entre from e to (ordem cronológica). */
function listYearMonthsBetween(fromYm, toYm) {
  const from = assertYearMonth(fromYm);
  const to = assertYearMonth(toYm);
  if (from > to) {
    throw new AppError('O mês inicial não pode ser depois do mês final', 400, 'INVALID_MONTH_RANGE');
  }
  const out = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (out.length > 120) {
      throw new AppError('Intervalo demasiado longo (máx. 120 meses)', 400, 'RANGE_TOO_LONG');
    }
  }
  return out;
}

async function getClientBilling({ firmId, clientId }) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND');
  const year = new Date().getFullYear();
  const charges = await feeChargesRepository.listChargesForClient(firmId, clientId, { year });
  const today = todayISODate();
  return {
    client: {
      id: client.id,
      displayName: client.displayName,
      taxId: client.taxId,
    },
    billing: mapBillingFromClient(client),
    charges: charges.map((c) => ({ ...c, overdue: isOverdue(c, today) })),
    summary: summarizeCharges(charges, today),
  };
}

async function patchClientBilling({ firmId, clientId, patch }) {
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND');

  const next = {};
  if (patch.retainerAmountCents !== undefined) {
    if (patch.retainerAmountCents === null || patch.retainerAmountCents === '') {
      next.retainerAmountCents = null;
    } else {
      const n = Math.round(Number(patch.retainerAmountCents));
      if (!Number.isFinite(n) || n < 0) {
        throw new AppError('Valor da avença inválido', 400, 'INVALID_RETAINER');
      }
      next.retainerAmountCents = n;
    }
  }
  if (patch.retainerActive !== undefined) next.retainerActive = Boolean(patch.retainerActive);
  if (patch.retainerDueDay !== undefined) {
    const d = Math.round(Number(patch.retainerDueDay));
    if (!Number.isInteger(d) || d < 1 || d > 28) {
      throw new AppError('Dia de vencimento deve ser entre 1 e 28', 400, 'INVALID_DUE_DAY');
    }
    next.retainerDueDay = d;
  }
  if (patch.retainerCurrency !== undefined) {
    next.retainerCurrency = String(patch.retainerCurrency || 'EUR').slice(0, 3).toUpperCase();
  }
  if (patch.retainerStartMonth !== undefined) {
    if (patch.retainerStartMonth === null || patch.retainerStartMonth === '') {
      next.retainerStartMonth = null;
    } else {
      next.retainerStartMonth = assertYearMonth(patch.retainerStartMonth);
    }
  }
  if (patch.retainerEndMonth !== undefined) {
    if (patch.retainerEndMonth === null || patch.retainerEndMonth === '') {
      next.retainerEndMonth = null;
    } else {
      next.retainerEndMonth = assertYearMonth(patch.retainerEndMonth);
    }
  }
  const start = next.retainerStartMonth !== undefined ? next.retainerStartMonth : client.retainerStartMonth;
  const end = next.retainerEndMonth !== undefined ? next.retainerEndMonth : client.retainerEndMonth;
  if (start && end && start > end) {
    throw new AppError('O início da avença não pode ser depois do fim', 400, 'INVALID_RETAINER_PERIOD');
  }

  const updated = await clientsRepository.updateClient(clientId, firmId, next);
  return { billing: mapBillingFromClient(updated) };
}

function summarizeCharges(charges, today = todayISODate()) {
  let paidCents = 0;
  let openCents = 0;
  let overdueCents = 0;
  let draftCents = 0;
  for (const c of charges) {
    if (c.status === 'paid') paidCents += c.amountCents;
    else if (c.status === 'draft') draftCents += c.amountCents;
    else if (c.status === 'confirmed' || c.status === 'sent') {
      openCents += c.amountCents;
      if (isOverdue(c, today)) overdueCents += c.amountCents;
    }
  }
  return { paidCents, openCents, overdueCents, draftCents };
}

async function getYearMap({ firmId, year, search, connectStatus }) {
  const y = assertYear(year);
  const clients = await clientsRepository.listClients(firmId, { limit: 500, includeInactive: false });
  const charges = await feeChargesRepository.listChargesForYear(firmId, y);
  const today = todayISODate();

  const byClient = new Map();
  for (const c of charges) {
    if (!byClient.has(c.clientId)) byClient.set(c.clientId, {});
    byClient.get(c.clientId)[c.yearMonth] = { ...c, overdue: isOverdue(c, today) };
  }

  const q = String(search || '').trim().toLowerCase();
  const rows = clients
    .filter((cl) => {
      if (!q) return true;
      const blob = `${cl.displayName || ''} ${cl.taxId || ''}`.toLowerCase();
      return blob.includes(q);
    })
    .map((cl) => {
      const months = byClient.get(cl.id) || {};
      return {
        clientId: cl.id,
        displayName: cl.displayName,
        taxId: cl.taxId,
        billing: mapBillingFromClient(cl),
        months,
      };
    })
    .sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || ''), 'pt'));

  return {
    year: y,
    months: Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`),
    statusLabels: STATUS_LABELS,
    paymentMethods: FEE_PAYMENT_METHODS,
    rows,
    summary: summarizeCharges(charges, today),
    connect: {
      optional: true,
      ready: Boolean(connectStatus?.ready),
      configured: Boolean(connectStatus?.configured),
      platformFeePercent: getPlatformFeePercentLabel(),
      nudge:
        !connectStatus?.ready
          ? 'Pode continuar a registar pagamentos à mão. Se quiser, active recebimentos online para cobrar avenças automaticamente aos seus clientes.'
          : null,
    },
  };
}

async function generateCharges({ firmId, yearMonth, fromYearMonth, toYearMonth, clientIds, actorId }) {
  const months =
    fromYearMonth || toYearMonth
      ? listYearMonthsBetween(fromYearMonth || yearMonth, toYearMonth || yearMonth || fromYearMonth)
      : [assertYearMonth(yearMonth)];

  let clients = await clientsRepository.listClients(firmId, { limit: 500, includeInactive: false });
  if (Array.isArray(clientIds) && clientIds.length) {
    const set = new Set(clientIds.map(String));
    clients = clients.filter((c) => set.has(String(c.id)));
  }
  clients = clients.filter(
    (c) => c.retainerActive && c.retainerAmountCents != null && c.retainerAmountCents > 0,
  );

  const created = [];
  const skipped = [];

  for (const ym of months) {
    for (const client of clients) {
      if (!monthInRetainerRange(ym, client)) {
        skipped.push({ clientId: client.id, yearMonth: ym, reason: 'OUT_OF_RANGE' });
        continue;
      }
      const existing = await feeChargesRepository.findOpenCharge(firmId, client.id, ym);
      if (existing) {
        skipped.push({ clientId: client.id, yearMonth: ym, reason: 'EXISTS', chargeId: existing.id });
        continue;
      }
      const dueDate = dueDateForMonth(ym, client.retainerDueDay);
      const charge = await feeChargesRepository.insertCharge({
        firmId,
        clientId: client.id,
        yearMonth: ym,
        amountCents: client.retainerAmountCents,
        currency: client.retainerCurrency || 'EUR',
        status: 'draft',
        dueDate,
        source: 'bulk',
        createdBy: actorId || null,
      });
      created.push(charge);
    }
  }

  return {
    yearMonth: months.length === 1 ? months[0] : undefined,
    fromYearMonth: months[0],
    toYearMonth: months[months.length - 1],
    months,
    created,
    skipped,
    createdCount: created.length,
    skippedCount: skipped.length,
  };
}

/**
 * Cria (ou devolve) a cobrança de um cliente/mês — célula vazia do mapa.
 */
async function createCharge({ firmId, clientId, yearMonth, amountCents, status, dueDate, actorId }) {
  const ym = assertYearMonth(yearMonth);
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND');

  const existing = await feeChargesRepository.findOpenCharge(firmId, clientId, ym);
  if (existing) {
    return { charge: { ...existing, overdue: isOverdue(existing) }, created: false };
  }

  let cents = amountCents != null ? Math.round(Number(amountCents)) : null;
  if (cents == null || !Number.isFinite(cents)) {
    cents = client.retainerAmountCents != null ? Number(client.retainerAmountCents) : null;
  }
  if (!Number.isFinite(cents) || cents < 0) {
    throw new AppError('Indique o valor da avença', 400, 'INVALID_AMOUNT');
  }

  const st = status && FEE_CHARGE_STATUSES.includes(String(status)) ? String(status) : 'draft';
  const due =
    dueDate ||
    dueDateForMonth(ym, client.retainerDueDay || 1);

  const charge = await feeChargesRepository.insertCharge({
    firmId,
    clientId,
    yearMonth: ym,
    amountCents: cents,
    currency: client.retainerCurrency || 'EUR',
    status: st,
    dueDate: due,
    paidAt: st === 'paid' ? new Date().toISOString() : null,
    source: 'manual',
    createdBy: actorId || null,
  });

  return { charge: { ...charge, overdue: isOverdue(charge) }, created: true };
}

/**
 * Replica valor (e opcionalmente estado) de uma avença para um intervalo de meses
 * do mesmo cliente — cria em falta; actualiza rascunhos se overwriteDrafts.
 */
async function replicateCharges({
  firmId,
  clientId,
  fromYearMonth,
  toYearMonth,
  amountCents,
  status,
  paymentMethod,
  actorId,
  overwriteDrafts = true,
}) {
  const id = String(clientId || '').trim();
  if (!id) throw new AppError('Cliente obrigatório', 400, 'CLIENT_REQUIRED');
  const client = await clientsRepository.findClientById(firmId, id);
  if (!client) throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND');

  const months = listYearMonthsBetween(fromYearMonth, toYearMonth);
  let cents = amountCents != null ? Math.round(Number(amountCents)) : null;
  if (cents == null || !Number.isFinite(cents)) {
    cents = client.retainerAmountCents != null ? Number(client.retainerAmountCents) : null;
  }
  if (!Number.isFinite(cents) || cents < 0) {
    throw new AppError('Indique o valor a replicar', 400, 'INVALID_AMOUNT');
  }

  const st =
    status && FEE_CHARGE_STATUSES.includes(String(status)) && String(status) !== 'cancelled'
      ? String(status)
      : 'draft';
  let method = paymentMethod === null || paymentMethod === '' ? null : paymentMethod;
  if (method !== undefined && method !== null) {
    method = String(method);
    if (!FEE_PAYMENT_METHODS.some((x) => x.id === method)) {
      throw new AppError('Método de pagamento inválido', 400, 'INVALID_METHOD');
    }
  }

  const created = [];
  const updated = [];
  const skipped = [];

  for (const ym of months) {
    const existing = await feeChargesRepository.findOpenCharge(firmId, id, ym);
    if (existing) {
      if (overwriteDrafts && existing.status === 'draft') {
        const patched = await feeChargesRepository.updateCharge(existing.id, firmId, {
          amountCents: cents,
          status: st,
          paymentMethod: method !== undefined ? method : existing.paymentMethod,
          dueDate: dueDateForMonth(ym, client.retainerDueDay || 1),
          paidAt: st === 'paid' ? new Date().toISOString() : null,
        });
        updated.push(patched);
      } else {
        skipped.push({ clientId: id, yearMonth: ym, reason: 'EXISTS', chargeId: existing.id });
      }
      continue;
    }
    const charge = await feeChargesRepository.insertCharge({
      firmId,
      clientId: id,
      yearMonth: ym,
      amountCents: cents,
      currency: client.retainerCurrency || 'EUR',
      status: st,
      paymentMethod: method || null,
      dueDate: dueDateForMonth(ym, client.retainerDueDay || 1),
      paidAt: st === 'paid' ? new Date().toISOString() : null,
      source: 'bulk',
      createdBy: actorId || null,
    });
    created.push(charge);
  }

  return {
    clientId: id,
    fromYearMonth: months[0],
    toYearMonth: months[months.length - 1],
    months,
    created,
    updated,
    skipped,
    createdCount: created.length,
    updatedCount: updated.length,
    skippedCount: skipped.length,
  };
}

async function patchCharge({ firmId, chargeId, patch }) {
  const existing = await feeChargesRepository.findChargeById(firmId, chargeId);
  if (!existing) throw new AppError('Pagamento não encontrado', 404, 'CHARGE_NOT_FOUND');

  const next = {};
  if (patch.amountCents !== undefined) {
    const n = Math.round(Number(patch.amountCents));
    if (!Number.isFinite(n) || n < 0) throw new AppError('Valor inválido', 400, 'INVALID_AMOUNT');
    next.amountCents = n;
  }
  if (patch.status !== undefined) {
    const st = String(patch.status);
    if (!FEE_CHARGE_STATUSES.includes(st)) {
      throw new AppError('Estado inválido', 400, 'INVALID_STATUS');
    }
    next.status = st;
    if (st === 'paid' && patch.paidAt === undefined && !existing.paidAt) {
      next.paidAt = new Date().toISOString();
    }
    if (st !== 'paid' && patch.paidAt === undefined) {
      next.paidAt = null;
    }
  }
  if (patch.paymentMethod !== undefined) {
    const m = patch.paymentMethod === null || patch.paymentMethod === '' ? null : String(patch.paymentMethod);
    if (m && !FEE_PAYMENT_METHODS.some((x) => x.id === m)) {
      throw new AppError('Método de pagamento inválido', 400, 'INVALID_METHOD');
    }
    next.paymentMethod = m;
  }
  if (patch.paidAt !== undefined) next.paidAt = patch.paidAt;
  if (patch.dueDate !== undefined) next.dueDate = patch.dueDate;
  if (patch.notes !== undefined) {
    next.notes = patch.notes == null ? null : String(patch.notes).slice(0, 2000);
  }

  const updated = await feeChargesRepository.updateCharge(chargeId, firmId, next);
  return { charge: { ...updated, overdue: isOverdue(updated) } };
}

module.exports = {
  getClientBilling,
  patchClientBilling,
  getYearMap,
  generateCharges,
  replicateCharges,
  createCharge,
  patchCharge,
  isOverdue,
  dueDateForMonth,
  summarizeCharges,
  assertYearMonth,
};
