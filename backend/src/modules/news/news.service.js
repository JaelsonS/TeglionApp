/**
 * Notícias e atualizações fiscais — portal interno Teglion.
 */
const { AppError } = require('../../middlewares/error.middleware');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const activityService = require('../../services/activity/activity.service');
const contabilStorage = require('../../services/storage/contabil-storage.service');

function ensureClient() {
  if (!isSupabaseConfigured()) {
    throw new AppError('Base de dados não configurada', 503);
  }
  return getSupabaseAdmin();
}

function slugify(title) {
  const base = String(title || 'noticia')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72);
  return base || 'noticia';
}

/** Garante slug único por escritório: noticia, noticia-2, noticia-3… */
async function resolveUniqueSlug(sb, firmId, baseSlug) {
  const root = baseSlug || 'noticia';
  let candidate = root;
  for (let n = 0; n < 100; n += 1) {
    const { data, error } = await sb
      .from('news_articles')
      .select('id')
      .eq('firm_id', firmId)
      .eq('slug', candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
    candidate = n === 0 ? `${root}-2` : `${root}-${n + 2}`;
  }
  return `${root}-${Date.now()}`;
}

function estimateReadingTime(body) {
  const words = String(body || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function resolveCoverUrl(coverRef) {
  if (!coverRef) return null;
  const raw = String(coverRef).trim();
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

async function enrichArticle(article) {
  if (!article) return article;
  const key = article.coverStorageKey || article.coverUrl;
  const coverStorageKey = key && String(key).startsWith('firm/') ? key : article.coverStorageKey || null;
  const coverUrl = await resolveCoverUrl(key);
  return { ...article, coverUrl, coverStorageKey };
}

function mapArticle(row) {
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    coverUrl: row.cover_url,
    coverStorageKey: row.cover_url && String(row.cover_url).startsWith('firm/') ? row.cover_url : null,
    category: row.category,
    tags: row.tags || [],
    status: row.status,
    isFeatured: row.is_featured,
    readingTimeMinutes: row.reading_time_minutes,
    authorId: row.author_id,
    authorName: row.author_name,
    publishedAt: row.published_at,
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listForFirm({ firmId, status, limit = 50 }) {
  const sb = ensureClient();
  let q = sb.from('news_articles').select('*').eq('firm_id', firmId).order('updated_at', { ascending: false }).limit(limit);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  const items = (data || []).map(mapArticle);
  return Promise.all(items.map(enrichArticle));
}

async function uploadCoverImage({ firmId, file }) {
  if (!file?.buffer?.length) throw new AppError('Selecione uma imagem (JPG, PNG, WebP ou GIF).', 400);
  const uploaded = await contabilStorage.uploadNewsCover({ firmId, file });
  const previewUrl = await contabilStorage.createSignedDownloadUrl(uploaded.path, 86400);
  return { storageKey: uploaded.path, previewUrl };
}

async function listPublishedForClient({ firmId, category, search, limit = 30 }) {
  const sb = ensureClient();
  let q = sb
    .from('news_articles')
    .select('*')
    .eq('firm_id', firmId)
    .eq('status', 'PUBLISHED')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (category) q = q.eq('category', category);
  const { data, error } = await q;
  if (error) throw error;
  let items = await Promise.all((data || []).map((row) => enrichArticle(mapArticle(row))));
  if (search) {
    const s = String(search).toLowerCase();
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(s) ||
        (a.excerpt || '').toLowerCase().includes(s) ||
        (a.tags || []).some((t) => t.toLowerCase().includes(s)),
    );
  }
  return items;
}

async function getBySlug({ firmId, slug }) {
  const sb = ensureClient();
  const { data, error } = await sb
    .from('news_articles')
    .select('*')
    .eq('firm_id', firmId)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Artigo não encontrado', 404);
  return enrichArticle(mapArticle(data));
}

async function createArticle({ firmId, payload, authorId, authorName }) {
  const sb = ensureClient();
  const safeAuthorName = authorName ? String(authorName).trim() : 'Escritório';
  const baseSlug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
  const slug = await resolveUniqueSlug(sb, firmId, baseSlug);
  const readingTime = estimateReadingTime(payload.body);
  const row = {
    firm_id: firmId,
    title: payload.title,
    slug,
    excerpt: payload.excerpt || null,
    body: payload.body,
    cover_url: payload.coverStorageKey || payload.coverUrl || null,
    category: payload.category || null,
    tags: payload.tags || [],
    status: payload.status || 'DRAFT',
    is_featured: Boolean(payload.isFeatured),
    reading_time_minutes: readingTime,
    author_id: authorId,
    author_name: safeAuthorName,
    published_at: payload.status === 'PUBLISHED' ? new Date().toISOString() : null,
    scheduled_at: payload.scheduledAt || null,
  };
  const { data, error } = await sb.from('news_articles').insert(row).select().single();
  if (error) {
    if (error.code === '23505') {
      throw new AppError(
        'Já existe uma notícia com título semelhante. Altere o título ou tente novamente.',
        409,
        { code: 'DUPLICATE_SLUG' },
      );
    }
    throw error;
  }

  void activityService.recordActivity({
    firmId,
    actorRole: 'FIRM',
    actorId: authorId,
    actorName: safeAuthorName,
    eventType: 'NEWS_CREATED',
    entityType: 'NEWS',
    entityId: data.id,
    title: `Notícia criada: ${data.title}`,
  });

  return enrichArticle(mapArticle(data));
}

async function updateArticle({ firmId, id, payload }) {
  const sb = ensureClient();
  const patch = { updated_at: new Date().toISOString() };
  if (payload.title !== undefined) patch.title = payload.title;
  if (payload.excerpt !== undefined) patch.excerpt = payload.excerpt;
  if (payload.body !== undefined) {
    patch.body = payload.body;
    patch.reading_time_minutes = estimateReadingTime(payload.body);
  }
  if (payload.coverStorageKey !== undefined) patch.cover_url = payload.coverStorageKey;
  else if (payload.coverUrl !== undefined) patch.cover_url = payload.coverUrl;
  if (payload.category !== undefined) patch.category = payload.category;
  if (payload.tags !== undefined) patch.tags = payload.tags;
  if (payload.isFeatured !== undefined) patch.is_featured = payload.isFeatured;
  if (payload.status !== undefined) {
    patch.status = payload.status;
    if (payload.status === 'PUBLISHED' && !payload.keepPublishedAt) {
      patch.published_at = new Date().toISOString();
    }
  }
  if (payload.scheduledAt !== undefined) patch.scheduled_at = payload.scheduledAt;

  const { data, error } = await sb.from('news_articles').update(patch).eq('id', id).eq('firm_id', firmId).select().single();
  if (error) throw error;
  if (!data) throw new AppError('Artigo não encontrado', 404);
  return enrichArticle(mapArticle(data));
}

async function deleteArticle({ firmId, id }) {
  const sb = ensureClient();
  const { error } = await sb.from('news_articles').delete().eq('id', id).eq('firm_id', firmId);
  if (error) throw error;
  return { ok: true };
}

/** Templates profissionais para escritórios (Portugal, 2026) */
function getEditorTemplates() {
  return [
    {
      id: 'iva-2026',
      category: 'IVA',
      title: 'IVA — prazo de entrega da declaração periódica',
      excerpt: 'Relembrar clientes do prazo legal de entrega da declaração periódica de IVA em Portugal.',
      body: `## Declaração periódica de IVA\n\nA declaração periódica de IVA deve ser entregue e liquidada até ao **dia 20** do mês seguinte ao período de tributação (ou no dia útil imediatamente seguinte, quando o prazo coincida com fim de semana ou feriado).\n\n### O que precisa de fazer\n- Confirmar se o seu regime (mensal ou trimestral) está correto\n- Enviar faturas e documentos de compras e vendas atempadamente\n- Verificar saldos de IVA a entregar ou a recuperar\n\n### Na plataforma Teglion\nPode enviar documentos, consultar obrigações e mensagens com o seu escritório num só lugar.\n\n*Informação genérica para apoio à comunicação — confirme sempre datas e valores com o seu contabilista certificado.*`,
      tags: ['IVA', 'AT', 'prazos'],
    },
    {
      id: 'ss-2026',
      category: 'Segurança Social',
      title: 'Segurança Social — entrega de remunerações (DMR)',
      excerpt: 'Comunicação sobre prazos de entrega de remunerações à Segurança Social.',
      body: `## Declaração de Remunerações (DMR)\n\nAs entidades empregadoras devem entregar a **Declaração Mensal de Remunerações** nos prazos fixados pela Segurança Social, em função do NISS e do calendário aplicável.\n\n### Boas práticas\n- Validar dados dos trabalhadores antes do fecho do mês\n- Enviar alterações contratuais com antecedência\n- Manter comprovativos de pagamento organizados\n\nO seu escritório acompanha estes prazos consigo através do portal Teglion.\n\n*Conteúdo informativo — não substitui aconselhamento profissional.*`,
      tags: ['Segurança Social', 'DMR', 'RH'],
    },
    {
      id: 'irs-2026',
      category: 'IRS',
      title: 'IRS — época de declaração anual',
      excerpt: 'Orientações para preparação da declaração anual de IRS em Portugal.',
      body: `## Declaração anual de IRS\n\nA declaração anual de rendimentos (Modelo 3) é habitualmente entregue entre **abril e junho**, conforme calendário publicado anualmente pela Autoridade Tributária.\n\n### Documentos úteis\n- Recibos de vencimento e pensões\n- Faturas com dedução (saúde, educação, habitação, quando aplicável)\n- Comunicações de retenções na fonte\n\nEnvie tudo pelo portal para o seu contabilista preparar a declaração com segurança.\n\n*Verifique o calendário oficial da AT para o ano em curso.*`,
      tags: ['IRS', 'AT', 'declaração'],
    },
    {
      id: 'irc-2026',
      category: 'IRC',
      title: 'IRC — pagamento por conta e declaração modelo 22',
      excerpt: 'Lembretes sobre obrigações de IRC para sociedades comerciais.',
      body: `## Obrigações de IRC\n\nAs entidades sujeitas a IRC devem observar prazos de **pagamentos por conta**, **retenções na fonte** e entrega da **declaração de rendimentos (Modelo 22)** nos termos do CIRC e do calendário fiscal.\n\n### Como o escritório apoia\n- Acompanhamento de provisões e pagamentos\n- Disponibilização de guias e documentos no portal\n- Registo de visualização para evitar dúvidas sobre entrega\n\nConsulte as suas obrigações na área «Obrigações Fiscais» do portal.\n\n*Informação de carácter geral para clientes empresariais.*`,
      tags: ['IRC', 'sociedades', 'Modelo 22'],
    },
    {
      id: 'apoios-pt',
      category: 'Apoios',
      title: 'Apoios e incentivos — consulte o seu escritório',
      excerpt: 'Como identificar apoios públicos relevantes para a sua atividade em Portugal.',
      body: `## Apoios e incentivos em Portugal\n\nExistem diversos instrumentos de apoio (IAPMEI, Compete, fundos europeus, benefícios fiscais pontuais) cuja elegibilidade depende do setor, dimensão da empresa e localização.\n\n**Não aplique incentivos sem validação técnica.** O seu escritório de contabilidade analisa a adequação a cada caso.\n\nMarque uma consultoria ou envie mensagem pelo portal se pretender uma análise prévia.\n\n*Evite decisões apenas com base em resumos genéricos.*`,
      tags: ['apoios', 'IAPMEI', 'incentivos'],
    },
  ];
}

module.exports = {
  listForFirm,
  listPublishedForClient,
  getBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadCoverImage,
  getEditorTemplates,
  slugify,
};
