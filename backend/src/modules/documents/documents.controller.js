const documentsService = require('./documents.service');
const securityAudit = require('../../services/audit/security-audit.service');

function safeFilename(title) {
  return String(title || 'documento')
    .replace(/[^\w.\-áàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ ]+/g, '_')
    .slice(0, 120) || 'documento';
}

async function auditDocumentAccess(req, action, documentId) {
  void securityAudit.recordDocumentAccess({
    action,
    actor: req.user,
    documentId,
    firmId: req.user?.firmId || null,
    clientId: req.user?.clientId || null,
    req,
  });
}

/** Proxy do ficheiro pela API — evita CORS do Supabase Storage no browser. */
async function download(req, res, next) {
  try {
    const documentId = req.params.id;
    const { buffer, mimeType, title } = await documentsService.streamDownload({
      actor: req.user,
      documentId,
      req,
    });
    void auditDocumentAccess(req, 'document.download', documentId);
    const name = safeFilename(title);
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
}

async function preview(req, res, next) {
  try {
    const documentId = req.params.id;
    const { buffer, mimeType, title } = await documentsService.streamDownload({
      actor: req.user,
      documentId,
      req,
    });
    void auditDocumentAccess(req, 'document.preview', documentId);
    const name = safeFilename(title);
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(name)}"`);
    res.setHeader('Cache-Control', 'private, max-age=120');
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
}

module.exports = { download, preview };
