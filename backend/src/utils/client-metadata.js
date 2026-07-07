/**
 * Perfil fiscal/empresarial em clients.metadata (JSONB).
 */
const { safeDecryptText } = require('./safe-display-text');

const MAX_CAE_SECONDARY = 4;
const MAX_CONTACTS = 8;

const FISCAL_FIELD_LABELS = {
  clientType: 'Tipo de cliente',
  legalForm: 'Forma jurídica',
  accountingType: 'Tipo de contabilidade',
  legalName: 'Razão social',
  address: 'Morada',
  caePrimary: 'CAE principal',
  caeSecondary: 'CAE secundários',
  shareCapital: 'Capital social',
  incorporationDate: 'Data de constituição',
  activityStartDate: 'Início de actividade',
  vatRegime: 'Regime de IVA',
  vatExemptionReason: 'Motivo da isenção',
  irsFramework: 'Enquadramento IRS/IRC',
  socialSecurity: 'Segurança Social',
  identification: 'Identificação',
  contacts: 'Contactos',
  notes: 'Observações',
  assignedStaffLabel: 'Responsável no escritório',
};

function trimOrNull(v, max = 2000) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.slice(0, max);
}

function normalizeClientType(value) {
  const raw = trimOrNull(value, 60);
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (upper === 'COMPANY' || upper === 'SELF_EMPLOYED' || upper === 'INDIVIDUAL') return upper;
  if (upper === 'EMPRESA') return 'COMPANY';
  if (upper === 'INDEPENDENTE' || upper === 'TRABALHADOR INDEPENDENTE') return 'SELF_EMPLOYED';
  if (upper === 'PARTICULAR') return 'INDIVIDUAL';
  return raw;
}

function normalizeYesNo(value) {
  if (value === true || value === 'true' || value === 'Sim' || value === 'sim' || value === 1) return true;
  if (value === false || value === 'false' || value === 'Não' || value === 'nao' || value === 'não' || value === 0) return false;
  return null;
}

function normalizeAddress(input) {
  if (!input) return null;
  if (typeof input === 'string') return trimOrNull(input, 500);
  if (typeof input !== 'object') return null;
  const parts = [
    trimOrNull(input.street, 300),
    trimOrNull(input.district, 120),
    trimOrNull(input.municipality, 120),
    trimOrNull(input.parish, 120),
    trimOrNull(input.postalCode, 20),
  ].filter(Boolean);
  if (!parts.length) return null;
  return {
    street: trimOrNull(input.street, 300),
    district: trimOrNull(input.district, 120),
    municipality: trimOrNull(input.municipality, 120),
    parish: trimOrNull(input.parish, 120),
    postalCode: trimOrNull(input.postalCode, 20),
    formatted: parts.join(' · '),
  };
}

function normalizeContacts(list) {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, MAX_CONTACTS)
    .map((c) => ({
      name: trimOrNull(c?.name, 140),
      role: trimOrNull(c?.role, 80),
      phone: trimOrNull(c?.phone, 40),
      email: trimOrNull(c?.email, 140)?.toLowerCase() || null,
    }))
    .filter((c) => c.name || c.phone || c.email);
}

function normalizeCaeSecondary(list) {
  if (!Array.isArray(list)) return [];
  return list.map((v) => trimOrNull(v, 120)).filter(Boolean).slice(0, MAX_CAE_SECONDARY);
}

