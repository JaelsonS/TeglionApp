const crypto = require('crypto');
const { AppError } = require('../../middlewares/error.middleware');
const { mapDbError } = require('../../utils/db-error');
const accountingServicesRepository = require('../../db/supabase/repositories/accounting-services.repository');
const { CONSULTING_SERVICES_CATALOG } = require('../../data/consulting-services-catalog');
const { BOOKING_TIMEZONES } = require('../booking/booking.service');
const contabilStorage = require('../../services/storage/contabil-storage.service');

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function normalizeSlug(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const slug = String(value).trim().toLowerCase();
  if (!SLUG_RE.test(slug) || slug.length > 80) {
    throw new AppError('Slug inválido — use apenas letras minúsculas, números e hífen', 400);
  }
  return slug;
}

const DOCUMENT_TIMINGS = new Set(['immediate', 'manual']);

/**
 * `timing` decide QUANDO um documento condicional chega ao cliente (ver
 * especificação da sessão sobre "pedir já vs sugerir depois"):
 * - 'immediate' (omissão, compatível com dados já existentes): entra no
 *   checklist inicial assim que o cliente submete o formulário — igual ao
 *   comportamento de sempre.
 * - 'manual': não é enviado automaticamente; fica como sugestão na vista
 *   da solicitação, e só é pedido ao cliente quando a contabilista decidir
 *   (reaproveita o mesmo mecanismo de "pendência" já existente).
 */
function normalizeDocumentRequirements(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new AppError('document_requirements deve ser uma lista', 400);
  return value.slice(0, 50).map((item) => ({
    tag: String(item?.tag || '').trim().slice(0, 60),
    title: String(item?.title || '').trim().slice(0, 200),
    instructions: item?.instructions != null ? String(item.instructions).trim().slice(0, 2000) : null,
    timing: DOCUMENT_TIMINGS.has(item?.timing) ? item.timing : 'immediate',
  })).filter((item) => item.tag && item.title);
}

const TIME_RE = /^\d{1,2}:\d{2}$/;
const BOOKING_TZ_SET = new Set(BOOKING_TIMEZONES);

/**
 * Overrides de agendamento por Service (ver plan file da sessão, v8, secção 4)
 * — mesma forma de FirmBookingSettings, mas cada campo é opcional: um campo
 * ausente significa "usa a regra geral do escritório" para esse campo
 * especificamente, não um valor por omissão embutido aqui. `null`/ausente no
 * objecto inteiro significa "sem overrides, usa tudo do escritório" (o
 * comportamento de sempre, sem regressão — ver booking.service.js#listSlotsForBooking).
 */
