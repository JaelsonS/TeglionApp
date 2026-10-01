#!/usr/bin/env node
/**
 * Refina a página pública STAGING: grupos reais, ofertas principais + opções (filhos),
 * catálogo limpo (sem dezenas de cards soltos) e tema visual mais premium.
 *
 *   SEED_OWNER_EMAIL=jaelsonsilva345@gmail.com node backend/scripts/polish-staging-public-presentation.js
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
const FIRM_NAME = process.env.SEED_FIRM_NAME || 'Silva & Associados';
const OWNER_NAME = process.env.SEED_OWNER_NAME || 'Jaelson Silva';
const DESIRED_SLUG = process.env.SEED_FIRM_SLUG || 'silva-associados';
const CITY_LABEL = process.env.SEED_CITY || 'Lisboa, Portugal';
const PUBLIC_TAGLINE =
  process.env.SEED_PUBLIC_TAGLINE ||
  'Contabilidade, fiscalidade e consultoria para particulares e PME — com portal do cliente e prazos sempre visíveis.';

const PRIMARY = '#0F4C5C';
const SECONDARY = '#C27803';
const BG = '#F4FAFB';
const SURFACE = '#FFFFFF';

const { isSupabaseConfigured } = require('../src/db/supabase/client');
const firmsRepository = require('../src/db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../src/db/supabase/repositories/firm-users.repository');
const accountingServicesRepository = require('../src/db/supabase/repositories/accounting-services.repository');
const accountingServiceGroupsRepository = require('../src/db/supabase/repositories/accounting-service-groups.repository');
const accountingServiceOptionsRepository = require('../src/db/supabase/repositories/accounting-service-options.repository');
const firmPublicSitesRepository = require('../src/db/supabase/repositories/firm-public-sites.repository');
const contabilStorage = require('../src/services/storage/contabil-storage.service');
const { normalizeSiteConfig } = require('../src/modules/firm/firm-public-site.service');
const BRANDING_DIR = path.join(REPO_ROOT, 'frontend/public/branding');

const SERVICE_GROUPS = [
  'IRS & Particulares',
  'Empresas & PME',
  'Contabilidade corrente',
  'Salários & Segurança Social',
  'Consultoria & Assessoria',
  'Registos & Legalização',
];

const HUBS = [
  {
    slug: 'hub-irs-declaracao',
    name: 'IRS — Declaração anual',
    group: 'IRS & Particulares',
    requiresBooking: false,
    durationMinutes: 45,
    description:
      '<p><strong>Escolha a modalidade</strong> que se aplica ao seu caso. Cada opção abre o formulário ou agendamento certo — sem confusão na página.</p><ul><li>Modelo 3 e anexos</li><li>Simulação antes de entregar</li><li>Consultoria com horário</li></ul>',
    children: [
      { catalogKey: 'irs-modelo-3' },
      { catalogKey: 'simulacao-irs' },
      { catalogKey: 'entrega-irs-orcamento' },
      { catalogKey: 'irs-anexo-a' },
      { catalogKey: 'irs-anexo-h' },
      { catalogKey: 'porta-65' },
      { catalogKey: 'consultoria-individual' },
    ],
  },
  {
    slug: 'hub-contabilidade-empresas',
    name: 'Contabilidade para empresas',
    group: 'Empresas & PME',
    requiresBooking: false,
    description:
      '<p>Pacote completo para <strong>PME e sociedades</strong>: contabilidade corrente, impostos periódicos e entregas anuais. Selecione o serviço concreto dentro desta oferta.</p>',
    children: [
      { slug: 'contabilidade-mensal-empresas' },
      { slug: 'modelo-22-irc' },
      { slug: 'ies-informacao-estatistica' },
      { slug: 'folha-salarios' },
      { slug: 'saft-pt-validacao' },
      { catalogKey: 'iva-isolada' },
    ],
  },
  {
    slug: 'hub-abrir-actividade',
    name: 'Abrir, alterar ou encerrar atividade',
    group: 'Registos & Legalização',
    requiresBooking: false,
    description:
      '<p>Trâmites junto das Finanças e registos iniciais — <strong>particulares e empresas</strong>. Indique o passo em que está.</p>',
    children: [
      { catalogKey: 'abertura-atividade' },
      { catalogKey: 'alteracao-atividade' },
      { catalogKey: 'cessacao-atividade' },
      { catalogKey: 'abertura-empresa' },
      { slug: 'constituicao-holding' },
    ],
  },
  {
    slug: 'hub-salarios-ss',
    name: 'Salários & Segurança Social',
    group: 'Salários & Segurança Social',
    requiresBooking: false,
    description:
      '<p>Folha de vencimentos, obrigações periódicas e situações de admissão ou cessação.</p>',
    children: [
      { slug: 'folha-salarios' },
      { catalogKey: 'ss-trimestral-isolada' },
      { catalogKey: 'analise-salarios-cessacao' },
    ],
  },
  {
    slug: 'hub-consultoria-estrategica',
    name: 'Consultoria & assessoria',
    group: 'Consultoria & Assessoria',
    requiresBooking: true,
    description:
      '<p>Sessões com a equipa para <strong>decisões com impacto fiscal</strong> — agende online ou peça proposta.</p>',
    children: [
      { slug: 'consultoria-estrategica' },
      { catalogKey: 'consultoria-individual' },
      { slug: 'consultoria-expatriados' },
      { catalogKey: 'gestao-pessoal-fiscal' },
    ],
  },
  {
    slug: 'hub-arrendamento-patrimonio',
    name: 'Arrendamento & património',
    group: 'IRS & Particulares',
    requiresBooking: false,
    description: '<p>Contratos, rendas e comprovativos para e-fatura e IRS.</p>',
    children: [
      { catalogKey: 'contratos-arrendamento-financas' },
      { catalogKey: 'comprovativo-morada-fiscal' },
      { catalogKey: 'classificacao-efatura' },
    ],
  },
  {
    slug: 'hub-fiscalidade-contencioso',
    name: 'Fiscalidade & contencioso',
    group: 'Consultoria & Assessoria',
    requiresBooking: true,
    description: '<p>Regularizações, inspecções e apoio especializado.</p>',
    children: [
      { slug: 'regularizacao-dividas-fiscais' },
      { slug: 'apoio-inspecao-tributaria' },
      { slug: 'due-diligence-contabilistica' },
    ],
  },
  {
    slug: 'hub-certificacao-auditoria',
    name: 'Certificação & auditoria',
    group: 'Empresas & PME',
    requiresBooking: true,
    description: '<p>Certificação legal de contas, due diligence e reporting.</p>',
    children: [
      { slug: 'certificacao-legal-contas' },
      { slug: 'relato-financeiro' },
      { slug: 'due-diligence-contabilistica' },
    ],
  },
];

function assertStaging() {
  const url = String(process.env.SUPABASE_URL || '').toLowerCase();
  const frontend = String(process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || '').toLowerCase();
  const blob = `${url} ${frontend} ${process.env.APP_ENV || ''}`;
  const isStaging = blob.includes('staging') || blob.includes('staging.teglion.com');
  const looksProd =
    frontend.includes('app.teglion.com') ||
    (frontend.includes('teglion.com') && !frontend.includes('staging'));
  if (!isStaging || looksProd) throw new Error('Recusado: só STAGING.');
}

function readPng(filename) {
  const full = path.join(BRANDING_DIR, filename);
  return {
    buffer: fs.readFileSync(full),
    originalname: filename,
    mimetype: 'image/png',
    size: fs.statSync(full).size,
  };
}

function findService(services, ref) {
  if (ref.catalogKey) {
    const byKey = services.find((s) => s.catalogKey === ref.catalogKey);
    if (byKey) return byKey;
  }
  if (ref.slug) return services.find((s) => s.slug === ref.slug) || null;
  return null;
}

async function resolveOwner() {
  const byEmail = await firmUsersRepository.findFirmUserByEmail(OWNER_EMAIL);
  if (byEmail) return byEmail;
  const firm = await firmsRepository.findFirmBySlug(DESIRED_SLUG);
  if (!firm) throw new Error(`Utilizador ${OWNER_EMAIL} / slug ${DESIRED_SLUG} não encontrado.`);
  const users = await firmUsersRepository.listFirmUsers(firm.id, { activeOnly: false });
  const mapped = users.find((u) => u.role === 'FIRM_OWNER') || users[0];
  if (!mapped) throw new Error('Escritório sem utilizadores.');
  return firmUsersRepository.findFirmUserById(mapped.id, firm.id);
}

async function ensureGroups(firmId) {
  const existing = await accountingServiceGroupsRepository.listByFirm(firmId);
  const byName = new Map(existing.map((g) => [g.name, g]));
  const out = new Map();
  for (let i = 0; i < SERVICE_GROUPS.length; i += 1) {
    const name = SERVICE_GROUPS[i];
    let group = byName.get(name);
    if (!group) {
      group = await accountingServiceGroupsRepository.createRow({
        firmId,
        name,
        sortOrder: i,
        isActive: true,
        isPubliclyListed: true,
      });
    } else {
      group = await accountingServiceGroupsRepository.updateRow(group.id, firmId, {
        sortOrder: i,
        isActive: true,
        isPubliclyListed: true,
      });
    }
    out.set(name, group.id);
  }
  return out;
}

async function buildHubCatalog(firmId, groupIds, heroImagePath) {
  let services = await accountingServicesRepository.listByFirm(firmId, { activeOnly: false });
  const keepPublic = new Set();
  let sort = 0;

  for (const hub of HUBS) {
    const groupId = groupIds.get(hub.group) || null;
    const childIds = [];
    for (const ref of hub.children) {
      const s = findService(services, ref);
      if (s) childIds.push(s.id);
    }
    if (!childIds.length) {
      console.warn(`Hub ${hub.slug}: sem filhos encontrados — ignorado.`);
      continue;
    }

    let parent = services.find((s) => s.slug === hub.slug);
    const imageUrl = heroImagePath;
    const base = {
      name: hub.name,
      description: hub.description,
      groupId,
      imageUrl: parent?.imageUrl || imageUrl,
      isPubliclyListed: true,
      isActive: true,
      requiresBooking: hub.requiresBooking === true,
      priceCents: 0,
      durationMinutes: hub.durationMinutes || 30,
      sortOrder: sort,
    };
    sort += 1;

    if (!parent) {
      parent = await accountingServicesRepository.createRow({
        firmId,
        slug: hub.slug,
        ...base,
      });
      services.push(parent);
    } else {
      await accountingServicesRepository.updateRow(parent.id, firmId, base);
    }

    await accountingServiceOptionsRepository.replaceForParent(firmId, parent.id, childIds);
    keepPublic.add(parent.id);
    for (const cid of childIds) {
      keepPublic.add(cid);
      await accountingServicesRepository.updateRow(cid, firmId, {
        groupId,
        isPubliclyListed: true,
        isActive: true,
      });
    }
  }

  for (const s of services) {
    if (keepPublic.has(s.id)) continue;
    if (!s.isPubliclyListed) continue;
    await accountingServicesRepository.updateRow(s.id, firmId, { isPubliclyListed: false });
  }

  console.log(`${keepPublic.size} serviços visíveis (ofertas + opções); ${HUBS.length} ofertas principais.`);
}

async function refreshPublicSite(firmId, ownerId, logoKey, heroPath, instPath, faqPath, consultoria, irs) {
  const heroId = 'img_hero_main';
  const aboutId = 'img_about_main';
  const faqImgId = 'img_faq_main';
  const siteConfig = normalizeSiteConfig({
    seo: {
      title: `${FIRM_NAME} — Contabilidade em ${CITY_LABEL.split(',')[0]}`,
      description: PUBLIC_TAGLINE,
    },
    theme: {
      primaryColor: PRIMARY,
      secondaryColor: SECONDARY,
      textColor: '#0F172A',
      backgroundColor: BG,
      surfaceColor: SURFACE,
      mutedTextColor: '#64748B',
      logoStorageKey: logoKey,
      headerLogoSource: 'firm',
      heroLogoSource: 'firm',
    },
    images: {
      hero: [{ id: heroId, storageKey: heroPath, alt: `${FIRM_NAME} — equipa` }],
      institutional: [{ id: aboutId, storageKey: instPath, alt: `Escritório ${FIRM_NAME}` }],
      bySection: {
        faq: [{ id: faqImgId, storageKey: faqPath, alt: 'Esclarecimentos fiscais' }],
        contact: [{ id: aboutId, storageKey: instPath, alt: `Contacte ${FIRM_NAME}` }],
      },
    },
    socialLinks: {},
    showPrices: true,
    sections: [
      {
        type: 'header',
        enabled: true,
        order: 0,
        content: { title: FIRM_NAME, showNav: true },
      },
      {
        type: 'hero',
        enabled: true,
        order: 1,
        content: {
          title: 'Soluções de contabilidade e fiscalidade que fazem a diferença.',
          tagline: 'A sua empresa em boas mãos',
          bio: `${FIRM_NAME} acompanha particulares e empresas em IRS, IVA, salários e consultoria — com portal do cliente, documentos e prazos num só sítio.`,
          imageIds: [heroId],
          imageFit: 'cover',
          imagePosition: 'center',
          backgroundOverlay: 48,
          backgroundColor: SURFACE,
          ctas: [
            consultoria
              ? {
                  label: 'Marcar consultoria',
                  style: 'primary',
                  target: { type: 'service-detail', serviceId: consultoria.slug || 'hub-consultoria-estrategica' },
                }
              : { label: 'Ver serviços', style: 'primary', target: { type: 'booking' } },
            irs
              ? { label: 'IRS — ver modalidades', style: 'secondary', target: { type: 'service-detail', serviceId: 'hub-irs-declaracao' } }
              : { label: 'Contactar', style: 'secondary', target: { type: 'contact-form' } },
          ],
        },
      },
      {
        type: 'about',
        enabled: true,
        order: 2,
        content: {
          heading: 'Escritório de confiança, operação digital',
          body: `${FIRM_NAME} reúne experiência contabilística e ferramentas modernas: página pública com ofertas claras, portal do cliente, alertas, validade de certidões e agenda de consultorias. Em ${CITY_LABEL} — e online para toda a carteira.`,
          imageIds: [aboutId],
          backgroundColor: '#FFFFFF',
          showImage: true,
          imagePlacement: 'right',
          imageSize: 'lg',
        },
      },
      {
        type: 'services',
        enabled: true,
        order: 3,
        content: {
          heading: 'Consultorias com marcação',
          mode: 'auto',
          backgroundColor: BG,
        },
      },
      {
        type: 'bookingServices',
        enabled: true,
        order: 4,
        content: {
          heading: '',
          mode: 'auto',
          backgroundColor: SURFACE,
          featuredHeading: '',
          catalogHeading: '',
          featuredServiceSlugs: HUBS.slice(0, 3).map((h) => h.slug),
        },
      },
      {
        type: 'features',
        enabled: true,
        order: 5,
        content: {
          backgroundColor: BG,
          items: [
            {
              id: 'f1',
              title: 'Ofertas + opções',
              description: 'Serviços principais com modalidades dentro — IRS, empresas, salários, sem lista confusa.',
            },
            {
              id: 'f2',
              title: 'Portal do cliente',
              description: 'Documentos, alertas com PDF, mensagens e prazos — o cliente sabe o que fazer.',
            },
            {
              id: 'f3',
              title: 'Grupos por área',
              description: 'IRS, PME, consultoria e registos — navegação clara no site e no menu Áreas.',
            },
            {
              id: 'f4',
              title: 'Equipa coordenada',
              description: 'Permissões, tarefas e calendário fiscal alinhados ao escritório.',
            },
          ],
          showImage: true,
          imagePlacement: 'above',
          imageSize: 'md',
          imageIds: [aboutId],
        },
      },
      {
        type: 'process',
        enabled: true,
        order: 6,
        content: {
          backgroundColor: SURFACE,
          showImage: true,
          imagePlacement: 'left',
          imageSize: 'md',
          imageIds: [heroId],
          steps: [
            { id: 'p1', title: 'Escolha a oferta', description: 'No site, abra o serviço principal e seleccione a modalidade (filho).' },
            { id: 'p2', title: 'Envie documentos', description: 'Lista automática consoante o serviço — portal ou formulário.' },
            { id: 'p3', title: 'Acompanhamento', description: 'Prazos, mensagens e alertas até concluir.' },
          ],
        },
      },
      {
        type: 'faq',
        enabled: true,
        order: 7,
        content: {
          backgroundColor: BG,
          items: [
            {
              id: 'q1',
              question: 'O que é um serviço principal com opções?',
              answer:
                'Por exemplo «IRS — Declaração anual»: dentro escolhe Modelo 3, simulação, anexo ou consultoria. Evita dezenas de páginas soltas.',
            },
            {
              id: 'q2',
              question: 'Como marco consultoria?',
              answer: 'Abra a oferta «Consultoria & assessoria» e escolha a modalidade com calendário.',
            },
            {
              id: 'q3',
              question: 'Onde envio documentos?',
              answer: 'No portal do cliente, em Documentos, ou na resposta a um pedido do escritório.',
            },
            {
              id: 'q4',
              question: 'Atendem presencialmente?',
              answer: `Sim, em ${CITY_LABEL}, com marcação. Muito resolve-se online.`,
            },
          ],
          showImage: true,
          imagePlacement: 'right',
          imageSize: 'sm',
          imageIds: [faqImgId],
        },
      },
      {
        type: 'contact',
        enabled: true,
        order: 8,
        content: {
          showEmail: true,
          showPhone: true,
          showAddress: true,
          backgroundColor: SURFACE,
          showImage: true,
          imagePlacement: 'above',
          imageSize: 'full',
          imageIds: [aboutId],
        },
      },
      { type: 'footer', enabled: true, order: 9, content: {} },
    ],
  });

  await firmPublicSitesRepository.upsertDraft(firmId, siteConfig, ownerId);
  await firmPublicSitesRepository.publish(firmId, ownerId);
  await firmsRepository.updateFirmBranding(firmId, {
    primaryColor: PRIMARY,
    secondaryColor: SECONDARY,
    textColor: '#0F172A',
  });
}

async function main() {
  assertStaging();
  if (!isSupabaseConfigured()) throw new Error('Supabase não configurado.');

  const owner = await resolveOwner();
  const firmId = owner.firm_id;
  console.log(`Polish · firm ${firmId} · ${owner.email}`);

  const officeFile = readPng('afdigital-office.png');
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
  const faqUpload = await contabilStorage.uploadPublicSiteImage({
    firmId,
    slot: 'section',
    file: readPng('afdigital-mark.png'),
  });

  const groupIds = await ensureGroups(firmId);
  await buildHubCatalog(firmId, groupIds, heroUpload.path);

  const services = await accountingServicesRepository.listByFirm(firmId, { activeOnly: true });
  const consultoria = services.find((s) => s.slug === 'hub-consultoria-estrategica');
  const irs = services.find((s) => s.slug === 'hub-irs-declaracao');
  const firm = await firmsRepository.findFirmById(firmId);
  const logoKey = firm.settings?.branding?.logoStorageKey || null;

  await refreshPublicSite(
    firmId,
    owner.id,
    logoKey,
    heroUpload.path,
    instUpload.path,
    faqUpload.path,
    consultoria,
    irs,
  );

  const published = await firmsRepository.findFirmById(firmId);
  console.log('Apresentação actualizada.');
  console.log(`Pública: https://staging.teglion.com/${published.slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
