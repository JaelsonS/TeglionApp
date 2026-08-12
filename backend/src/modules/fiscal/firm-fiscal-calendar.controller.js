const { requireUserFirmId } = require('../../utils/contabil-scope')
const { AppError } = require('../../middlewares/error.middleware')
const firmFiscalCalendarService = require('./firm-fiscal-calendar.service')

function userId(req) {
  return req.user?.id || req.user?._id || null
}

exports.getWorkspace = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const workspace = await firmFiscalCalendarService.listWorkspace({
      firmId,
      from: req.query.from,
      to: req.query.to,
      categoryId: req.query.categoryId || null,
      eventKind: req.query.eventKind || null,
      status: req.query.status || null,
      search: req.query.search || null,
      includeInactive: req.query.includeInactive === '1' || req.query.includeInactive === 'true',
      includeArchived: req.query.includeArchived === '1' || req.query.includeArchived === 'true',
    })
    return res.json(workspace)
  } catch (err) {
    return next(err)
  }
}

exports.updateWorkspace = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const calendar = await firmFiscalCalendarService.updateCalendar({
      firmId,
      payload: req.body || {},
    })
    return res.json({ calendar })
  } catch (err) {
    return next(err)
  }
}

exports.importTemplate = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const year = req.body?.year || req.query.year || new Date().getFullYear()
    const result = await firmFiscalCalendarService.importNationalTemplate({
      firmId,
      userId: userId(req),
      year,
    })
    return res.status(201).json(result)
  } catch (err) {
    return next(err)
  }
}

exports.listCategories = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const categories = await firmFiscalCalendarService.listCategories({
      firmId,
      includeInactive: req.query.includeInactive === '1' || req.query.includeInactive === 'true',
    })
    return res.json({
      categories,
      colorPalette: firmFiscalCalendarService.COLOR_PALETTE,
    })
  } catch (err) {
    return next(err)
  }
}

exports.createCategory = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const category = await firmFiscalCalendarService.createCategory({
      firmId,
      payload: req.body || {},
    })
    return res.status(201).json({ category })
  } catch (err) {
    return next(err)
  }
}

exports.updateCategory = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const category = await firmFiscalCalendarService.updateCategory({
      firmId,
      id: req.params.id,
      payload: req.body || {},
    })
    return res.json({ category })
  } catch (err) {
    return next(err)
  }
}

exports.getEvent = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const event = await firmFiscalCalendarService.getEventById({ firmId, id: req.params.id })
    return res.json({ event })
  } catch (err) {
    return next(err)
  }
}

exports.createEvent = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const event = await firmFiscalCalendarService.createEvent({
      firmId,
      userId: userId(req),
      payload: req.body || {},
    })
    return res.status(201).json({ event })
  } catch (err) {
    return next(err)
  }
}

exports.updateEvent = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const scope = req.body?.scope === 'occurrence' ? 'occurrence' : 'series'
    const event = await firmFiscalCalendarService.updateEvent({
      firmId,
      id: req.params.id,
      userId: userId(req),
      payload: req.body || {},
      scope,
    })
    return res.json({ event })
  } catch (err) {
    return next(err)
  }
}

exports.duplicateEvent = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const event = await firmFiscalCalendarService.duplicateEvent({
      firmId,
      id: req.params.id,
      userId: userId(req),
      overrides: req.body || {},
    })
    return res.status(201).json({ event })
  } catch (err) {
    return next(err)
  }
}

exports.archiveEvent = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const event = await firmFiscalCalendarService.archiveEvent({
      firmId,
      id: req.params.id,
      userId: userId(req),
    })
    return res.json({ event })
  } catch (err) {
    return next(err)
  }
}

exports.setEventActive = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    if (typeof req.body?.isActive !== 'boolean') {
      throw new AppError('isActive (boolean) é obrigatório', 400)
    }
    const event = await firmFiscalCalendarService.setEventActive({
      firmId,
      id: req.params.id,
      userId: userId(req),
      isActive: req.body.isActive,
    })
    return res.json({ event })
  } catch (err) {
    return next(err)
  }
}

exports.createException = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const originalDate = req.body?.originalDate || req.body?.occurrenceDate
    if (!originalDate) throw new AppError('originalDate é obrigatório', 400)
    const result = await firmFiscalCalendarService.upsertException({
      firmId,
      eventId: req.params.id,
      originalDate,
      patch: req.body || {},
    })
    return res.json(result)
  } catch (err) {
    return next(err)
  }
}