function normalizeBookingOverrides(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError('booking_overrides deve ser um objeto', 400);
  }
  const out = {};
  if (value.slotMinutes != null) {
    const n = Number(value.slotMinutes);
    if (!Number.isFinite(n) || n < 15 || n > 120) throw new AppError('slotMinutes inválido', 400);
    out.slotMinutes = n;
  }
  if (value.horizonDays != null) {
    const n = Number(value.horizonDays);
    if (!Number.isFinite(n) || n < 1 || n > 60) throw new AppError('horizonDays inválido', 400);
    out.horizonDays = n;
  }
  if (value.leadTimeHours != null) {
    const n = Number(value.leadTimeHours);
    if (!Number.isFinite(n) || n < 0 || n > 168) throw new AppError('leadTimeHours inválido', 400);
    out.leadTimeHours = n;
  }
  if (value.weekdays != null) {
    if (!Array.isArray(value.weekdays)) throw new AppError('weekdays deve ser uma lista', 400);
    const weekdays = [...new Set(value.weekdays.map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!weekdays.length) throw new AppError('Seleccione pelo menos um dia', 400);
    out.weekdays = weekdays;
  }
  if (value.dayStart != null) {
    if (!TIME_RE.test(value.dayStart)) throw new AppError('dayStart inválido', 400);
    out.dayStart = value.dayStart;
  }
  if (value.dayEnd != null) {
    if (!TIME_RE.test(value.dayEnd)) throw new AppError('dayEnd inválido', 400);
    out.dayEnd = value.dayEnd;
  }
  if (value.schedule != null) {
    if (typeof value.schedule !== 'object' || Array.isArray(value.schedule)) {
      throw new AppError('schedule deve ser um objeto', 400);
    }
    const schedule = {};
    for (let d = 0; d <= 6; d += 1) {
      const intervals = value.schedule[d] ?? value.schedule[String(d)];
      if (intervals === undefined) continue;
      if (!Array.isArray(intervals)) throw new AppError('schedule[dia] deve ser uma lista', 400);
      const normalized = intervals
        .map((iv) => {
          if (!iv || typeof iv !== 'object') return null;
          if (!TIME_RE.test(iv.start) || !TIME_RE.test(iv.end)) return null;
          return { start: iv.start, end: iv.end };
        })
        .filter(Boolean)
        .slice(0, 8);
      if (normalized.length) schedule[d] = normalized;
    }
    out.schedule = schedule;
    // weekdays derivados do schedule quando não veio weekdays explícito
    if (value.weekdays == null) {
      out.weekdays = Object.keys(schedule).map(Number).sort((a, b) => a - b);
      if (!out.weekdays.length) throw new AppError('Seleccione pelo menos um dia', 400);
    }
  }
  if (value.dateOverrides != null) {
    if (typeof value.dateOverrides !== 'object' || Array.isArray(value.dateOverrides)) {
      throw new AppError('dateOverrides deve ser um objeto', 400);
    }
    const dateOverrides = {};
    for (const [dateStr, intervals] of Object.entries(value.dateOverrides)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      if (!Array.isArray(intervals)) throw new AppError('dateOverrides[data] deve ser uma lista', 400);
      if (intervals.length === 0) {
        dateOverrides[dateStr] = [];
        continue;
      }
      dateOverrides[dateStr] = intervals
        .map((iv) => {
          if (!iv || typeof iv !== 'object') return null;
          if (!TIME_RE.test(iv.start) || !TIME_RE.test(iv.end)) return null;
          return { start: iv.start, end: iv.end };
        })
        .filter(Boolean)
        .slice(0, 8);
    }
    out.dateOverrides = dateOverrides;
  }
  if (value.timezone != null) {
    if (!BOOKING_TZ_SET.has(value.timezone)) throw new AppError('timezone inválido', 400);
    out.timezone = value.timezone;
  }
  return Object.keys(out).length ? out : null;
}

const INTAKE_QUESTION_TYPES = new Set([
  'text', 'email', 'phone', 'tax_id', 'date', 'single_choice', 'multiple_choice', 'yes_no',
]);
const CHOICE_TYPES = new Set(['single_choice', 'multiple_choice', 'yes_no']);

/**
 * ID estável de pergunta/opção — gerado uma única vez na criação, nunca
 * re-derivado de `label` (ver secção E1 da especificação da sessão: o `id`
 * antigo mudava sempre que o texto da pergunta era editado, desalinhando
 * `service_inquiries.answers` já submetidas). Usado só como rede de
 * segurança quando o chamador não fornece um `id` (ex.: chamada directa à
 * API); o caminho normal é o frontend gerar o `id` no momento da criação.
 */
function generateStableId(prefix) {
  return `${prefix}${crypto.randomUUID()}`;
}

function normalizeIntakeFormOptions(options) {
  if (!Array.isArray(options)) return [];
  return options
    .slice(0, 20)
    .map((opt) => ({
      id: String(opt?.id || generateStableId('o_')).trim().slice(0, 100),
      label: String(opt?.label || '').trim().slice(0, 200),
      documentTags: Array.isArray(opt?.documentTags)
        ? opt.documentTags.slice(0, 10).map((t) => String(t).trim().slice(0, 60)).filter(Boolean)
        : [],
    }))
    .filter((opt) => opt.label);
}

/**
 * Formulário de captação de um Service — perguntas + opções, cada opção pode
 * activar tags de documento (condicional resposta→documento; ver decisão nº1
 * da especificação da sessão: não é ramificação pergunta→pergunta).
 */
