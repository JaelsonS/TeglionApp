/**
 * Garante proposta utilizável quando o modelo devolve publicSitePatch vazio ou serviços em falta.
 */
function toneCopy(tone) {
  return tone === 'formal'
    ? { tagline: 'Contabilidade rigorosa e transparente', voice: 'presta' }
    : { tagline: 'Contabilidade clara e próxima', voice: 'apoia' };
}

function ensureProposalFromContext(proposal, context) {
  const out = { ...proposal, publicSitePatch: { ...(proposal.publicSitePatch || {}) } };
  const answers = context.answers || {};
  const firmName = String(context.firmName || 'O seu escritório').trim();
  const region = String(context.cityRegion || answers.cityRegion || '').trim()
    || (context.countryCode === 'BR' ? 'Brasil' : 'Portugal');
  const tone = answers.tone === 'formal' ? 'formal' : 'friendly';
  const copy = toneCopy(tone);
  const brief = String(answers.ownerBrief || '').trim().slice(0, 600);

  const patch = out.publicSitePatch;
  const hasSeo = Boolean(patch.seo?.title || patch.seo?.description);
  const hasSections = Array.isArray(patch.sections) && patch.sections.length > 0;

  if (!hasSeo) {
    patch.seo = {
      title: `${firmName} — contabilidade`.slice(0, 70),
      description: `Serviços de contabilidade em ${region}.`.slice(0, 200),
      ...(patch.seo || {}),
    };
  }
  if (!patch.theme?.primaryColor) {
    patch.theme = { primaryColor: '#1e4d8c', secondaryColor: '#0ea5e9', ...(patch.theme || {}) };
  }
  const specLine = Array.isArray(answers.specialties) && answers.specialties.length
    ? `Áreas: ${answers.specialties.slice(0, 5).join(', ')}.`
    : '';
  const serviceKeys = Array.isArray(answers.serviceCatalogKeys) ? answers.serviceCatalogKeys : [];

  if (!hasSections) {
    patch.sections = buildDefaultSections({ firmName, region, copy, brief, specLine, serviceKeys });
  } else {
    patch.sections = mergeMissingSectionTypes(patch.sections, {
      firmName,
      region,
      copy,
      brief,
      specLine,
      serviceKeys,
    });
  }

  if (hasSections && brief) {
    const about = patch.sections.find((s) => s.type === 'about');
    if (about?.content && !about.content.body) {
      about.content.body = brief.slice(0, 4000);
    }
  }

  out.publicSitePatch = patch;

  if (!Array.isArray(out.services) || !out.services.length) {
    const keys = Array.isArray(answers.serviceCatalogKeys) ? answers.serviceCatalogKeys : [];
    out.services = keys.map((catalogKey) => ({ catalogKey }));
  }

  if (!out.booking?.defaultSchedule || !Object.keys(out.booking.defaultSchedule).length) {
    out.booking = {
      timezone: context.countryCode === 'BR' ? 'UTC' : 'Europe/Lisbon',
      defaultSchedule: {
        1: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        2: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        3: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        4: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        5: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
      },
      ...(out.booking || {}),
    };
  }

  if (!out.rationale) {
    out.rationale =
      'Proposta preparada a partir do questionário — reveja textos e serviços antes de aplicar o rascunho.';
  }

  return out;
}

function buildDefaultSections({ firmName, region, copy, brief, specLine, serviceKeys }) {
  const aboutBody =
    brief || `Escritório de contabilidade em ${region}, focado em acompanhamento próximo e processos digitais.`;
  return [
    {
      type: 'hero',
      enabled: true,
      content: {
        title: firmName.slice(0, 120),
        tagline: copy.tagline.slice(0, 160),
        bio: `${copy.voice.charAt(0).toUpperCase()}${copy.voice.slice(1)} particulares e empresas em ${region}. ${specLine}`.slice(
          0,
          2000,
        ),
      },
    },
    {
      type: 'about',
      enabled: true,
      content: { heading: 'Sobre o escritório', body: aboutBody.slice(0, 4000) },
    },
    {
      type: 'services',
      enabled: true,
      content: {
        heading: 'Serviços',
        body: 'Consultas e acompanhamento adaptados a particulares e empresas.'.slice(0, 4000),
      },
    },
    {
      type: 'features',
      enabled: true,
      content: {
        heading: 'Porquê connosco',
        items: defaultFeatureItems(region, serviceKeys),
      },
    },
    {
      type: 'process',
      enabled: true,
      content: {
        heading: 'Como funciona',
        steps: defaultProcessSteps(copy.voice),
      },
    },
    {
      type: 'faq',
      enabled: true,
      content: { items: defaultFaqItems(region) },
    },
    {
      type: 'contact',
      enabled: true,
      content: {
        heading: 'Contacte-nos',
        body: 'Peça informações ou marque uma consulta pela página ou pelos contactos do escritório.'.slice(0, 4000),
      },
    },
  ];
}

function mergeMissingSectionTypes(existing, ctx) {
  const types = new Set(existing.map((s) => s.type));
  const defaults = buildDefaultSections(ctx);
  const merged = [...existing];
  for (const def of defaults) {
    if (!types.has(def.type)) merged.push(def);
  }
  return merged;
}

function defaultFeatureItems(region, serviceKeys) {
  const items = [
    { title: 'Proximidade', description: `Equipa acessível em ${region} com respostas claras.` },
    { title: 'Processos digitais', description: 'Partilha de documentos e prazos organizados online.' },
  ];
  if (serviceKeys.some((k) => String(k).includes('irs'))) {
    items.push({ title: 'IRS e fiscalidade', description: 'Apoio em declarações e simulações, com revisão humana.' });
  }
  return items.slice(0, 6);
}

function defaultProcessSteps(voice) {
  return [
    { title: 'Contacto', description: 'Escolha o serviço ou envie uma mensagem pela página.' },
    { title: 'Recolha', description: 'Indique o essencial — o escritório pede documentos se necessário.' },
    { title: 'Acompanhamento', description: `O escritório ${voice} até concluir o pedido.` },
  ];
}

function defaultFaqItems(region) {
  return [
    {
      question: 'Como marco uma consulta?',
      answer: 'Use os serviços disponíveis na página ou os contactos indicados pelo escritório.',
    },
    {
      question: 'Atendem empresas e particulares?',
      answer: `Sim — o escritório acompanha ambos em ${region} e online.`,
    },
    {
      question: 'Os valores incluem IVA?',
      answer: 'Os preços indicados na página seguem a informação de cada serviço; confirme com o escritório.',
    },
  ];
}

module.exports = { ensureProposalFromContext, buildDefaultSections };
