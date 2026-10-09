const axios = require('axios');
const { AppError } = require('../../middlewares/error.middleware');
const { logger } = require('../../utils/logger');
const { openAiJsonSchema } = require('./proposal.schema');

const DEFAULT_MODEL = 'gpt-4.1-mini';
const TIMEOUT_MS = 60_000;

function getApiKey() {
  return String(process.env.OPENAI_API_KEY || '').trim();
}

function isMockMode() {
  return process.env.MAYA_SETUP_OPENAI_MOCK === '1' || process.env.NODE_ENV === 'test';
}

function buildMockProposal(context) {
  const cc = String(context.countryCode || 'PT').toUpperCase();
  const services =
    cc === 'BR'
      ? [{ catalogKey: 'consultoria-individual', name: 'Consultoria contábil' }]
      : [
          { catalogKey: 'consultoria-individual', name: 'Consultoria Individual' },
          { catalogKey: 'simulacao-irs', name: 'Simulação de IRS' },
          { catalogKey: 'abertura-atividade', name: 'Abertura de atividade' },
        ];
  return {
    publicSitePatch: {
      seo: {
        title: `${context.firmName || 'Escritório'} — contabilidade`,
        description: `Serviços de contabilidade em ${context.cityRegion || 'Portugal'}.`,
      },
      theme: { primaryColor: '#1e4d8c', secondaryColor: '#0ea5e9' },
      sections: [
        {
          type: 'hero',
          enabled: true,
          content: {
            title: context.firmName || 'O seu escritório de confiança',
            tagline: 'Contabilidade clara e próxima',
            bio: `Apoiamos particulares e empresas em ${context.cityRegion || 'Portugal'}.`,
          },
        },
      ],
    },
    services,
    irs:
      cc === 'PT' && context.irsCampaign
        ? { activateCampaign: true, templateIds: ['irs-modelo-3'] }
        : { activateCampaign: false, templateIds: [] },
    booking: {
      timezone: cc === 'BR' ? 'UTC' : 'Europe/Lisbon',
      defaultSchedule: {
        1: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        2: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        3: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        4: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
        5: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }],
      },
    },
    rationale: 'Proposta gerada para acelerar a configuração inicial — revise antes de aplicar.',
  };
}

function buildSystemPrompt(countryCode) {
  const cc = String(countryCode || 'PT').toUpperCase();
  const irsRule =
    cc === 'PT'
      ? 'Pode sugerir campanha IRS (recolha Modelo 3) com templateIds do catálogo (ex.: irs-modelo-3).'
      : 'Escritório BR: irs.activateCampaign=false e templateIds=[]. Nunca use templates irs-*.';
  return [
    'É a Maya, assistente de onboarding do produto Teglion (contabilidade Portugal/Brasil).',
    'Nunca dê aconselhamento fiscal vinculativo. Textos genéricos, tom profissional.',
    'Não invente NIF, moradas completas, storageKey de imagens, URLs externas nem IDs de serviços existentes.',
    'Output: JSON único conforme schema MayaSetupProposalV1.',
    'Serviços: só catalogKey válidos do catálogo nacional; publish implícito false (não inclua isPubliclyListed).',
    irsRule,
    'booking: timezone Europe/Lisbon (PT) ou UTC (BR); defaultSchedule dias 1-5 (seg-sex).',
  ].join(' ');
}

function buildUserPrompt(context) {
  return JSON.stringify({
    firm: {
      name: context.firmName,
      slug: context.firmSlug,
      countryCode: context.countryCode,
    },
    questionnaire: context.answers,
    allowedCatalogKeys: context.allowedCatalogKeys,
  });
}

async function generateMayaSetupProposal(context) {
  if (isMockMode() || !getApiKey()) {
    if (!isMockMode() && !getApiKey()) {
      throw new AppError('OpenAI não configurado neste ambiente.', 503, { code: 'OPENAI_NOT_CONFIGURED' });
    }
    return { proposal: buildMockProposal(context), requestId: 'mock' };
  }

  const model = String(process.env.MAYA_SETUP_OPENAI_MODEL || DEFAULT_MODEL).trim();
  const body = {
    model,
    temperature: 0.4,
    messages: [
      { role: 'system', content: buildSystemPrompt(context.countryCode) },
      { role: 'user', content: buildUserPrompt(context) },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'maya_setup_proposal_v1',
        strict: false,
        schema: openAiJsonSchema(),
      },
    },
  };

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', body, {
        headers: {
          Authorization: `Bearer ${getApiKey()}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT_MS,
      });
      const requestId = res.headers['x-request-id'] || res.data?.id || null;
      const content = res.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new AppError('Resposta OpenAI vazia.', 502, { code: 'OPENAI_EMPTY' });
      }
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new AppError('Resposta OpenAI não é JSON válido.', 502, { code: 'OPENAI_PARSE' });
      }
      logger.info('MAYA_SETUP_OPENAI_OK', { requestId, model, attempt });
      return { proposal: parsed, requestId };
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      logger.warn('MAYA_SETUP_OPENAI_RETRY', {
        attempt,
        status,
        message: err.message,
      });
      if (attempt === 0 && (status >= 500 || status === 429 || err.code === 'ECONNABORTED')) {
        continue;
      }
      break;
    }
  }

  const msg = lastErr?.response?.data?.error?.message || lastErr?.message || 'OpenAI falhou';
  throw new AppError('Não foi possível gerar a proposta. Tente novamente mais tarde.', 502, {
    code: 'OPENAI_ERROR',
    detail: String(msg).slice(0, 200),
  });
}

module.exports = {
  generateMayaSetupProposal,
  buildMockProposal,
  isMockMode,
};