function normalizeIntakeForm(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'object' || !Array.isArray(value.questions)) {
    throw new AppError('intake_form deve ter uma lista de perguntas', 400);
  }
  const questions = value.questions
    .slice(0, 30)
    .map((q) => {
      const type = String(q?.type || 'text');
      if (!INTAKE_QUESTION_TYPES.has(type)) {
        throw new AppError(`Tipo de pergunta inválido: ${type}`, 400);
      }
      const label = String(q?.label || '').trim().slice(0, 300);
      if (!label) return null;
      const question = {
        id: String(q?.id || generateStableId('q_')).trim().slice(0, 100),
        label,
        type,
        required: q?.required === true,
      };
      if (CHOICE_TYPES.has(type)) {
        const options = normalizeIntakeFormOptions(q?.options);
        question.options = options.length
          ? options
          : type === 'yes_no'
            ? [
                { id: 'sim', label: 'Sim', documentTags: [] },
                { id: 'nao', label: 'Não', documentTags: [] },
              ]
            : [];
      }
      return question;
    })
    .filter(Boolean);
  return { questions };
}

/**
 * Junta os documentos base do Service (sempre exigidos) com os documentos
 * condicionais activados pelas respostas (resposta→tag, via intake_form).
 * Base tem sempre prioridade sobre título/instruções em caso de tag repetida.
 */
function resolveRequiredDocuments(service, answers) {
  const answersMap = answers && typeof answers === 'object' ? answers : {};
  const conditionalByTag = new Map();
  for (const question of service?.intakeForm?.questions || []) {
    if (!Array.isArray(question.options) || !question.options.length) continue;
    const answer = answersMap[question.id];
    const chosenIds = Array.isArray(answer) ? answer.map(String) : answer != null ? [String(answer)] : [];
    if (!chosenIds.length) continue;
    for (const option of question.options) {
      if (!chosenIds.includes(option.id)) continue;
      for (const tag of option.documentTags || []) {
        if (!conditionalByTag.has(tag)) {
          conditionalByTag.set(tag, { tag, title: tag, instructions: null, timing: 'immediate' });
        }
      }
    }
  }

  const merged = new Map(conditionalByTag);
  for (const req of service?.documentRequirements || []) {
    if (req?.tag) {
      merged.set(req.tag, {
        tag: req.tag,
        title: req.title,
        instructions: req.instructions || null,
        timing: req.timing === 'manual' ? 'manual' : 'immediate',
      });
    }
  }
  return Array.from(merged.values());
}

/** Separa o resultado de resolveRequiredDocuments() pelo momento em que
 * cada documento deve chegar ao cliente — ver normalizeDocumentRequirements
 * para o racional de 'immediate' vs 'manual'. */
function splitDocumentsByTiming(requiredDocuments) {
  const immediate = requiredDocuments.filter((d) => d.timing !== 'manual');
  const manual = requiredDocuments.filter((d) => d.timing === 'manual');
  return { immediate, manual };
}

/**
 * Validação de completude antes de publicar (Fase 5 — ver plan file da sessão,
 * v5/v7: "validação bloqueando publicação incompleta"). Só bloqueia o que
 * quebraria a página pública de facto — uma pergunta de escolha única/múltipla
 * sem nenhuma opção renderiza um campo vazio e inutilizável. yes_no nunca cai
 * aqui porque normalizeIntakeForm() já lhe dá Sim/Não por omissão.
 */
function assertFormReadyForPublish(intakeForm) {
  const questions = intakeForm?.questions || [];
  for (const q of questions) {
    if ((q.type === 'single_choice' || q.type === 'multiple_choice') && (!q.options || q.options.length === 0)) {
      throw new AppError(`A pergunta "${q.label}" precisa de pelo menos uma opção antes de publicar`, 400);
    }
  }
}

function parsePriceEuros(payload) {
  if (payload?.priceEuros != null) {
    const priceEuros = Number(payload.priceEuros);
    if (!Number.isFinite(priceEuros) || priceEuros < 0) throw new AppError('Preço inválido', 400);
    return Math.round(priceEuros * 100);
  }
  if (payload?.priceCents != null) {
    const priceCents = Number(payload.priceCents);
    if (!Number.isFinite(priceCents) || priceCents < 0) throw new AppError('Preço inválido', 400);
    return Math.round(priceCents);
  }
  return undefined;
}

