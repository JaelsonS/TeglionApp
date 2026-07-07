/**
 * Portal do cliente — facade pública (re-exporta sub-módulos).
 */
const portalHub = require('./hub.service');
const portalBooking = require('./booking.service');
const portalTasks = require('./tasks.service');
const portalDocuments = require('./documents.service');
const portalMessages = require('./messages.service');
const portalNotifications = require('./notifications.helper');
const { buildMinimalHubResponse, normalizeDocumentList } = require('./hub.helpers');

module.exports = {
  buildMinimalHubResponse,
  normalizeDocumentList,
  ...portalHub,
  ...portalBooking,
  ...portalTasks,
  ...portalDocuments,
  ...portalMessages,
  ...portalNotifications,
};
