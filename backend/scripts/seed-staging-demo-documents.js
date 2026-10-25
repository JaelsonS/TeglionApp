#!/usr/bin/env node
/**
 * STAGING — substitui documentos de demo partidos por PDFs válidos e abertos.
 *
 * Só corre contra .env.staging. Recusa PROD.
 *
 *   node backend/scripts/seed-staging-demo-documents.js
 *   SEED_OWNER_EMAIL=jaelsonsilva345@gmail.com node backend/scripts/seed-staging-demo-documents.js
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const REPO_ROOT = path.resolve(__dirname, '../..');
const STAGING_ENV = path.join(REPO_ROOT, '.env.staging');
if (!fs.existsSync(STAGING_ENV)) {
  console.error('Falta .env.staging na raiz do repositório.');
  process.exit(1);
}
dotenv.config({ path: STAGING_ENV, override: true });

const OWNER_EMAIL = (process.env.SEED_OWNER_EMAIL || 'jaelsonsilva345@gmail.com').trim().toLowerCase();
const DEMO_SEED = process.env.SEED_DEMO_ID || 'silva-associados-v1';
const MARKER = `<!--${DEMO_SEED}-->`;

function assertStagingOnly() {
  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '');
  const ref = String(process.env.SUPABASE_PROJECT_REF || '');
  const blob = `${url} ${ref} ${process.env.DATABASE_URL || ''}`.toLowerCase();
  if (/prod|production|teglion-prod/i.test(blob) && !/staging|stg/i.test(blob)) {
    console.error('Recusado: parece ambiente de PRODUÇÃO. Este script é só STAGING.');
    process.exit(1);
  }
}

const { isSupabaseConfigured } = require('../src/db/supabase/client');
const firmsRepository = require('../src/db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../src/db/supabase/repositories/firm-users.repository');
const clientsRepository = require('../src/db/supabase/repositories/clients.repository');
const documentsRepository = require('../src/db/supabase/repositories/contabil/documents.repository');
const contabilStorage = require('../src/services/storage/contabil-storage.service');
const { buildDemoPdf } = require('./lib/demo-pdf');

function periodFor(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function slugify(s) {
  return String(s || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEMO_DOCS = [
  {
    title: 'Procuração AT assinada',
    validation: 'REJECTED',
    period: periodFor(0),
    description: 'Procuração para representação junto da Autoridade Tributária.',
    lines: [
      'PROCURACAO PARA A AUTORIDADE TRIBUTARIA',
      'Outorgante: Joao Nunes — Unipessoal, Lda.',
      'Mandatario: Silva & Associados (escritorio contabilistico).',
      'Poderes: entrega de declaracoes, consulta de situacao fiscal e pedido de certidoes.',
      'Estado UAT: documento rejeitado — falta assinatura reconhecida / pagina em falta.',
      `Marcador interno: ${MARKER}`,
    ],
    validFrom: dateOffset(-30),
    validUntil: dateOffset(335),
  },
  {
    title: 'Certidão permanente',
    validation: 'APPROVED',
    period: periodFor(0),
    description: 'Certidão permanente da empresa (exemplo de validade registada).',
    lines: [
      'CERTIDAO PERMANENTE — EXEMPLO STAGING',
      'Firma: Joao Nunes — Unipessoal, Lda.',
      'NIPC: 500000000 (ficticio)',
      'Objecto: consultoria e prestacao de servicos.',
      'Esta certidao e ficticia e serve apenas para validar preview, download e validade no Teglion.',
      `Marcador: ${MARKER}`,
    ],
    validFrom: dateOffset(-90),
    validUntil: dateOffset(275),
  },
  {
    title: 'Recibos de vencimento — 2.º trimestre',
    validation: 'APPROVED',
    period: periodFor(-1),
    description: 'Pacote de recibos de vencimento do trimestre.',
    lines: [
      'RECIBOS DE VENCIMENTO — 2.o TRIMESTRE',
      'Colaborador exemplo: Ana Costa',
      'Meses: Abril, Maio e Junho (valores ilustrativos).',
      'Liquido mensal aproximado: 1.250,00 EUR',
      'Usar em Ficheiros para testar aprovacao e historico.',
      `Marcador: ${MARKER}`,
    ],
  },
  {
    title: 'Mapa de IVA — junho',
    validation: 'APPROVED',
    period: periodFor(-2),
    description: 'Mapa de IVA do período de junho (demo).',
    lines: [
      'MAPA DE IVA — JUNHO (DEMO)',
      'Base tributavel: 12.400,00 EUR',
      'IVA liquidado: 2.852,00 EUR',
      'IVA dedutivel: 980,00 EUR',
      'Apuramento a entregar: 1.872,00 EUR',
      `Marcador: ${MARKER}`,
    ],
  },
  {
    title: 'Extracto bancário — Julho',
    validation: 'PENDING',
    period: periodFor(-1),
    description: 'Extracto a aguardar validação do escritório.',
    lines: [
      'EXTRACTO BANCARIO — JULHO (DEMO)',
      'Conta: PT50 0000 0000 0000 0000 0000 0 (ficticia)',
      'Saldo inicial: 8.420,15 EUR',
      'Movimentos: transferencias de clientes e pagamentos a fornecedores.',
      'Estado UAT: por validar no hub Documentos → Ficheiros.',
      `Marcador: ${MARKER}`,
    ],
  },
  {
    title: 'Contrato de arrendamento — Loja Chiado',
    validation: 'PENDING',
    period: periodFor(0),
    description: 'Contrato de arrendamento comercial para testar validade e preview.',
    lines: [
      'CONTRATO DE ARRENDAMENTO COMERCIAL (DEMO)',
      'Locador: Imobiliaria Exemplo, Lda.',
      'Locatario: Joao Nunes — Unipessoal, Lda.',
      'Imovel: Loja no Chiado, Lisboa (morada ficticia).',
      'Renda mensal: 1.100,00 EUR · inicio e fim registados no Teglion.',
      `Marcador: ${MARKER}`,
    ],
    validFrom: dateOffset(-120),
    validUntil: dateOffset(245),
  },
];

async function main() {
  assertStagingOnly();
  if (!isSupabaseConfigured()) {
    console.error('Supabase não configurado em .env.staging');
    process.exit(1);
  }

  const owner = await firmUsersRepository.findFirmUserByEmail(OWNER_EMAIL);
  if (!owner?.firm_id) {
    console.error(`Owner não encontrado: ${OWNER_EMAIL}`);
    process.exit(1);
  }
  const firmId = owner.firm_id;
  const firm = await firmsRepository.findFirmById(firmId);
  console.log(`Firma: ${firm?.name || firmId} · owner ${OWNER_EMAIL}`);

  const clients = await clientsRepository.listClients(firmId, { limit: 200, includeInactive: false });
  const portalClient =
    clients.find((c) => /joão nunes/i.test(c.displayName || c.fullName || '')) ||
    clients.find((c) => c.hasPortalAccess) ||
    clients[0];
  if (!portalClient) {
    console.error('Nenhum cliente na carteira — corre primeiro seed-staging-silva-full.js');
    process.exit(1);
  }
  const clientId = portalClient.id || portalClient._id;
  const clientName = portalClient.displayName || portalClient.fullName || 'Cliente demo';
  console.log(`Cliente: ${clientName} (${clientId})`);

  const existing = await documentsRepository.listDocuments({
    firmId,
    clientId,
    limit: 100,
  });
  const demoTitles = new Set(DEMO_DOCS.map((d) => d.title.toLowerCase()));
  const toRetire = (existing.items || []).filter((d) => {
    const desc = String(d.description || '');
    const title = String(d.title || '');
    const bytes = Number(d.sizeBytes || d.size_bytes || 0);
    return (
      demoTitles.has(title.toLowerCase()) ||
      desc.includes(MARKER) ||
      desc.includes('Documento de demonstração') ||
      (bytes > 0 && bytes < 700)
    );
  });

  for (const doc of toRetire) {
    await documentsRepository.softDeleteDocument(doc.id || doc._id, firmId);
    console.log(`  soft-delete: ${doc.title}`);
  }

  let created = 0;
  for (const spec of DEMO_DOCS) {
    const buffer = buildDemoPdf({
      title: spec.title,
      subtitle: `${firm?.name || 'Escritório'} · ${clientName}`,
      lines: spec.lines,
      footer: `Demo staging Teglion · ${new Date().toISOString().slice(0, 10)} · ${MARKER}`,
    });
    const uploaded = await contabilStorage.uploadClientDocument({
      firmId,
      clientId,
      file: {
        buffer,
        originalname: `${slugify(spec.title)}.pdf`,
        mimetype: 'application/pdf',
        size: buffer.length,
      },
    });

    const row = {
      firm_id: firmId,
      client_id: clientId,
      period: spec.period,
      title: spec.title,
      description: `${spec.description} ${MARKER}`,
      category: 'Fiscal',
      tags: ['demo', 'uat-openable'],
      workflow_status: 'SENT',
      storage_provider: uploaded.provider,
      storage_key: uploaded.path,
      mime_type: 'application/pdf',
      size_bytes: buffer.length,
      uploaded_by_role: 'CLIENT',
      uploaded_by_id: clientId,
      uploaded_by_name: clientName,
      validation_status: spec.validation,
    };
    if (spec.validation === 'APPROVED' || spec.validation === 'REJECTED') {
      row.validated_at = new Date().toISOString();
      row.validated_by = owner.id;
    }
    if (spec.validFrom) row.valid_from = spec.validFrom;
    if (spec.validUntil) row.valid_until = spec.validUntil;

    await documentsRepository.createDocument(row);
    created += 1;
    console.log(`  + ${spec.title} (${spec.validation}, ${buffer.length} bytes)`);
  }

  console.log(`\n✓ ${created} PDFs de demo abertos em staging para ${clientName}.`);
  console.log('  Em Documentos → Ficheiros: pré-visualizar, descarregar, aprovar/rejeitar.');
  console.log('  Em Histórico: clicar na linha da submissão.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