async function resolveServiceImageUrl(imageRef) {
  if (!imageRef) return null;
  const raw = String(imageRef).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('firm/')) {
    try {
      return await contabilStorage.createSignedDownloadUrl(raw, 86400);
    } catch {
      return null;
    }
  }
  return raw;
}

async function enrichService(item) {
  if (!item) return item;
  const key = item.imageStorageKey || item.imageUrl;
  const imageStorageKey = key && String(key).startsWith('firm/') ? key : item.imageStorageKey || null;
  const imageUrl = await resolveServiceImageUrl(key);
  return { ...item, imageUrl, imageStorageKey };
}

async function list({ firmId, activeOnly }) {
  const items = await accountingServicesRepository.listByFirm(firmId, { activeOnly: Boolean(activeOnly) });
  return { items: await Promise.all(items.map(enrichService)) };
}

async function create({ firmId, payload }) {
  const name = String(payload?.name || '').trim();
  if (!name) throw new AppError('Nome do serviço é obrigatório', 400);
  const duration = Number(payload?.durationMinutes);
  if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
    throw new AppError('Duração deve estar entre 15 e 480 minutos', 400);
  }
  const priceCents = parsePriceEuros(payload) ?? 0;
  const slug = normalizeSlug(payload?.slug) ?? null;
  const isPubliclyListed = payload?.isPubliclyListed === true;
  const intakeForm = normalizeIntakeForm(payload?.intakeForm) || null;
  if (isPubliclyListed) {
    if (!slug) throw new AppError('Defina um slug antes de tornar o serviço público', 400);
    assertFormReadyForPublish(intakeForm);
  }
  const item = await accountingServicesRepository.createRow({
    firmId,
    name,
    description: payload?.description,
    imageUrl: payload?.imageStorageKey || payload?.imageUrl || null,
    durationMinutes: duration,
    priceCents,
    currency: String(payload?.currency || 'EUR').toUpperCase().slice(0, 3),
    sortOrder: payload?.sortOrder != null ? Number(payload.sortOrder) : 0,
    catalogKey: payload?.catalogKey || null,
    isActive: payload?.isActive !== false,
    slug,
    isPubliclyListed,
    requiresBooking: payload?.requiresBooking === true,
    documentRequirements: normalizeDocumentRequirements(payload?.documentRequirements) || [],
    intakeForm,
    bookingOverrides: normalizeBookingOverrides(payload?.bookingOverrides) || null,
  });
  return { item: await enrichService(item) };
}

async function update({ firmId, id, payload }) {
  const existing = await accountingServicesRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Serviço não encontrado', 404);

  const patch = {};
  if (payload?.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) throw new AppError('Nome do serviço é obrigatório', 400);
    patch.name = name;
  }
  if (payload?.description !== undefined) patch.description = payload.description;
  if (payload?.imageStorageKey !== undefined) patch.imageUrl = payload.imageStorageKey;
  else if (payload?.imageUrl !== undefined) patch.imageUrl = payload.imageUrl;
  if (payload?.durationMinutes !== undefined) {
    const duration = Number(payload.durationMinutes);
    if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
      throw new AppError('Duração deve estar entre 15 e 480 minutos', 400);
    }
    patch.durationMinutes = duration;
  }
  const priceCents = parsePriceEuros(payload);
  if (priceCents !== undefined) patch.priceCents = priceCents;
  if (payload?.isActive !== undefined) patch.isActive = Boolean(payload.isActive);
  if (payload?.slug !== undefined) patch.slug = normalizeSlug(payload.slug);
  if (payload?.requiresBooking !== undefined) patch.requiresBooking = Boolean(payload.requiresBooking);
  if (payload?.documentRequirements !== undefined) {
    patch.documentRequirements = normalizeDocumentRequirements(payload.documentRequirements);
  }
  if (payload?.intakeForm !== undefined) {
    patch.intakeForm = normalizeIntakeForm(payload.intakeForm);
  }
  if (payload?.bookingOverrides !== undefined) {
    patch.bookingOverrides = normalizeBookingOverrides(payload.bookingOverrides);
  }
  if (payload?.paymentMethod !== undefined) {
    const allowed = new Set(['bank_transfer', 'multibanco', 'stripe_connect']);
    const method = String(payload.paymentMethod);
    if (!allowed.has(method)) throw new AppError('Meio de pagamento inválido', 400);
    patch.paymentMethod = method;
  }
  if (payload?.isPubliclyListed !== undefined) {
    const nextSlug = patch.slug !== undefined ? patch.slug : existing.slug;
    if (payload.isPubliclyListed === true) {
      if (!nextSlug) throw new AppError('Defina um slug antes de tornar o serviço público', 400);
      const nextIntakeForm = patch.intakeForm !== undefined ? patch.intakeForm : existing.intakeForm;
      assertFormReadyForPublish(nextIntakeForm);
    }
    patch.isPubliclyListed = Boolean(payload.isPubliclyListed);
  }

  const item = await accountingServicesRepository.updateRow(id, firmId, patch);
  return { item: await enrichService(item) };
}

