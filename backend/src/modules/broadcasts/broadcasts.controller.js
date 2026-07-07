const broadcastsService = require('./broadcasts.service');
const { BROADCAST_CATEGORIES, BROADCAST_PRIORITIES } = require('./broadcast.constants');

exports.listFirm = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const result = await broadcastsService.listForFirm({
      firmId,
      status: req.query.status,
      category: req.query.category,
      priority: req.query.priority,
      search: req.query.search,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 30),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};

exports.getMeta = async (_req, res) => {
  return res.json({
    categories: BROADCAST_CATEGORIES,
    priorities: BROADCAST_PRIORITIES,
    templates: broadcastsService.getEditorTemplates(),
  });
};

exports.create = async (req, res, next) => {
  try {
    const broadcast = await broadcastsService.createBroadcast({
      firmId: String(req.user.firmId),
      payload: req.body,
      author: {
        id: req.user.id,
        name: req.user.fullName || req.user.name || req.user.email,
      },
    });
    return res.status(201).json({ broadcast });
  } catch (err) {
    return next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const broadcast = await broadcastsService.updateBroadcast({
      firmId: String(req.user.firmId),
      id: req.params.id,
      payload: req.body,
    });
    return res.json({ broadcast });
  } catch (err) {
    return next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await broadcastsService.deleteBroadcast({ firmId: String(req.user.firmId), id: req.params.id });
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
};

exports.analytics = async (req, res, next) => {
  try {
    const data = await broadcastsService.getAnalytics({
      firmId: String(req.user.firmId),
      broadcastId: req.params.id,
    });
    return res.json(data);
  } catch (err) {
    return next(err);
  }
};

exports.listClientFeed = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const clientId = req.user.clientId || req.user.id;
    const items = await broadcastsService.listClientFeed({
      firmId,
      clientId,
      category: req.query.category,
      search: req.query.search,
    });
    const pinned = items.filter((a) => a.pinned);
    const urgentBanner = await broadcastsService.getUrgentBannerForClient(firmId, clientId);
    const unread = await require('../../db/supabase/repositories/broadcasts.repository').countUnreadForClient(
      firmId,
      clientId
    );
    return res.json({ items, pinned, urgentBanner, unreadCount: unread });
  } catch (err) {
    return next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const firmId = String(req.user.firmId);
    const clientId = req.user.clientId || req.user.id;
    const result = await broadcastsService.markClientRead({
      firmId,
      clientId,
      broadcastId: req.params.id,
      acknowledge: Boolean(req.body?.acknowledge),
    });
    return res.json(result);
  } catch (err) {
    return next(err);
  }
};
