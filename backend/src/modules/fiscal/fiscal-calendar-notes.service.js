const firmsRepository = require('../../db/supabase/repositories/firms.repository')

const NOTES_KEY = 'fiscalCalendarNotes'

function getNotesFromFirmSettings(firm) {
  const settings = firm?.settings || {}
  const notes = settings[NOTES_KEY]
  if (notes && typeof notes === 'object') return notes
  return {}
}

async function getFiscalCalendarNotes({ firmId }) {
  const firm = await firmsRepository.findFirmById(firmId)
  if (!firm) return {}
  return getNotesFromFirmSettings(firm)
}

async function patchFiscalCalendarNote({ firmId, itemId, text }) {
  const firm = await firmsRepository.findFirmById(firmId)
  if (!firm) return {}

  const currentNotes = getNotesFromFirmSettings(firm)
  const nextNotes = { ...(currentNotes || {}) }

  if (text == null || String(text).trim() === '') {
    delete nextNotes[itemId]
  } else {
    nextNotes[itemId] = String(text).trim()
  }

  await firmsRepository.updateFirm(firmId, {
    settingsMerge: {
      [NOTES_KEY]: nextNotes,
    },
  })

  return nextNotes
}

module.exports = { getFiscalCalendarNotes, patchFiscalCalendarNote }