/**
 * Duplica um serviço (ex.: "IRS 2026" -> "IRS 2026 (cópia)", o escritório edita
 * o nome para "IRS 2027" depois). Nunca copia slug/is_publicly_listed — um
 * duplicado nasce sempre privado, sem endereço público, para o escritório
 * rever antes de publicar (evita 2 serviços a disputar o mesmo slug).
 */
async function duplicate({ firmId, id }) {
  const existing = await accountingServicesRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Serviço não encontrado', 404);

  const item = await accountingServicesRepository.createRow({
    firmId,
    name: `${existing.name} (cópia)`,
    description: existing.description,
    imageUrl: existing.imageStorageKey || existing.imageUrl || null,
    durationMinutes: existing.durationMinutes,
    priceCents: existing.priceCents,
    currency: existing.currency,
    sortOrder: existing.sortOrder,
    catalogKey: null,
    isActive: false,
    slug: null,
    isPubliclyListed: false,
    requiresBooking: existing.requiresBooking,
    documentRequirements: existing.documentRequirements,
    intakeForm: existing.intakeForm,
    bookingOverrides: existing.bookingOverrides,
  });
  return { item: await enrichService(item) };
}

/**
 * Apaga um serviço. `service_inquiries.service_id` tem `ON DELETE RESTRICT`
 * (ver migration 20260903000000) — a base de dados rejeita a operação se
 * existir alguma solicitação associada, o que é o comportamento certo aqui:
 * apagar apagaria também o histórico de captação dessa solicitação. Nesse
 * caso devolvemos uma mensagem clara a sugerir desactivar em vez de apagar.
 */
async function remove({ firmId, id }) {
  const existing = await accountingServicesRepository.findByIdForFirm(id, firmId);
  if (!existing) throw new AppError('Serviço não encontrado', 404);
  try {
    await accountingServicesRepository.deleteRow(id, firmId);
  } catch (err) {
    throw mapDbError(
      err,
      'Este serviço tem solicitações associadas e não pode ser apagado. Desactive-o em vez disso.',
    );
  }
  return { ok: true };
}

async function bulkPatch({ firmId, ids, patch }) {
  const list = Array.isArray(ids) ? ids.filter(Boolean) : [];
  if (!list.length) throw new AppError('Seleccione pelo menos um serviço', 400);

  const repoPatch = {};
  if (patch?.isActive !== undefined) repoPatch.isActive = Boolean(patch.isActive);
  if (patch?.durationMinutes !== undefined) {
    const duration = Number(patch.durationMinutes);
    if (!Number.isFinite(duration) || duration < 15 || duration > 480) {
      throw new AppError('Duração inválida', 400);
    }
    repoPatch.durationMinutes = duration;
  }
  const priceCents = parsePriceEuros(patch);
  if (priceCents !== undefined) repoPatch.priceCents = priceCents;

  if (!Object.keys(repoPatch).length) throw new AppError('Nada para actualizar', 400);

  const items = await accountingServicesRepository.bulkUpdate(list, firmId, repoPatch);
  return { items, updated: items.length };
}

