const { AppError } = require('../../middlewares/error.middleware');
const clientsService = require('../firm/clients.service');

const DEMO_NOTE = 'Cliente fictício criado pelo modo demonstração Teglion — pode apagar ou substituir.';

function parseDemoFirmAllowlist() {
  return String(process.env.MAYA_DEMO_OFFICE_FIRM_IDS || process.env.MAYA_SETUP_FREE_FIRM_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isDemoOfficeEnabled() {
  if (process.env.MAYA_DEMO_OFFICE_ENABLED !== '1') return false;
  if (process.env.NODE_ENV === 'production' && process.env.TEGLION_ALLOW_DEMO_OFFICE_IN_PROD !== '1') {
    return false;
  }
  return true;
}

function assertDemoOfficeAllowed(firmId) {
  if (!isDemoOfficeEnabled()) {
    throw new AppError('Modo demonstração não disponível neste ambiente.', 403, {
      code: 'MAYA_DEMO_OFFICE_DISABLED',
    });
  }
  const allow = parseDemoFirmAllowlist();
  if (allow.length && !allow.includes(String(firmId))) {
    throw new AppError('Modo demonstração restrito a escritórios piloto.', 403, {
      code: 'MAYA_DEMO_OFFICE_NOT_ALLOWED',
    });
  }
}

const DEMO_CLIENTS_PT = [
  { displayName: 'Empresa Exemplo Lda (demonstração)', email: 'demo.empresa@example.invalid' },
  { displayName: 'Autónomo Exemplo (demonstração)', email: 'demo.autonomo@example.invalid' },
  { displayName: 'Particular Exemplo (demonstração)', email: 'demo.particular@example.invalid' },
];

const DEMO_CLIENTS_BR = [
  { displayName: 'Empresa Exemplo Ltda (demonstração)', email: 'demo.empresa@example.invalid' },
  { displayName: 'MEI Exemplo (demonstração)', email: 'demo.mei@example.invalid' },
];

async function seedDemoClients({ firmId, actorUserId, countryCode }) {
  assertDemoOfficeAllowed(firmId);
  const list = String(countryCode || 'PT').toUpperCase() === 'BR' ? DEMO_CLIENTS_BR : DEMO_CLIENTS_PT;
  const created = [];
  for (const row of list) {
    const { client } = await clientsService.createClient({
      firmId,
      displayName: row.displayName,
      email: row.email,
      phone: null,
      taxId: null,
      metadata: { notes: DEMO_NOTE },
      actor: { id: actorUserId, role: 'FIRM_OWNER', fullName: 'Configuração rápida' },
    });
    created.push(client.id);
  }
  return { createdCount: created.length, clientIds: created };
}

module.exports = {
  isDemoOfficeEnabled,
  assertDemoOfficeAllowed,
  seedDemoClients,
  parseDemoFirmAllowlist,
};
