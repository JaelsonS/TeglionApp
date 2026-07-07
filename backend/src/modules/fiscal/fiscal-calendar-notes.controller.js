const { requireUserFirmId } = require('../../utils/contabil-scope')
const { AppError } = require('../../middlewares/error.middleware')
const fiscalCalendarNotesService = require('./fiscal-calendar-notes.service')

exports.getNotes = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const notes = await fiscalCalendarNotesService.getFiscalCalendarNotes({ firmId })
    return res.json({ notes })
  } catch (err) {
    return next(err)
  }
}

exports.patchNote = async (req, res, next) => {
  try {
    const firmId = requireUserFirmId(req)
    const body = req.body || {}

    const itemId = body.itemId != null ? String(body.itemId).trim() : ''
    if (!itemId) throw new AppError('itemId é obrigatório', 400)

    const textRaw = body.text
    const text =
      textRaw === null || textRaw === undefined || (typeof textRaw === 'string' ? textRaw : null)

    // If client sends non-string (and non-null), reject.
    if (textRaw != null && typeof textRaw !== 'string' && textRaw !== null) {
      throw new AppError('text tem de ser string ou null', 400)
    }

    const notes = await fiscalCalendarNotesService.patchFiscalCalendarNote({
      firmId,
      itemId,
      text,
    })

    return res.json({ notes })
  } catch (err) {
    return next(err)
  }
}