function normalizeMetadataPatch(patch) {
  if (!patch || typeof patch !== 'object') return {};
  const out = {};
  if (patch.clientType !== undefined) out.clientType = normalizeClientType(patch.clientType);
  if (patch.legalForm !== undefined) out.legalForm = trimOrNull(patch.legalForm, 120);
  if (patch.accountingType !== undefined) out.accountingType = trimOrNull(patch.accountingType, 80);
  if (patch.legalName !== undefined) out.legalName = trimOrNull(patch.legalName, 200);
  if (patch.services !== undefined) {
    out.services = Array.isArray(patch.services)
      ? patch.services.map((s) => trimOrNull(s, 80)).filter(Boolean).slice(0, 24)
      : [];
  }
  if (patch.address !== undefined) out.address = normalizeAddress(patch.address);
  if (patch.caePrimary !== undefined) out.caePrimary = trimOrNull(patch.caePrimary, 120);
  if (patch.caeSecondary !== undefined) out.caeSecondary = normalizeCaeSecondary(patch.caeSecondary);
  if (patch.shareCapital !== undefined) out.shareCapital = trimOrNull(patch.shareCapital, 40);
  if (patch.incorporationDate !== undefined) out.incorporationDate = trimOrNull(patch.incorporationDate, 12);
  if (patch.activityStartDate !== undefined) out.activityStartDate = trimOrNull(patch.activityStartDate, 12);
  if (patch.vatRegime !== undefined) out.vatRegime = trimOrNull(patch.vatRegime, 200);
  if (patch.vatExemptionReason !== undefined) out.vatExemptionReason = trimOrNull(patch.vatExemptionReason, 300);
  if (patch.irsFramework !== undefined) out.irsFramework = trimOrNull(patch.irsFramework, 200);
  if (patch.socialSecurity !== undefined && patch.socialSecurity && typeof patch.socialSecurity === 'object') {
    out.socialSecurity = {
      area: trimOrNull(patch.socialSecurity.area, 140),
      oneYearExemption: normalizeYesNo(patch.socialSecurity.oneYearExemption),
      startDate: trimOrNull(patch.socialSecurity.startDate, 12),
      quarterlyDeclaration: normalizeYesNo(patch.socialSecurity.quarterlyDeclaration),
    };
  }
  if (patch.identification !== undefined && patch.identification && typeof patch.identification === 'object') {
    out.identification = {
      spouse: normalizeYesNo(patch.identification.spouse),
      irsDelivery: normalizeYesNo(patch.identification.irsDelivery),
      validateEInvoice: normalizeYesNo(patch.identification.validateEInvoice),
      communicateHousehold: normalizeYesNo(patch.identification.communicateHousehold),
    };
  }
  if (patch.contacts !== undefined) out.contacts = normalizeContacts(patch.contacts);
  if (patch.notes !== undefined) out.notes = trimOrNull(patch.notes, 4000);
  if (patch.assignedStaffLabel !== undefined) out.assignedStaffLabel = trimOrNull(patch.assignedStaffLabel, 140);
  return out;
}

function mergeMetadata(current, patch) {
  const base = current && typeof current === 'object' ? { ...current } : {};
  const normalized = normalizeMetadataPatch(patch);
  return { ...base, ...normalized };
}

function diffMetadata(before, after) {
  const changes = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of keys) {
    const prev = before?.[key];
    const next = after?.[key];
    if (JSON.stringify(prev) === JSON.stringify(next)) continue;
    changes.push({
      field: key,
      label: FISCAL_FIELD_LABELS[key] || key,
      from: prev ?? null,
      to: next ?? null,
    });
  }
  return changes;
}

function emptyFiscalProfile() {
  return {
    clientType: null,
    legalForm: null,
    accountingType: null,
    legalName: null,
    address: null,
    caePrimary: null,
    caeSecondary: [],
    shareCapital: null,
    incorporationDate: null,
    activityStartDate: null,
    vatRegime: null,
    vatExemptionReason: null,
    irsFramework: null,
    socialSecurity: {
      area: null,
      oneYearExemption: null,
      startDate: null,
      quarterlyDeclaration: null,
    },
    identification: {
      spouse: null,
      irsDelivery: null,
      validateEInvoice: null,
      communicateHousehold: null,
    },
    contacts: [],
    notes: null,
    assignedStaffLabel: null,
  };
}

function resolveFiscalProfile(metadata) {
  const m = metadata && typeof metadata === 'object' ? metadata : {};
  return {
    ...emptyFiscalProfile(),
    clientType: normalizeClientType(m.clientType),
    legalForm: m.legalForm || null,
    accountingType: m.accountingType || null,
    legalName: m.legalName || null,
    services: Array.isArray(m.services) ? m.services.filter(Boolean) : [],
    address: m.address || null,
    caePrimary: m.caePrimary || null,
    caeSecondary: normalizeCaeSecondary(m.caeSecondary),
    shareCapital: m.shareCapital || null,
    incorporationDate: m.incorporationDate || null,
    activityStartDate: m.activityStartDate || m.incorporationDate || null,
    vatRegime: m.vatRegime || null,
    vatExemptionReason: m.vatExemptionReason || null,
    irsFramework: m.irsFramework || null,
    socialSecurity: {
      area: m.socialSecurity?.area || null,
      oneYearExemption: normalizeYesNo(m.socialSecurity?.oneYearExemption),
      startDate: m.socialSecurity?.startDate || null,
      quarterlyDeclaration: normalizeYesNo(m.socialSecurity?.quarterlyDeclaration),
    },
    identification: {
      spouse: normalizeYesNo(m.identification?.spouse),
      irsDelivery: normalizeYesNo(m.identification?.irsDelivery),
      validateEInvoice: normalizeYesNo(m.identification?.validateEInvoice),
      communicateHousehold: normalizeYesNo(m.identification?.communicateHousehold),
    },
    contacts: normalizeContacts(m.contacts),
    notes: safeDecryptText(m.notes) || null,
    assignedStaffLabel: m.assignedStaffLabel || null,
  };
}

module.exports = {
  FISCAL_FIELD_LABELS,
  normalizeMetadataPatch,
  mergeMetadata,
  diffMetadata,
  resolveFiscalProfile,
  emptyFiscalProfile,
};
