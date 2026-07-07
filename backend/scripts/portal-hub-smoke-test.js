require('dotenv').config();
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const portalService = require('../src/modules/client/portal.service');
const { isSupabaseConfigured } = require('../src/db/supabase/client');
const clientsRepository = require('../src/db/supabase/repositories/clients.repository');
const firmsRepository = require('../src/db/supabase/repositories/firms.repository');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  assert(
    portalService.normalizeDocumentList({ items: [{ _id: '1' }] }).length === 1,
    'normalizeDocumentList paginated',
  );
  assert(
    portalService.normalizeDocumentList([{ _id: '2' }]).length === 1,
    'normalizeDocumentList array',
  );
  assert(
    portalService.normalizeDocumentList(null).length === 0,
    'normalizeDocumentList null',
  );

  const minimal = portalService.buildMinimalHubResponse({ firmId: 'firm-1' });
  assert(Array.isArray(minimal.obligations), 'minimal obligations array');
  assert(Array.isArray(minimal.documents), 'minimal documents array');
  assert(minimal.firm.id === 'firm-1', 'minimal firm id');

  if (!isSupabaseConfigured()) {
    console.log('✅ unit checks OK (Supabase não configurado — skip integração)');
    process.exit(0);
  }

  let firmId = null;
  const firm = await firmsRepository.findFirmById?.(
    process.env.PORTAL_HUB_TEST_FIRM_ID || '',
  ).catch(() => null);
  if (firm?.id) firmId = firm.id;
  if (!firmId) {
    const { getSupabaseAdmin } = require('../src/db/supabase/client');
    const sb = getSupabaseAdmin();
    const { data } = await sb.from('firms').select('id').limit(1).maybeSingle();
    firmId = data?.id;
  }
  if (!firmId) {
    console.log('✅ unit checks OK (sem firm na BD — skip integração)');
    process.exit(0);
  }

  const clients = await clientsRepository.listClients(firmId, { limit: 5 });
  const client = clients.find((c) => c.linkStatus === 'APPROVED' || !c.linkStatus) || clients[0];
  if (!client) {
    console.log('✅ unit checks OK (sem clientes — skip integração)');
    process.exit(0);
  }

  const actor = {
    id: client.id,
    role: 'CLIENT',
    firmId: firmId,
    clientId: client.id,
  };

  const hub = await portalService.getHubSummary({ actor });
  assert(hub && typeof hub === 'object', 'hub object');
  assert(Array.isArray(hub.obligations), 'hub.obligations');
  assert(Array.isArray(hub.documents), 'hub.documents');
  assert(Array.isArray(hub.tasks), 'hub.tasks');
  assert(Array.isArray(hub.recentMessages), 'hub.recentMessages');
  assert(hub.firm?.id === String(firmId), 'hub firm tenant');

  console.log('✅ portal hub smoke OK', {
    clientId: client.id,
    obligations: hub.obligations.length,
    documents: hub.documents.length,
    tasks: hub.tasks.length,
  });
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ portal hub smoke FAILED:', err.message);
  process.exit(1);
});
