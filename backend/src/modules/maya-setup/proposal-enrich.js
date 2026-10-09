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
  if (!hasSections) {
    const specLine = Array.isArray(answers.specialties) && answers.specialties.length
      ? `Áreas: ${answers.specialties.slice(0, 5).join(', ')}.`
      : '';
    patch.sections = [
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
        content: {
          heading: 'Sobre o escritório',
          body: (brief
            || `Escritório de contabilidade em ${region}, focado em acompanhamento próximo e processos digitais.`
          ).slice(0, 4000),
        },
      },
    ];
  } else if (brief) {
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

module.exports = { ensureProposalFromContext };
