const { AppError } = require('../../middlewares/error.middleware');
const clientsRepository = require('../../db/supabase/repositories/clients.repository');
const rentalsRepository = require('../../db/supabase/repositories/client-rentals.repository');
const {
  PROPERTY_STATUSES,
  LEASE_STATUSES,
  LEASE_TYPES,
  RECEIPT_STATUSES,
  RECEIPT_STATUS_LABELS,
  RENT_PAYMENT_METHODS,
  INTERNAL_DISCLAIMER,
} = require('./rentals.constants');

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

function isOverdue(receipt, today = todayISODate()) {
  if (!receipt || receipt.status === 'paid' || receipt.status === 'cancelled' || receipt.status === 'draft') {
    return false;
  }
  if (receipt.status !== 'issued') return false;
  const due = receipt.dueDate ? String(receipt.dueDate).slice(0, 10) : null;
  return Boolean(due && due < today);
}

function summarizeReceipts(receipts, today = todayISODate()) {
  let paidCents = 0;
  let openCents = 0;
  let overdueCents = 0;
  let draftCents = 0;
  for (const r of receipts) {
    if (r.status === 'paid') paidCents += r.amountCents;
    else if (r.status === 'draft') draftCents += r.amountCents;
    else if (r.status === 'issued') {
      openCents += r.amountCents;
      if (isOverdue(r, today)) overdueCents += r.amountCents;
    }
  }
  return { paidCents, openCents, overdueCents, draftCents };
}

function trimOrNull(v, max = 500) {
  if (v == null || v === '') return null;
  return String(v).trim().slice(0, max);
}

async function getMeta() {
  return {
    disclaimer: INTERNAL_DISCLAIMER,
    propertyStatuses: PROPERTY_STATUSES,
    leaseStatuses: LEASE_STATUSES,
    leaseTypes: LEASE_TYPES,
    receiptStatuses: RECEIPT_STATUS_LABELS,
    paymentMethods: RENT_PAYMENT_METHODS,
  };
}

