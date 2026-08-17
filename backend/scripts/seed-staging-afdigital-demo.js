#!/usr/bin/env node
/**
 * Seed STAGING — operação AfDigital (Maya Valentina) para o email do piloto.
 *
 * Só corre contra STAGING (.env.staging). Recusa PROD.
 *
 *   node backend/scripts/seed-staging-afdigital-demo.js
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

const OWNER_EMAIL = 'afdigitalweb.st@gmail.com';
const FIRM_NAME = 'AfDigital';
const OWNER_NAME = 'Maya Valentina';
const DESIRED_SLUG = 'afdigital';
const DEMO_SEED = 'afdigital-v1';
const MARKER = '<!--afdigital-demo-->';
const BRANDING_DIR = path.join(REPO_ROOT, 'frontend/public/branding');
const AF_BLUE = '#0056B3';

const { CONSULTING_SERVICES_CATALOG } = require('../src/data/consulting-services-catalog');
const { isSupabaseConfigured } = require('../src/db/supabase/client');
const firmsRepository = require('../src/db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../src/db/supabase/repositories/firm-users.repository');
const clientsRepository = require('../src/db/supabase/repositories/clients.repository');
const accountingServicesRepository = require('../src/db/supabase/repositories/accounting-services.repository');
const accountingServicesService = require('../src/modules/firm/accounting-services.service');
const firmBrandingService = require('../src/modules/firm/firm-branding.service');
const contabilStorage = require('../src/services/storage/contabil-storage.service');
const firmPublicSitesRepository = require('../src/db/supabase/repositories/firm-public-sites.repository');
const { normalizeSiteConfig } = require('../src/modules/firm/firm-public-site.service');
const bookingService = require('../src/modules/booking/booking.service');
const obligationsRepository = require('../src/db/supabase/repositories/contabil/obligations.repository');
const documentsRepository = require('../src/db/supabase/repositories/contabil/documents.repository');
const documentRequestsRepository = require('../src/db/supabase/repositories/document-requests.repository');
const conversationsRepository = require('../src/db/supabase/repositories/conversations.repository');
const messagesRepository = require('../src/db/supabase/repositories/messages.repository');
const consultationsRepository = require('../src/db/supabase/repositories/consultations.repository');
const tasksRepository = require('../src/db/supabase/repositories/tasks.repository');
const broadcastsRepository = require('../src/db/supabase/repositories/broadcasts.repository');
const { getSupabaseAdmin } = require('../src/db/supabase/client');

const GROUP_BY_CATEGORY = {
  Consultoria: 'Consultoria',
  IRS: 'IRS',
  Atividade: 'Atividade',
  Empresa: 'Empresas',
  'Segurança Social': 'Segurança Social',
  IVA: 'IVA e declarações',
  Habitação: 'Habitação',
  Registos: 'Registos',
  Arrendamento: 'Arrendamento',
  Salários: 'Salários',
  Documentos: 'Documentos',
  Emprego: 'Emprego e IEFP',
  Fiscal: 'Fiscalidade',
  Veículos: 'Veículos',
};

const EXTRA_SERVICES = [
  {
    slug: 'contabilidade-mensal-empresas',
    name: 'Contabilidade mensal de empresas',
    description: 'Acompanhamento mensal da contabilidade, IVA, salários e fecho de período.',
    durationMinutes: 60,
    priceCents: 0,
    publicGroup: 'Contabilidade corrente',
    requiresBooking: false,
  },
  {
    slug: 'modelo-22-irc',
    name: 'Modelo 22 — IRC',
    description: 'Preparação e entrega da declaração anual de IRC.',
    durationMinutes: 90,
    priceCents: 25000,
    publicGroup: 'Empresas',
    requiresBooking: false,
  },
  {
    slug: 'ies-informacao-estatistica',
    name: 'IES — Informação Empresarial Simplificada',
    description: 'Preparação e submissão da IES / declaração anual.',
    durationMinutes: 90,
    priceCents: 18000,
    publicGroup: 'Empresas',
    requiresBooking: false,
  },
  {
    slug: 'folha-salarios',
    name: 'Processamento de salários',
    description: 'Folha mensal, recibos, DMR e comunicações à Segurança Social.',
    durationMinutes: 60,
    priceCents: 0,
    publicGroup: 'Salários',
    requiresBooking: false,
  },
  {
    slug: 'certificacao-legal-contas',
    name: 'Certificação legal de contas',
    description: 'Revisão e certificação das contas anuais por ROC parceiro.',
    durationMinutes: 120,
    priceCents: 0,
    publicGroup: 'Auditoria',
    requiresBooking: true,
    intakeStartMode: 'calendar',
  },
  {
    slug: 'consultoria-estrategica',
    name: 'Consultoria estratégica fiscal',
    description: 'Planeamento fiscal e reorganização societária para grupos e PME.',
    durationMinutes: 90,
    priceCents: 15000,
    publicGroup: 'Consultoria',
    requiresBooking: true,
    intakeStartMode: 'calendar',
  },
  {
    slug: 'regularizacao-dividas-fiscais',
    name: 'Regularização de dívidas fiscais',
    description: 'Planos prestacionais, oposições e acompanhamento de execuções fiscais.',
    durationMinutes: 75,
    priceCents: 12000,
    publicGroup: 'Fiscalidade',
    requiresBooking: true,
  },
  {
    slug: 'due-diligence-contabilistica',
    name: 'Due diligence contabilística',
    description: 'Revisão de contas e riscos fiscais em processos de compra e venda.',
    durationMinutes: 120,
    priceCents: 0,
    publicGroup: 'Auditoria',
    requiresBooking: false,
  },
  {
    slug: 'relato-financeiro',
    name: 'Relato financeiro e reporting',
    description: 'Mapas de gestão, cash-flow e reporting para administração e bancos.',
    durationMinutes: 60,
    priceCents: 9000,
    publicGroup: 'Contabilidade corrente',
    requiresBooking: true,
  },
  {
    slug: 'apoio-inspecao-tributaria',
    name: 'Apoio em inspecção tributária',
    description: 'Preparação de dossier e acompanhamento de inspecções da AT.',
    durationMinutes: 90,
    priceCents: 18000,
    publicGroup: 'Fiscalidade',
    requiresBooking: true,
  },
  {
    slug: 'constituicao-holding',
    name: 'Constituição de holding',
    description: 'Estrutura societária, SGPS e planeamento de grupos.',
    durationMinutes: 90,
    priceCents: 35000,
    publicGroup: 'Empresas',
    requiresBooking: false,
  },
  {
    slug: 'contabilidade-condominio',
    name: 'Contabilidade de condomínio',
    description: 'Contas, orçamento e assembleias para administrações de condomínio.',
    durationMinutes: 45,
    priceCents: 6000,
    publicGroup: 'Contabilidade corrente',
    requiresBooking: false,
  },
  {
    slug: 'saft-pt-validacao',
    name: 'Validação SAF-T PT',
    description: 'Revisão do ficheiro SAF-T antes da entrega à AT.',
    durationMinutes: 45,
    priceCents: 5000,
    publicGroup: 'IVA e declarações',
    requiresBooking: false,
  },
  {
    slug: 'consultoria-expatriados',
    name: 'Consultoria para expatriados',
    description: 'Residência fiscal, IRS de não residentes e dupla tributação.',
    durationMinutes: 60,
    priceCents: 9000,
    publicGroup: 'IRS',
    requiresBooking: true,
    intakeStartMode: 'calendar',
  },
  {
    slug: 'acompanhamento-banco-portugal',
    name: 'Acompanhamento Banco de Portugal',
    description: 'Reportes e obrigações para entidades sob supervisão.',
    durationMinutes: 90,
    priceCents: 0,
    publicGroup: 'Empresas',
    requiresBooking: false,
  },
];

const DEMO_COMPANIES = [
  { displayName: 'Atlântico Têxteis, Lda.', email: 'demo.atlantico@example.test', taxId: '510000001' },
  { displayName: 'Ribeiro & Filhos Construção', email: 'demo.ribeiro@example.test', taxId: '510000002' },
  { displayName: 'Costa Verde Restauração', email: 'demo.costa@example.test', taxId: '510000003' },
  { displayName: 'Nunes Imobiliária, Lda.', email: 'demo.nunes@example.test', taxId: '510000004' },
  { displayName: 'Oliveira Transportes', email: 'demo.oliveira@example.test', taxId: '510000005' },
  { displayName: 'Maré Azul Turismo', email: 'demo.mare@example.test', taxId: '510000006' },
  { displayName: 'Serra Dourada Agro', email: 'demo.serra@example.test', taxId: '510000007' },
  { displayName: 'Luz & Som Eventos', email: 'demo.luz@example.test', taxId: '510000008' },
];

function assertStaging() {
  const url = String(process.env.SUPABASE_URL || '').toLowerCase();
  const frontend = String(process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || '').toLowerCase();
  const blob = `${url} ${frontend} ${process.env.APP_ENV || ''} ${process.env.NODE_ENV || ''}`;
  const isStaging =
    blob.includes('staging.teglion.com') ||
    blob.includes('staging') ||
    String(process.env.APP_ENV || '').toLowerCase() === 'staging';
  const looksProd =
    frontend.includes('app.teglion.com') ||
    frontend.includes('teglion.com') && !frontend.includes('staging') ||
    blob.includes('prod.supabase') ||
    String(process.env.APP_ENV || '').toLowerCase() === 'production';
  if (!isStaging || looksProd) {
    throw new Error('Recusado: este script só corre contra STAGING.');
  }
}

function slugify(name) {
  return String(name || 'servico')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'servico';
}

function readPng(filename) {
  const full = path.join(BRANDING_DIR, filename);
  if (!fs.existsSync(full)) throw new Error(`Falta ${full}`);
  return {
    buffer: fs.readFileSync(full),
    originalname: filename,
    mimetype: 'image/png',
    size: fs.statSync(full).size,
  };
}

function fakePdf(title) {
  const body = `${title}\nDocumento de demonstração AfDigital.\n${MARKER}`;
  return Buffer.from(
    `%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n4 0 obj<</Length ${body.length}>>stream\n${body}\nendstream\nendobj\ntrailer<</Root 1 0 R>>\n%%EOF\n`,
  );
}

function isoDaysFromNow(days, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dateDaysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function periodFor(offsetMonths = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function uniqueServiceSlug(sb, firmId, base, excludeId) {
  let slug = base;
  let n = 0;
  for (;;) {
    const { data, error } = await sb
      .from('accounting_services')
      .select('id')
      .eq('firm_id', firmId)
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw error;
    if (!data || data.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

async function ensureNews(sb, firmId, authorId, authorName, articles) {
  for (const article of articles) {
    const { data: existing } = await sb
      .from('news_articles')
      .select('id')
      .eq('firm_id', firmId)
      .eq('slug', article.slug)
      .maybeSingle();
    if (existing) continue;
    const { error } = await sb.from('news_articles').insert({
      firm_id: firmId,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: `${article.body}\n\n${MARKER}`,
      category: article.category,
      tags: article.tags || [],
      status: 'PUBLISHED',
      is_featured: Boolean(article.featured),
      reading_time_minutes: 3,
      author_id: authorId,
      author_name: authorName,
      published_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
}

async function resolveOwner() {
  const byEmail = await firmUsersRepository.findFirmUserByEmail(OWNER_EMAIL);
  if (byEmail) return byEmail;

  const firm = await firmsRepository.findFirmBySlug(DESIRED_SLUG);
  if (!firm) {
    throw new Error(`Não encontrei ${OWNER_EMAIL} nem o escritório «${DESIRED_SLUG}» em staging.`);
  }
  const users = await firmUsersRepository.listFirmUsers(firm.id, { activeOnly: false });
  const mapped = users.find((u) => u.role === 'FIRM_OWNER') || users[0];
  if (!mapped) {
    throw new Error(`Escritório «${DESIRED_SLUG}» sem utilizadores.`);
  }
  const raw = await firmUsersRepository.findFirmUserById(mapped.id, firm.id);
  if (!raw) throw new Error(`Não foi possível carregar o dono do escritório ${DESIRED_SLUG}.`);
  return raw;
}

async function main() {
  dotenv.config({ path: STAGING_ENV, override: true });
  assertStaging();
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase STAGING não configurado.');
  }

  const owner = await resolveOwner();
  const firmId = owner.firm_id;
  const sb = getSupabaseAdmin();

  console.log(`Firm ${firmId} · owner ${owner.email}`);

  await firmsRepository.updateFirm(firmId, { name: FIRM_NAME });
  const current = await firmsRepository.findFirmById(firmId);
  if (current.slug !== DESIRED_SLUG) {
    const taken = await firmsRepository.findFirmBySlug(DESIRED_SLUG);
    if (!taken) {
      await firmsRepository.updateFirm(firmId, { slug: DESIRED_SLUG });
      console.log(`Slug → ${DESIRED_SLUG}`);
    } else {
      console.log(`Slug ${DESIRED_SLUG} ocupado — a manter ${current.slug}`);
    }
  }
  await firmUsersRepository.updateFirmMember(firmId, owner.id, {
    fullName: OWNER_NAME,
    jobTitle: 'Sócia-gerente',
    email: OWNER_EMAIL,
  });

  await firmsRepository.mergeSettingsKey(firmId, 'demoSeed', DEMO_SEED);
  await bookingService.updateBookingSettings(firmId, {
    slotMinutes: 30,
    horizonDays: 21,
    leadTimeHours: 2,
    weekdays: [1, 2, 3, 4, 5],
    dayStart: '09:00',
    dayEnd: '18:00',
    timezone: 'Europe/Lisbon',
  });

  const logoFile = readPng('afdigital-logo.png');
  const officeFile = readPng('afdigital-office.png');
  const markFile = readPng('afdigital-mark.png');
  await firmBrandingService.uploadFirmLogo({ firmId, file: logoFile });
  const heroUpload = await contabilStorage.uploadPublicSiteImage({
    firmId,
    slot: 'hero',
    file: officeFile,
  });
  const instUpload = await contabilStorage.uploadPublicSiteImage({
    firmId,
    slot: 'institutional',
    file: officeFile,
  });
  const serviceImageA = await contabilStorage.uploadServiceImage({ firmId, file: officeFile });
  const serviceImageB = await contabilStorage.uploadServiceImage({ firmId, file: markFile });
  const serviceImages = [serviceImageA.path, serviceImageB.path, heroUpload.path];

  const firmAfterLogo = await firmsRepository.findFirmById(firmId);
  const logoKey = firmAfterLogo.settings?.branding?.logoStorageKey || null;

  await accountingServicesService.seedCatalog({ firmId });
  const catalogByKey = new Map(CONSULTING_SERVICES_CATALOG.map((e) => [e.catalogKey, e]));
  let services = await accountingServicesRepository.listByFirm(firmId, { activeOnly: false });

  const groupOrder = [];
  const seenGroup = new Set();
  function pushGroup(group) {
    if (!seenGroup.has(group)) {
      seenGroup.add(group);
      groupOrder.push(group);
    }
  }

  for (const service of services) {
    const entry = catalogByKey.get(service.catalogKey);
    const group = (entry && GROUP_BY_CATEGORY[entry.category]) || service.publicGroup || 'Consultoria';
    pushGroup(group);
    const slug = service.slug || (await uniqueServiceSlug(sb, firmId, slugify(service.name), service.id));
    const img = serviceImages[groupOrder.indexOf(group) % serviceImages.length];
    await accountingServicesRepository.updateRow(service.id, firmId, {
      isActive: true,
      isPubliclyListed: true,
      slug,
      publicGroup: group,
      imageUrl: service.imageUrl || img,
      requiresBooking: entry ? entry.requiresBooking === true : service.requiresBooking,
      intakeStartMode: entry && entry.requiresBooking ? 'calendar' : service.intakeStartMode,
    });
  }

  for (const extra of EXTRA_SERVICES) {
    pushGroup(extra.publicGroup);
    const existing = services.find((s) => s.slug === extra.slug);
    const img = serviceImages[groupOrder.indexOf(extra.publicGroup) % serviceImages.length];
    if (existing) {
      await accountingServicesRepository.updateRow(existing.id, firmId, {
        ...extra,
        isActive: true,
        isPubliclyListed: true,
        imageUrl: existing.imageUrl || img,
      });
    } else {
      await accountingServicesRepository.createRow({
        firmId,
        ...extra,
        isActive: true,
        isPubliclyListed: true,
        imageUrl: img,
        sortOrder: 400 + groupOrder.indexOf(extra.publicGroup),
      });
    }
  }

  services = await accountingServicesRepository.listByFirm(firmId, { activeOnly: false });
  const byGroup = new Map();
  for (const s of services) {
    const g = s.publicGroup || 'Outros';
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(s);
  }
  let sort = 0;
  for (const group of [...byGroup.keys()].sort()) {
    for (const s of byGroup.get(group)) {
      await accountingServicesRepository.updateRow(s.id, firmId, { sortOrder: sort });
      sort += 1;
    }
  }
  services = await accountingServicesRepository.listByFirm(firmId, { activeOnly: true });
  console.log(`${services.length} serviços activos e públicos`);

  const consultoria = services.find((s) => s.catalogKey === 'consultoria-individual') || services.find((s) => s.requiresBooking);
  const irs = services.find((s) => s.catalogKey === 'irs-modelo-3');
  const heroId = 'img_hero_office';
  const aboutId = 'img_about_office';

  const siteConfig = normalizeSiteConfig({
    seo: {
      title: 'AfDigital — Contabilidade e consultoria fiscal',
      description:
        'Escritório de contabilidade em Coimbra. IRS, empresas, salários e consultoria fiscal com mais de 50 anos de prática.',
    },
    theme: {
      primaryColor: AF_BLUE,
      secondaryColor: '#0A2540',
      textColor: '#0F172A',
      backgroundColor: '#F7F8FA',
      surfaceColor: '#FFFFFF',
      mutedTextColor: '#5B6573',
      logoStorageKey: logoKey,
    },
    images: {
      hero: [{ id: heroId, storageKey: heroUpload.path, alt: 'Sala de reuniões da AfDigital' }],
      institutional: [{ id: aboutId, storageKey: instUpload.path, alt: 'Escritório AfDigital' }],
    },
    socialLinks: {},
    showPrices: true,
    sections: [
      { type: 'header', enabled: true, order: 0, content: { title: 'AfDigital' } },
      {
        type: 'hero',
        enabled: true,
        order: 1,
        content: {
          title: 'AfDigital',
          tagline: 'Contabilidade e consultoria fiscal com a exigência de quem acompanha famílias e empresas há mais de 50 anos.',
          bio: 'A Maya Valentina e a equipa tratam do que tem prazo, do que precisa de documentos e do que convém decidir com calma — IRS, empresas, salários e consultoria.',
          imageIds: [heroId],
          imageFit: 'cover',
          imagePosition: 'center',
          ctas: [
            consultoria
              ? { label: 'Marcar consultoria', style: 'primary', target: { type: 'service-detail', serviceId: consultoria.id } }
              : { label: 'Ver serviços', style: 'primary', target: { type: 'booking' } },
            irs
              ? { label: 'IRS Modelo 3', style: 'secondary', target: { type: 'service-detail', serviceId: irs.id } }
              : { label: 'Falar connosco', style: 'secondary', target: { type: 'contact-form' } },
          ],
        },
      },
      {
        type: 'about',
        enabled: true,
        order: 2,
        content: {
          heading: 'Um escritório com história — e operação ao dia',
          body: 'A AfDigital nasceu da prática contabilística de várias gerações e hoje combina esse ofício com uma operação digital: portal do cliente, pedidos de documentos, prazos, mensagens e agenda de consultorias. Maya Valentina lidera a equipa em Coimbra. Não inventamos atalhos fiscais — organizamos o que a lei e o calendário já pedem.',
          imageIds: [aboutId],
        },
      },
      {
        type: 'services',
        enabled: true,
        order: 3,
        content: { heading: 'Consultorias com agendamento', mode: 'auto' },
      },
      {
        type: 'bookingServices',
        enabled: true,
        order: 4,
        content: { heading: 'Serviços sob pedido', mode: 'auto' },
      },
      {
        type: 'features',
        enabled: true,
        order: 5,
        content: {
          items: [
            { id: 'f1', title: 'Portal do cliente', description: 'Documentos, prazos, mensagens e serviços no mesmo sítio.' },
            { id: 'f2', title: 'Agenda de consultorias', description: 'Horários reais da equipa, com confirmação no momento.' },
            { id: 'f3', title: 'IRS e anexos', description: 'Modelo 3 e anexos com lista de documentos à medida das respostas.' },
            { id: 'f4', title: 'Empresas e salários', description: 'IVA, IRC, IES, DMR e folha — o calendário do ano à vista.' },
          ],
        },
      },
      {
        type: 'process',
        enabled: true,
        order: 6,
        content: {
          steps: [
            { id: 'p1', title: 'Pedido ou marcação', description: 'Escolhe o serviço no site ou no portal e indica o que precisa.' },
            { id: 'p2', title: 'Documentos certos', description: 'Recebe a lista do que falta — envia pelo portal, sem e-mail perdido.' },
            { id: 'p3', title: 'Acompanhamento', description: 'A equipa trata do prazo e avisa-o quando houver decisão ou entrega.' },
          ],
        },
      },
      {
        type: 'faq',
        enabled: true,
        order: 7,
        content: {
          items: [
            {
              id: 'q1',
              question: 'Como marco uma consultoria?',
              answer: 'No site, abra o serviço e escolha um horário. No portal, use Serviços → Agendar.',
            },
            {
              id: 'q2',
              question: 'Onde envio documentos?',
              answer: 'No portal do cliente, em Documentos, ou em resposta a um pedido que lhe fizemos.',
            },
            {
              id: 'q3',
              question: 'Tratam de IRS de particulares e de empresas?',
              answer: 'Sim. IRS Modelo 3 e anexos para particulares; IVA, IRC, IES e salários para empresas.',
            },
            {
              id: 'q4',
              question: 'Há atendimento presencial?',
              answer: 'Sim, em Coimbra, com marcação. Muita da operação resolve-se no portal sem deslocação.',
            },
          ],
        },
      },
      {
        type: 'contact',
        enabled: true,
        order: 8,
        content: { showEmail: true, showPhone: true, showAddress: true },
      },
      { type: 'footer', enabled: true, order: 9, content: {} },
    ],
  });

  await firmPublicSitesRepository.upsertDraft(firmId, siteConfig, owner.id);
  await firmPublicSitesRepository.publish(firmId, owner.id);
  await firmsRepository.updateFirmPublicProfile(firmId, {
    displayName: FIRM_NAME,
    tagline: 'Contabilidade e consultoria fiscal há mais de 50 anos.',
    bio: 'Maya Valentina e equipa — Coimbra. Portal do cliente, prazos e consultorias no mesmo sítio.',
    email: OWNER_EMAIL,
    address: 'Coimbra, Portugal',
  });
  await firmsRepository.updateFirmBranding(firmId, {
    primaryColor: AF_BLUE,
    secondaryColor: '#0A2540',
    textColor: '#0F172A',
  });
  const publishedFirm = await firmsRepository.findFirmById(firmId);
  console.log(`Página pública publicada: /${publishedFirm.slug}`);

  const clients = await clientsRepository.listClients(firmId, { limit: 200, includeInactive: false });
  for (const company of DEMO_COMPANIES) {
    const already = clients.find((c) => c.email === company.email || c.taxId === company.taxId);
    if (already) continue;
    const created = await clientsRepository.createClient({
      firmId,
      displayName: company.displayName,
      email: company.email,
      taxId: company.taxId,
      assignedStaffId: owner.id,
      metadata: { demoSeed: DEMO_SEED },
    });
    clients.push(created);
  }
  console.log(`${clients.length} clientes na carteira`);

  const portalClient =
    clients.find((c) => /joão nunes/i.test(c.displayName || '')) ||
    clients.find((c) => c.hasPortalAccess) ||
    clients[0];

  if (portalClient) {
    const existingObligations = await obligationsRepository.listObligations({
      firmId,
      clientId: portalClient.id,
      limit: 200,
    });
    const hasDemoObl = existingObligations.some((o) => String(o.notes || '').includes('afdigital-demo'));
    if (!hasDemoObl) {
      const obligationSpecs = [
        { type: 'IVA', title: 'IVA mensal', period: periodFor(-1), dueDate: dateDaysFromNow(-3), status: 'OVERDUE' },
        { type: 'SS', title: 'Declaração trimestral SS', period: periodFor(0), dueDate: dateDaysFromNow(4), status: 'WAITING_CLIENT' },
        { type: 'IRS', title: 'IRS Modelo 3', period: String(new Date().getFullYear()), dueDate: dateDaysFromNow(18), status: 'PENDING' },
        { type: 'IES', title: 'IES anual', period: String(new Date().getFullYear() - 1), dueDate: dateDaysFromNow(40), status: 'PENDING' },
        { type: 'PAYROLL', title: 'Processamento de salários', period: periodFor(0), dueDate: dateDaysFromNow(8), status: 'IN_PROGRESS' },
        { type: 'IRC', title: 'Pagamento por conta IRC', period: periodFor(1), dueDate: dateDaysFromNow(25), status: 'PENDING' },
      ];
      for (const spec of obligationSpecs) {
        try {
          await obligationsRepository.createObligation({
            firmId,
            clientId: portalClient.id,
            createdByUserId: owner.id,
            assignedStaffId: owner.id,
            notes: MARKER,
            ...spec,
          });
        } catch (err) {
          if (err?.code !== '23505') throw err;
        }
      }
    }

    const { items: existingTasks } = await tasksRepository.listTasks(firmId, {
      clientId: portalClient.id,
      limit: 50,
    });
    if (!existingTasks.some((t) => String(t.description || '').includes('afdigital-demo'))) {
      const taskSpecs = [
        { title: 'Enviar extractos bancários de Julho', status: 'WAITING_CLIENT', priority: 'HIGH', dueDate: dateDaysFromNow(2) },
        { title: 'Confirmar quadro de pessoal', status: 'TODO', priority: 'NORMAL', dueDate: dateDaysFromNow(6) },
        { title: 'Revisar simulação de IRS', status: 'IN_PROGRESS', priority: 'NORMAL', dueDate: dateDaysFromNow(12) },
        { title: 'Assinar procuração AT', status: 'TODO', priority: 'URGENT', dueDate: dateDaysFromNow(1) },
      ];
      for (const spec of taskSpecs) {
        await tasksRepository.insertTask({
          firm_id: firmId,
          client_id: portalClient.id,
          title: spec.title,
          description: `Pedido da equipa AfDigital. ${MARKER}`,
          status: spec.status,
          priority: spec.priority,
          due_date: spec.dueDate,
          assignee_id: owner.id,
          created_by: owner.id,
          task_type: 'manual_task',
        });
      }
    }

    const existingDocs = await documentsRepository.listDocuments({
      firmId,
      clientId: portalClient.id,
      limit: 20,
    });
    if ((existingDocs.items || []).length < 4) {
      const docTitles = [
        'Mapa de IVA — Junho',
        'Recibos de vencimento — 2.º trimestre',
        'Certidão permanente',
        'Procuração AT assinada',
      ];
      for (const title of docTitles) {
        const uploaded = await contabilStorage.uploadClientDocument({
          firmId,
          clientId: portalClient.id,
          file: {
            buffer: fakePdf(title),
            originalname: `${slugify(title)}.pdf`,
            mimetype: 'application/pdf',
            size: 512,
          },
        });
        await documentsRepository.createDocument({
          firm_id: firmId,
          client_id: portalClient.id,
          period: periodFor(0),
          title,
          description: MARKER,
          category: 'Fiscal',
          tags: ['demo'],
          workflow_status: 'SENT',
          storage_provider: uploaded.provider,
          storage_key: uploaded.path,
          mime_type: 'application/pdf',
          size_bytes: uploaded.size || 512,
          uploaded_by_role: 'FIRM',
          uploaded_by_id: owner.id,
          uploaded_by_name: OWNER_NAME,
          validation_status: 'APPROVED',
        });
      }
    }

    const existingRequests = await documentRequestsRepository.listByClient({
      firmId,
      clientId: portalClient.id,
      limit: 20,
    });
    if (!existingRequests.some((r) => String(r.instructions || '').includes('afdigital-demo'))) {
      const conversation = await conversationsRepository.getOrCreate({
        firmId,
        clientId: portalClient.id,
      });
      await documentRequestsRepository.create({
        firmId,
        clientId: portalClient.id,
        conversationId: conversation.id,
        title: 'Extractos bancários — Julho',
        instructions: `Envie o PDF do banco (todas as contas). ${MARKER}`,
        periodMonth: periodFor(-1),
        createdBy: owner.id,
      });
      await documentRequestsRepository.create({
        firmId,
        clientId: portalClient.id,
        conversationId: conversation.id,
        title: 'Faturas de fornecedores por classificar',
        instructions: `Faltam 6 faturas do e-fatura. ${MARKER}`,
        periodMonth: periodFor(0),
        createdBy: owner.id,
      });
    }

    const existingMessages = await messagesRepository.listMessages({
      firmId,
      clientId: portalClient.id,
      limit: 30,
    });
    if (!existingMessages.some((m) => String(m.body || '').includes('afdigital-demo'))) {
      await messagesRepository.createMessage({
        firmId,
        clientId: portalClient.id,
        senderRole: 'FIRM',
        senderId: owner.id,
        body: `Olá. Precisamos dos extractos de Julho para fechar o IVA — pode enviar pelo portal, em Documentos. ${MARKER}`,
      });
      await messagesRepository.createMessage({
        firmId,
        clientId: portalClient.id,
        senderRole: 'CLIENT',
        senderId: portalClient.id,
        body: `Boa tarde, envio ainda hoje. Queria também marcar a consultoria de IRS. ${MARKER}`,
      });
      await messagesRepository.createMessage({
        firmId,
        clientId: portalClient.id,
        senderRole: 'FIRM',
        senderId: owner.id,
        body: `Perfeito. Em Serviços pode agendar a consultoria individual — há horários esta semana. ${MARKER}`,
      });
    }

    const upcoming = await consultationsRepository.listConsultations({
      firmId,
      clientId: portalClient.id,
      from: new Date().toISOString(),
      limit: 20,
    });
    if (upcoming.length === 0 && consultoria) {
      await consultationsRepository.createConsultation({
        firmId,
        clientId: portalClient.id,
        staffId: owner.id,
        title: consultoria.name,
        scheduledAt: isoDaysFromNow(3, 15),
        durationMinutes: consultoria.durationMinutes || 60,
        status: 'SCHEDULED',
        notes: MARKER,
        accountingServiceId: consultoria.id,
        priceCents: consultoria.priceCents,
        source: 'FIRM',
      });
      await consultationsRepository.createConsultation({
        firmId,
        clientId: portalClient.id,
        staffId: owner.id,
        title: 'Ponto de situação — empresas do grupo',
        scheduledAt: isoDaysFromNow(10, 11),
        durationMinutes: 60,
        status: 'SCHEDULED',
        notes: MARKER,
        source: 'FIRM',
      });
    }
  }

  const existingBroadcasts = await broadcastsRepository.listBroadcasts(firmId, { limit: 20 });
  const items = existingBroadcasts.items || [];
  const hasDemoBroadcast = Array.isArray(items) && items.some((b) => String(b.body || '').includes('afdigital-demo'));
  if (!hasDemoBroadcast) {
    await broadcastsRepository.insertBroadcast({
      firm_id: firmId,
      title: 'Prazo de IVA — documentos em falta',
      slug: 'prazo-iva-docs',
      excerpt: 'Faltam extractos para fechar o período. Envie pelo portal até sexta.',
      body: `Caros clientes, o prazo de IVA aproxima-se. Quem tiver pedido de documentos pendente, envie pelo portal. ${MARKER}`,
      category: 'URGENT',
      priority: 'URGENT',
      status: 'PUBLISHED',
      target_type: 'ALL_CLIENTS',
      published_at: new Date().toISOString(),
      author_id: owner.id,
      author_name: OWNER_NAME,
      pinned: true,
      read_confirmation_required: true,
    });
    await broadcastsRepository.insertBroadcast({
      firm_id: firmId,
      title: 'Horário de Agosto',
      slug: 'horario-agosto',
      excerpt: 'Atendimento com marcação. Portal e mensagens em horário normal.',
      body: `Em Agosto o atendimento presencial é só com marcação. O portal continua a receber documentos e mensagens. ${MARKER}`,
      category: 'AVISO',
      priority: 'MEDIUM',
      status: 'PUBLISHED',
      target_type: 'ALL_CLIENTS',
      published_at: new Date().toISOString(),
      author_id: owner.id,
      author_name: OWNER_NAME,
    });
  }

  await ensureNews(sb, firmId, owner.id, OWNER_NAME, [
    {
      slug: 'irs-2026-calendario',
      title: 'Calendário de IRS — o que preparar já',
      excerpt: 'Documentos, anexos e prazos para não deixar a declaração para a última semana.',
      body: 'Reúna recibos, e-fatura classificada e cadernetas prediais. No portal encontra a lista do que o escritório já pediu.',
      category: 'IRS',
      tags: ['irs', 'prazos'],
      featured: true,
    },
    {
      slug: 'iva-mensal-boas-praticas',
      title: 'IVA mensal: fechar o período sem surpresas',
      excerpt: 'Extractos, faturas e e-fatura no mesmo sítio — o que pedimos todos os meses.',
      body: 'Envie extractos e faturas pelo portal assim que o mês fecha. A equipa classifica e confirma o apuramento consigo.',
      category: 'IVA',
      tags: ['iva'],
    },
    {
      slug: 'portal-cliente-como-usar',
      title: 'Como usar o portal: documentos, prazos e serviços',
      excerpt: 'Um guia curto para quem acaba de receber o acesso.',
      body: 'Início mostra o próximo passo. Serviços permite agendar ou pedir. Prazos agrupa o que está em atraso, esta semana e mais tarde.',
      category: 'AVISO',
      tags: ['portal'],
    },
  ]);

  for (const client of clients.filter((c) => c.id !== portalClient?.id).slice(0, 6)) {
    const obs = await obligationsRepository.listObligations({ firmId, clientId: client.id, limit: 5 });
    if (obs.length) continue;
    await obligationsRepository.createObligation({
      firmId,
      clientId: client.id,
      type: 'IVA',
      period: periodFor(0),
      title: 'IVA mensal',
      dueDate: dateDaysFromNow(12),
      status: 'PENDING',
      notes: MARKER,
      assignedStaffId: owner.id,
      createdByUserId: owner.id,
    });
    await obligationsRepository.createObligation({
      firmId,
      clientId: client.id,
      type: 'PAYROLL',
      period: periodFor(0),
      title: 'Salários',
      dueDate: dateDaysFromNow(7),
      status: 'IN_PROGRESS',
      notes: MARKER,
      assignedStaffId: owner.id,
      createdByUserId: owner.id,
    });
  }

  console.log('Seed AfDigital concluído.');
  console.log(`Pública: https://staging.teglion.com/${publishedFirm.slug}`);
  console.log('Portal cliente: https://staging.teglion.com/app/client');
  console.log('Escritório: https://staging.teglion.com/app/firm');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