async function seedCatalog({ firmId }) {
  const existingKeys = await accountingServicesRepository.listCatalogKeys(firmId);
  let created = 0;
  let order = 0;

  for (const entry of CONSULTING_SERVICES_CATALOG) {
    if (existingKeys.has(entry.catalogKey)) continue;
    await accountingServicesRepository.createRow({
      firmId,
      catalogKey: entry.catalogKey,
      name: entry.name,
      description: entry.description || null,
      durationMinutes: entry.durationMinutes,
      priceCents: entry.priceCents,
      sortOrder: order++,
      isActive: false,
      // requiresBooking/documentRequirements/intakeForm são conteúdo/configuração —
      // copiados do template como ponto de partida editável, igual a name/price/duration
      // (sempre copiados). slug/isPubliclyListed são ESTADO DE PUBLICAÇÃO — nunca
      // herdados (nascem sempre null/false), porque publicar tem de ser uma decisão
      // consciente do escritório, feita depois de rever o que copiou. Mesma regra do
      // duplicate(). Em ambos os casos, isto só corre nesta criação única — não há
      // nenhum caminho de update() dentro de seedCatalog(), logo uma segunda execução
      // nunca toca numa linha já existente (guarda na condição `existingKeys.has`, 2 linhas acima).
      requiresBooking: entry.requiresBooking === true,
      documentRequirements: normalizeDocumentRequirements(entry.documentRequirements) || [],
      intakeForm: normalizeIntakeForm(entry.intakeForm) || null,
    });
    created += 1;
  }

  const items = await accountingServicesRepository.listByFirm(firmId, { activeOnly: false });
  return { created, items };
}

/**
 * Activa serviços escolhidos do catálogo nacional — cria SÓ os que o
 * escritório seleccionou, já activos. Não chama seedCatalog(): esse insere
 * as 21 entradas todas de uma vez (usado só uma vez, no registo do
 * escritório) e, se chamado aqui, faria os restantes 20 templates
 * reaparecerem sempre que o escritório activasse 1 serviço — inclusive
 * depois de os ter apagado deliberadamente. Idempotente por catalogKey já
 * existente (activo ou inactivo), como o resto do módulo.
 */
async function activateFromCatalog({ firmId, catalogKeys }) {
  const keys = Array.isArray(catalogKeys) ? catalogKeys.filter(Boolean) : [];
  if (!keys.length) throw new AppError('Seleccione serviços do catálogo', 400);

  const existingKeys = await accountingServicesRepository.listCatalogKeys(firmId);
  const toCreate = CONSULTING_SERVICES_CATALOG.filter(
    (entry) => keys.includes(entry.catalogKey) && !existingKeys.has(entry.catalogKey),
  );

  const items = [];
  for (const entry of toCreate) {
    const { item } = await create({
      firmId,
      payload: {
        catalogKey: entry.catalogKey,
        name: entry.name,
        description: entry.description || null,
        durationMinutes: entry.durationMinutes,
        priceCents: entry.priceCents,
        isActive: true,
        requiresBooking: entry.requiresBooking === true,
        documentRequirements: entry.documentRequirements,
        intakeForm: entry.intakeForm,
      },
    });
    items.push(item);
  }
  return { items, activated: items.length };
}

async function uploadServiceImage({ firmId, file }) {
  if (!file?.buffer?.length) throw new AppError('Selecione uma imagem (JPG, PNG, WebP ou GIF).', 400);
  const uploaded = await contabilStorage.uploadServiceImage({ firmId, file });
  const previewUrl = await contabilStorage.createSignedDownloadUrl(uploaded.path, 86400);
  return { storageKey: uploaded.path, previewUrl };
}

module.exports = {
  list,
  create,
  update,
  remove,
  duplicate,
  bulkPatch,
  seedCatalog,
  activateFromCatalog,
  uploadServiceImage,
  enrichService,
  resolveServiceImageUrl,
  getCatalogTemplate: () => CONSULTING_SERVICES_CATALOG,
  normalizeIntakeForm,
  normalizeBookingOverrides,
  resolveRequiredDocuments,
  splitDocumentsByTiming,
  assertFormReadyForPublish,
};