async function listOverview({ firmId, year, search }) {
  const y = assertYear(year || new Date().getFullYear());
  const properties = await rentalsRepository.listProperties(firmId, { status: 'active' });
  const leases = await rentalsRepository.listLeasesForFirm(firmId);
  const receipts = await rentalsRepository.listReceiptsForYear(firmId, y);
  const today = todayISODate();

  const clientIds = [...new Set(properties.map((p) => p.clientId))];
  const clients = await clientsRepository.listClients(firmId, { limit: 500, includeInactive: true });
  const clientById = new Map(clients.map((c) => [c.id, c]));

  const leasesByProperty = new Map();
  for (const l of leases) {
    if (!leasesByProperty.has(l.propertyId)) leasesByProperty.set(l.propertyId, []);
    leasesByProperty.get(l.propertyId).push(l);
  }

  const receiptsByLease = new Map();
  for (const r of receipts) {
    if (!receiptsByLease.has(r.leaseId)) receiptsByLease.set(r.leaseId, {});
    receiptsByLease.get(r.leaseId)[r.yearMonth] = { ...r, overdue: isOverdue(r, today) };
  }

  const q = String(search || '').trim().toLowerCase();
  const rows = properties
    .map((p) => {
      const client = clientById.get(p.clientId);
      const propLeases = (leasesByProperty.get(p.id) || []).map((l) => ({
        ...l,
        months: receiptsByLease.get(l.id) || {},
      }));
      return {
        property: p,
        client: client
          ? { id: client.id, displayName: client.displayName, taxId: client.taxId }
          : { id: p.clientId, displayName: 'Cliente', taxId: null },
        leases: propLeases,
      };
    })
    .filter((row) => {
      if (!q) return true;
      const blob = [
        row.property.label,
        row.property.addressLine,
        row.property.locality,
        row.client.displayName,
        row.client.taxId,
        ...row.leases.map((l) => l.tenantDisplayName),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    })
    .filter((row) => clientIds.includes(row.property.clientId) || !clientIds.length)
    .sort((a, b) =>
      String(a.property.label || '').localeCompare(String(b.property.label || ''), 'pt'),
    );

  return {
    year: y,
    months: Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`),
    statusLabels: RECEIPT_STATUS_LABELS,
    paymentMethods: RENT_PAYMENT_METHODS,
    disclaimer: INTERNAL_DISCLAIMER,
    rows,
    summary: summarizeReceipts(receipts, today),
  };
}

async function createProperty({ firmId, payload }) {
  const clientId = String(payload.clientId || '');
  if (!clientId) throw new AppError('Cliente obrigatório', 400, 'CLIENT_REQUIRED');
  const client = await clientsRepository.findClientById(firmId, clientId);
  if (!client) throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND');

  const label = trimOrNull(payload.label, 200);
  if (!label) throw new AppError('Identificação do imóvel obrigatória', 400, 'LABEL_REQUIRED');

  const property = await rentalsRepository.insertProperty({
    firmId,
    clientId,
    label,
    addressLine: trimOrNull(payload.addressLine, 300),
    postalCode: trimOrNull(payload.postalCode, 20),
    locality: trimOrNull(payload.locality, 120),
    artigoMatricial: trimOrNull(payload.artigoMatricial, 80),
    notes: trimOrNull(payload.notes, 2000),
    status: 'active',
  });
  return { property };
}

async function patchProperty({ firmId, propertyId, patch }) {
  const existing = await rentalsRepository.findPropertyById(firmId, propertyId);
  if (!existing) throw new AppError('Imóvel não encontrado', 404, 'PROPERTY_NOT_FOUND');

  const next = {};
  if (patch.label !== undefined) {
    const label = trimOrNull(patch.label, 200);
    if (!label) throw new AppError('Identificação do imóvel obrigatória', 400, 'LABEL_REQUIRED');
    next.label = label;
  }
  if (patch.addressLine !== undefined) next.addressLine = trimOrNull(patch.addressLine, 300);
  if (patch.postalCode !== undefined) next.postalCode = trimOrNull(patch.postalCode, 20);
  if (patch.locality !== undefined) next.locality = trimOrNull(patch.locality, 120);
  if (patch.artigoMatricial !== undefined) next.artigoMatricial = trimOrNull(patch.artigoMatricial, 80);
  if (patch.notes !== undefined) next.notes = trimOrNull(patch.notes, 2000);
  if (patch.status !== undefined) {
    const st = String(patch.status);
    if (!PROPERTY_STATUSES.includes(st)) throw new AppError('Estado inválido', 400, 'INVALID_STATUS');
    next.status = st;
  }

  const property = await rentalsRepository.updateProperty(propertyId, firmId, next);
  return { property };
}

async function createLease({ firmId, propertyId, payload }) {
  const property = await rentalsRepository.findPropertyById(firmId, propertyId);
  if (!property) throw new AppError('Imóvel não encontrado', 404, 'PROPERTY_NOT_FOUND');

  const tenantDisplayName = trimOrNull(payload.tenantDisplayName, 200);
  if (!tenantDisplayName) {
    throw new AppError('Nome do inquilino obrigatório', 400, 'TENANT_REQUIRED');
  }
  const startDate = trimOrNull(payload.startDate, 10);
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new AppError('Data de início inválida', 400, 'INVALID_START_DATE');
  }
  const rent = Math.round(Number(payload.monthlyRentCents));
  if (!Number.isFinite(rent) || rent < 0) {
    throw new AppError('Renda mensal inválida', 400, 'INVALID_RENT');
  }
  const dueDay = Math.round(Number(payload.rentDueDay ?? 1));
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
    throw new AppError('Dia de vencimento deve ser entre 1 e 28', 400, 'INVALID_DUE_DAY');
  }
  const leaseType = String(payload.leaseType || 'habitacao');
  if (!LEASE_TYPES.some((t) => t.id === leaseType)) {
    throw new AppError('Tipo de contrato inválido', 400, 'INVALID_LEASE_TYPE');
  }
  const status = String(payload.status || 'active');
  if (!LEASE_STATUSES.includes(status)) {
    throw new AppError('Estado do contrato inválido', 400, 'INVALID_STATUS');
  }

  const lease = await rentalsRepository.insertLease({
    firmId,
    propertyId,
    tenantDisplayName,
    tenantNif: trimOrNull(payload.tenantNif, 20),
    tenantEmail: trimOrNull(payload.tenantEmail, 200),
    tenantPhone: trimOrNull(payload.tenantPhone, 40),
    startDate,
    endDate: trimOrNull(payload.endDate, 10),
    monthlyRentCents: rent,
    currency: String(payload.currency || 'EUR').slice(0, 3).toUpperCase(),
    rentDueDay: dueDay,
    leaseType,
    status,
    notes: trimOrNull(payload.notes, 2000),
  });
  return { lease };
}

async function patchLease({ firmId, leaseId, patch }) {
  const existing = await rentalsRepository.findLeaseById(firmId, leaseId);
  if (!existing) throw new AppError('Contrato não encontrado', 404, 'LEASE_NOT_FOUND');

  const next = {};
  if (patch.tenantDisplayName !== undefined) {
    const name = trimOrNull(patch.tenantDisplayName, 200);
    if (!name) throw new AppError('Nome do inquilino obrigatório', 400, 'TENANT_REQUIRED');
    next.tenantDisplayName = name;
  }
  if (patch.tenantNif !== undefined) next.tenantNif = trimOrNull(patch.tenantNif, 20);
  if (patch.tenantEmail !== undefined) next.tenantEmail = trimOrNull(patch.tenantEmail, 200);
  if (patch.tenantPhone !== undefined) next.tenantPhone = trimOrNull(patch.tenantPhone, 40);
  if (patch.startDate !== undefined) {
    const d = trimOrNull(patch.startDate, 10);
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      throw new AppError('Data de início inválida', 400, 'INVALID_START_DATE');
    }
    next.startDate = d;
  }
  if (patch.endDate !== undefined) next.endDate = trimOrNull(patch.endDate, 10);
  if (patch.monthlyRentCents !== undefined) {
    const rent = Math.round(Number(patch.monthlyRentCents));
    if (!Number.isFinite(rent) || rent < 0) {
      throw new AppError('Renda mensal inválida', 400, 'INVALID_RENT');
    }
    next.monthlyRentCents = rent;
  }
  if (patch.rentDueDay !== undefined) {
    const dueDay = Math.round(Number(patch.rentDueDay));
    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28) {
      throw new AppError('Dia de vencimento deve ser entre 1 e 28', 400, 'INVALID_DUE_DAY');
    }
    next.rentDueDay = dueDay;
  }
  if (patch.leaseType !== undefined) {
    const leaseType = String(patch.leaseType);
    if (!LEASE_TYPES.some((t) => t.id === leaseType)) {
      throw new AppError('Tipo de contrato inválido', 400, 'INVALID_LEASE_TYPE');
    }
    next.leaseType = leaseType;
  }
  if (patch.status !== undefined) {
    const status = String(patch.status);
    if (!LEASE_STATUSES.includes(status)) {
      throw new AppError('Estado do contrato inválido', 400, 'INVALID_STATUS');
    }
    next.status = status;
  }
  if (patch.notes !== undefined) next.notes = trimOrNull(patch.notes, 2000);
  if (patch.currency !== undefined) {
    next.currency = String(patch.currency || 'EUR').slice(0, 3).toUpperCase();
  }

  const lease = await rentalsRepository.updateLease(leaseId, firmId, next);
  return { lease };
}

async function generateReceipts({ firmId, yearMonth, leaseIds, actorId }) {
  const ym = assertYearMonth(yearMonth);
  let leases = await rentalsRepository.listActiveLeases(firmId);
  if (Array.isArray(leaseIds) && leaseIds.length) {
    const set = new Set(leaseIds.map(String));
    leases = leases.filter((l) => set.has(String(l.id)));
  }
  leases = leases.filter((l) => l.monthlyRentCents != null && l.monthlyRentCents >= 0);

  const created = [];
  const skipped = [];

  for (const lease of leases) {
    // Contrato ainda não iniciado neste mês
    if (lease.startDate && String(lease.startDate).slice(0, 7) > ym) {
      skipped.push({ leaseId: lease.id, reason: 'NOT_STARTED' });
      continue;
    }
    if (lease.endDate && String(lease.endDate).slice(0, 7) < ym) {
      skipped.push({ leaseId: lease.id, reason: 'ENDED' });
      continue;
    }

    const existing = await rentalsRepository.findOpenReceipt(firmId, lease.id, ym);
    if (existing) {
      skipped.push({ leaseId: lease.id, reason: 'EXISTS', receiptId: existing.id });
      continue;
    }

    const receipt = await rentalsRepository.insertReceipt({
      firmId,
      leaseId: lease.id,
      yearMonth: ym,
      amountCents: lease.monthlyRentCents,
      currency: lease.currency || 'EUR',
      status: 'draft',
      dueDate: dueDateForMonth(ym, lease.rentDueDay),
      source: 'bulk',
      createdBy: actorId || null,
    });
    created.push(receipt);
  }

  return {
    yearMonth: ym,
    created,
    skipped,
    createdCount: created.length,
    skippedCount: skipped.length,
    disclaimer: INTERNAL_DISCLAIMER,
  };
}

async function createReceipt({ firmId, leaseId, yearMonth, amountCents, status, dueDate, actorId }) {
  const ym = assertYearMonth(yearMonth);
  const lease = await rentalsRepository.findLeaseById(firmId, leaseId);
  if (!lease) throw new AppError('Contrato não encontrado', 404, 'LEASE_NOT_FOUND');

  const existing = await rentalsRepository.findOpenReceipt(firmId, leaseId, ym);
  if (existing) {
    return {
      receipt: { ...existing, overdue: isOverdue(existing) },
      created: false,
      disclaimer: INTERNAL_DISCLAIMER,
    };
  }

  let cents = amountCents != null ? Math.round(Number(amountCents)) : Number(lease.monthlyRentCents);
  if (!Number.isFinite(cents) || cents < 0) {
    throw new AppError('Valor inválido', 400, 'INVALID_AMOUNT');
  }
  const st = status && RECEIPT_STATUSES.includes(String(status)) ? String(status) : 'draft';
  const due = dueDate || dueDateForMonth(ym, lease.rentDueDay);

  const receipt = await rentalsRepository.insertReceipt({
    firmId,
    leaseId,
    yearMonth: ym,
    amountCents: cents,
    currency: lease.currency || 'EUR',
    status: st,
    dueDate: due,
    paidAt: st === 'paid' ? new Date().toISOString() : null,
    source: 'manual',
    createdBy: actorId || null,
  });

  return {
    receipt: { ...receipt, overdue: isOverdue(receipt) },
    created: true,
    disclaimer: INTERNAL_DISCLAIMER,
  };
}

async function patchReceipt({ firmId, receiptId, patch }) {
  const existing = await rentalsRepository.findReceiptById(firmId, receiptId);
  if (!existing) throw new AppError('Recibo não encontrado', 404, 'RECEIPT_NOT_FOUND');

  const next = {};
  if (patch.amountCents !== undefined) {
    const n = Math.round(Number(patch.amountCents));
    if (!Number.isFinite(n) || n < 0) throw new AppError('Valor inválido', 400, 'INVALID_AMOUNT');
    next.amountCents = n;
  }
  if (patch.status !== undefined) {
    const st = String(patch.status);
    if (!RECEIPT_STATUSES.includes(st)) {
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
    if (m && !RENT_PAYMENT_METHODS.some((x) => x.id === m)) {
      throw new AppError('Método de pagamento inválido', 400, 'INVALID_METHOD');
    }
    next.paymentMethod = m;
  }
  if (patch.paidAt !== undefined) next.paidAt = patch.paidAt;
  if (patch.dueDate !== undefined) next.dueDate = patch.dueDate;
  if (patch.notes !== undefined) {
    next.notes = patch.notes == null ? null : String(patch.notes).slice(0, 2000);
  }

  const updated = await rentalsRepository.updateReceipt(receiptId, firmId, next);
  return { receipt: { ...updated, overdue: isOverdue(updated) }, disclaimer: INTERNAL_DISCLAIMER };
}

module.exports = {
  getMeta,
  listOverview,
  createProperty,
  patchProperty,
  createLease,
  patchLease,
  generateReceipts,
  createReceipt,
  patchReceipt,
  isOverdue,
  dueDateForMonth,
  summarizeReceipts,
  assertYearMonth,
  INTERNAL_DISCLAIMER,
};
