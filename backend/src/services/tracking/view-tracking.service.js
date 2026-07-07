/**
 * Rastreamento de visualização de documentos e obrigações.
 */
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const { parseUserAgent } = require('../../utils/user-agent-parse');
const activityService = require('../activity/activity.service');

function ensureClient() {
  if (!isSupabaseConfigured()) return null;
  return getSupabaseAdmin();
}

function formatViewLabel(dateIso, deviceLabel) {
  const viewedAt = new Date(dateIso);
  const when = viewedAt.toLocaleString('pt-PT', {
    timeZone: 'Europe/Lisbon',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return deviceLabel
    ? `Visualizado em ${when} no ${deviceLabel}`
    : `Visualizado em ${when}`;
}

async function recordView({
  firmId,
  clientId,
  entityType,
  entityId,
  viewerRole,
  viewerId,
  viewerName,
  ipAddress,
  userAgent,
  sessionId = null,
}) {
  const sb = ensureClient();
  if (!sb) return null;

  const parsed = parseUserAgent(userAgent);

  const { data: viewRow, error } = await sb
    .from('content_views')
    .insert({
      firm_id: firmId,
      client_id: clientId,
      entity_type: entityType,
      entity_id: entityId,
      viewer_role: viewerRole,
      viewer_id: viewerId,
      viewer_name: viewerName,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      device_type: parsed.deviceType,
      device_label: parsed.deviceLabel,
      browser_name: parsed.browserName,
      session_id: sessionId || null,
    })
    .select()
    .single();

  if (error) throw error;

  const table = entityType === 'OBLIGATION' ? 'obligations' : 'documents';
  const isClientView = String(viewerRole || '').toUpperCase() === 'CLIENT';

  if (isClientView) {
    const { data: entity } = await sb.from(table).select('view_count, first_viewed_at').eq('id', entityId).maybeSingle();
    const patch = {
      view_count: (entity?.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    };
    if (!entity?.first_viewed_at) patch.first_viewed_at = patch.last_viewed_at;
    await sb.from(table).update(patch).eq('id', entityId).eq('firm_id', firmId);
  }

  const label = isClientView
    ? formatViewLabel(viewRow.created_at, parsed.deviceLabel)
    : `Pré-visualização do escritório em ${new Date(viewRow.created_at).toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' })}`;

  let clientViewCount = 0;
  let lastClientViewedAt = null;
  if (isClientView) {
    const { data: entity } = await sb
      .from(table)
      .select('view_count, last_viewed_at')
      .eq('id', entityId)
      .maybeSingle();
    clientViewCount = entity?.view_count || 0;
    lastClientViewedAt = entity?.last_viewed_at || viewRow.created_at;
  }

  void activityService.recordActivity({
    firmId,
    clientId,
    actorRole: viewerRole,
    actorId: viewerId,
    actorName: viewerName,
    eventType: isClientView ? 'CONTENT_VIEWED' : 'CONTENT_PREVIEWED_BY_FIRM',
    entityType,
    entityId,
    title: label,
    description: `${viewerName || 'Utilizador'} — ${parsed.deviceLabel}`,
    metadata: {
      ipAddress,
      deviceLabel: parsed.deviceLabel,
      browserName: parsed.browserName,
      sessionId,
      viewCount: clientViewCount,
      firmPreview: !isClientView,
    },
    ipAddress,
  });

  return {
    view: viewRow,
    viewCount: clientViewCount,
    firstViewedAt: isClientView ? lastClientViewedAt : null,
    lastViewedAt: lastClientViewedAt,
    viewedAtLabel: label,
    deviceLabel: parsed.deviceLabel,
    viewId: viewRow.id,
    viewerRole,
  };
}

async function endView({ viewId, durationSeconds }) {
  const sb = ensureClient();
  if (!sb || !viewId) return null;
  const { data, error } = await sb
    .from('content_views')
    .update({
      duration_seconds: Math.max(0, Number(durationSeconds) || 0),
      view_ended_at: new Date().toISOString(),
    })
    .eq('id', viewId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getViewStats({ firmId, entityType, entityId }) {
  const sb = ensureClient();
  if (!sb) return { viewCount: 0, views: [], lastViewedAt: null, firstViewedAt: null, isViewed: false };

  const table = entityType === 'OBLIGATION' ? 'obligations' : 'documents';
  const { data: entity } = await sb
    .from(table)
    .select('view_count, first_viewed_at, last_viewed_at')
    .eq('id', entityId)
    .eq('firm_id', firmId)
    .maybeSingle();

  const { data: views, error } = await sb
    .from('content_views')
    .select('*')
    .eq('firm_id', firmId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) throw error;

  const mapped = (views || []).map((v) => {
    const deviceLabel = v.device_label || v.device_type || 'Dispositivo';
    const role = String(v.viewer_role || '').toUpperCase();
    return {
      id: v.id,
      viewerRole: role,
      viewerName: v.viewer_name,
      deviceType: v.device_type,
      deviceLabel,
      browserName: v.browser_name,
      ipAddress: v.ip_address,
      sessionId: v.session_id,
      durationSeconds: v.duration_seconds,
      createdAt: v.created_at,
      label:
        role === 'CLIENT'
          ? formatViewLabel(v.created_at, deviceLabel)
          : `Pré-visualização do escritório em ${formatViewLabel(v.created_at, deviceLabel).replace('Visualizado em ', '')}`,
    };
  });

  const clientViews = mapped.filter((v) => v.viewerRole === 'CLIENT');
  const lastClient = clientViews[0] || null;

  return {
    viewCount: clientViews.length,
    firstViewedAt: lastClient ? clientViews[clientViews.length - 1]?.createdAt : null,
    lastViewedAt: lastClient?.createdAt || null,
    isViewed: clientViews.length > 0,
    clientViewCount: clientViews.length,
    views: mapped,
    lastClientView: lastClient,
  };
}

module.exports = {
  recordView,
  endView,
  getViewStats,
  formatViewLabel,
};
