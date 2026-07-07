/**
 * Portal do cliente TegLion — Supabase only.
 */
const express = require('express');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { uploadSingle, uploadFields } = require('../middlewares/upload.middleware');
const portalController = require('../modules/client/portal.controller');
const documentsController = require('../modules/documents/documents.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/me/contabil/hub', portalController.getHubSummary);
router.get('/me/contabil/dashboard', portalController.getClientDashboard);
router.get('/me/contabil/document-requests', portalController.listMyDocumentRequests);
router.post('/me/contabil/document-requests/:id/seen', portalController.markMyDocumentRequestSeen);
router.get('/me/contabil/documents', portalController.listMyDocuments);
router.get('/me/contabil/obligations', portalController.listMyObligations);
router.get('/me/contabil/tasks', portalController.listMyTasks);
router.post('/me/contabil/tasks/:id/submit', portalController.submitTask);
router.post('/me/contabil/tasks/:id/complete', portalController.completeTask);
router.post('/me/contabil/tasks/:id/help', portalController.requestTaskHelp);
router.post('/me/contabil/tasks/:id/comments', portalController.addTaskComment);
router.get('/me/contabil/tasks/:id', portalController.getMyTaskDetail);
router.post(
  '/me/contabil/documents/upload',
  uploadFields([
    { name: 'files', maxCount: 10 },
    { name: 'file', maxCount: 1 },
  ]),
  portalController.uploadDocument
);
router.get('/me/contabil/documents/:id/download', documentsController.download);
router.get('/me/contabil/documents/:id/preview', documentsController.preview);
router.post('/me/contabil/documents/:id/view', require('../modules/tracking/tracking.controller').recordDocumentView);
router.post('/me/contabil/tracking/end-view', require('../modules/tracking/tracking.controller').endView);
router.post('/me/contabil/obligations/:id/view', require('../modules/tracking/tracking.controller').recordObligationView);
router.post('/me/contabil/obligations/:id/mark-paid', uploadSingle('file'), portalController.markObligationPaid);
router.get('/me/contabil/notifications', portalController.listNotifications);
router.patch('/me/contabil/notifications/:id/read', portalController.markNotificationRead);
router.post('/me/contabil/notifications/read-all', portalController.markAllNotificationsRead);
router.get('/me/contabil/alerts', require('../modules/broadcasts/broadcasts.controller').listClientFeed);
router.post('/me/contabil/alerts/:id/read', require('../modules/broadcasts/broadcasts.controller').markRead);
router.get('/me/contabil/news', require('../modules/news/news.controller').listClientFeed);
router.get('/me/contabil/news/:slug', require('../modules/news/news.controller').getClientArticle);
router.get('/me/contabil/messages/unread-count', portalController.getMyMessagesUnreadCount);
router.get('/me/contabil/messages', portalController.listMyMessages);
router.post(
  '/me/contabil/messages',
  uploadSingle('file'),
  portalController.sendMyMessage,
);
router.patch('/me/contabil/messages/:id', portalController.editMyMessage);
router.get('/me/contabil/live/events', require('../modules/live/live.controller').pollClient);
router.get('/me/contabil/push/vapid-public-key', require('../modules/push/push.controller').getVapidKey);
router.post('/me/contabil/push/subscribe', require('../modules/push/push.controller').subscribeClient);
router.get('/me/contabil/service-requests', require('../modules/service-requests/service-requests.controller').listMine);
router.post('/me/contabil/service-requests', require('../modules/service-requests/service-requests.controller').createMine);
router.get('/me/contabil/service-requests/:id/quote', require('../modules/service-requests/service-requests.controller').getMyQuote);
router.post('/me/contabil/service-requests/:id/approve', require('../modules/service-requests/service-requests.controller').approveQuote);
router.post('/me/contabil/obligations/:id/deliver', portalController.deliverObligation);
router.get('/me/contabil/booking/services', portalController.listBookingServices);
router.get('/me/contabil/booking/slots', portalController.listBookingSlots);
router.post('/me/contabil/booking', portalController.bookConsultation);

module.exports = router;
