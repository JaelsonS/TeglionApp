const { requireUserFirmId, parseEntityId } = require('../../../utils/contabil-scope');
const googleDriveService = require('./google-drive.service');
const importService = require('./google-drive-import.service');

function getConfig(_req, res) {
  return res.json(googleDriveService.getPickerConfig());
}

async function importFromDrive(req, res, next) {
  try {
    const firmId = requireUserFirmId(req);
    const clientId = parseEntityId(req.body?.clientId, 'clientId');
    const result = await importService.importFileFromDrive({
      firmId,
      clientId,
      senderId: req.user?.id,
      fileId: String(req.body?.fileId || '').trim(),
      accessToken: String(req.body?.accessToken || '').trim(),
      body: req.body?.body,
    });
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = { getConfig, importFromDrive };
