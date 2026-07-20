const express = require('express');
const { body } = require('express-validator');
const { requirePermission } = require('../../middlewares/role.middleware');
const { PERMISSIONS } = require('../../utils/permissions');
const obligationsController = require('../../modules/obligations/obligations.controller');
const obligationTemplatesController = require('../../modules/obligations/obligation-templates.controller');
const clientTasksController = require('../../modules/tasks/client-tasks.controller');
const accountingServicesController = require('../../modules/firm/accounting-services.controller');
const bookingSettingsController = require('../../modules/firm/booking-settings.controller');
const firmSettingsController = require('../../modules/firm/firm-settings.controller');
const { requireFirmOwner } = require('../../middlewares/firm-owner.middleware');
const consultationsController = require('../../modules/consultations/consultations.controller');
const invitesController = require('../../modules/firm/invites.controller');
const clientsController = require('../../modules/firm/clients.controller');
const documentsController = require('../../modules/documents/documents.controller');
const documentsFirmController = require('../../modules/documents/documents-firm.controller');
const messagesController = require('../../modules/messages/messages.controller');
const documentRequestsController = require('../../modules/document-requests/document-requests.controller');
const newsController = require('../../modules/news/news.controller');
const broadcastsController = require('../../modules/broadcasts/broadcasts.controller');
const trackingController = require('../../modules/tracking/tracking.controller');
const { optionalSingle, uploadSingle, uploadAvatarSingle } = require('../../middlewares/upload.middleware');
const automationController = require('../../modules/automations/automation.controller');
const fiscalCalendarController = require('../../modules/fiscal/fiscal-calendar.controller');
const fiscalCalendarNotesController = require('../../modules/fiscal/fiscal-calendar-notes.controller');
const atController = require('../../modules/integrations/at/at.controller');
const caeHistoryController = require('../../modules/firm/cae-history.controller');
const caeCatalogController = require('../../modules/firm/cae-catalog.controller');

const router = express.Router();

router.get('/fiscal-calendar', requirePermission(PERMISSIONS.FIRM_OBLIGATIONS_MANAGE), fiscalCalendarController.getCalendar);
router.get('/fiscal-calendar/years', requirePermission(PERMISSIONS.FIRM_OBLIGATIONS_MANAGE), fiscalCalendarController.getAvailableYears);
router.get(
  '/fiscal-calendar/notes',
  requirePermission(PERMISSIONS.FIRM_OBLIGATIONS_MANAGE),
  fiscalCalendarNotesController.getNotes,
);
router.patch(
  '/fiscal-calendar/notes',
  requirePermission(PERMISSIONS.FIRM_OBLIGATIONS_MANAGE),
  fiscalCalendarNotesController.patchNote,
);
router.get('/integrations/at/status', requirePermission(PERMISSIONS.FIRM_CLIENTS_VIEW), atController.getIntegrationStatus);

router.get('/firm', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.getFirm);
router.get('/firm/cae-history', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), caeHistoryController.list);
router.post('/firm/cae-history', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), caeHistoryController.remember);
router.get('/firm/cae-search', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), caeCatalogController.search);
router.get('/firm/settings', requirePermission(PERMISSIONS.FIRM_SETTINGS_MANAGE), firmSettingsController.getSettings);
router.patch(
  '/firm/settings',
  requireFirmOwner,
  requirePermission(PERMISSIONS.FIRM_SETTINGS_MANAGE),
  [
    body('name').optional().trim().isLength({ min: 2, max: 120 }),
    body('contactEmail').optional({ values: 'null' }).isEmail(),
    body('contactPhone').optional().trim().isLength({ max: 32 }),
    body('taxId').optional().trim().isLength({ max: 32 }),
    body('address').optional().trim().isLength({ max: 240 }),
  ],
  firmSettingsController.patchFirm,
);
router.patch(
  '/firm/profile',
  requirePermission(PERMISSIONS.FIRM_READ),
  [
    body('fullName').optional().trim().isLength({ min: 2, max: 120 }),
    body('email').optional().isEmail(),
  ],
  firmSettingsController.patchProfile,
);
router.post(
  '/firm/profile/password',
  requirePermission(PERMISSIONS.FIRM_READ),
  [
    body('currentPassword').isString().isLength({ min: 1, max: 200 }),
    body('newPassword').isString().isLength({ min: 10, max: 200 }),
  ],
  firmSettingsController.changePassword,
);
router.post(
  '/firm/close',
  requireFirmOwner,
  [
    body('confirmName').trim().notEmpty(),
    body('npsScore').isInt({ min: 0, max: 10 }),
    body('npsReason').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
    body('npsComment').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  ],
  firmSettingsController.closeAccount,
);
router.post(
  '/firm/logo',
  requireFirmOwner,
  uploadAvatarSingle('logo'),
  clientsController.uploadFirmLogo
);
router.delete('/firm/logo', requireFirmOwner, clientsController.removeFirmLogo);
router.get('/dashboard', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationsController.dashboard);
router.get('/obligations/operational-dashboard', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationTemplatesController.operationalDashboard);
router.get('/obligation-templates', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationTemplatesController.listTemplates);
router.post('/obligation-templates', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationTemplatesController.createTemplate);
router.post('/obligations/from-template', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationTemplatesController.createFromTemplate);
router.post('/obligation-recurrence-rules', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationTemplatesController.createRecurrenceRule);
router.post(
  '/obligation-recurrence-rules/:id/generate',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  obligationTemplatesController.generateRecurrence,
);
router.get('/firm/staff', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationsController.listStaff);
router.get('/obligations', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationsController.list);
router.post(
  '/obligations',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  optionalSingle('file'),
  obligationsController.create,
);
router.patch('/obligations/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationsController.update);
router.post(
  '/obligations/:id/upload-guide',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  uploadSingle('file'),
  obligationsController.uploadGuide
);
router.get('/obligations/:id/timeline', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationsController.getTimeline);
router.post(
  '/obligations/:id/month-exclusion',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  obligationsController.excludeFromMonth,
);
router.delete(
  '/obligations/:id/month-exclusion',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  obligationsController.restoreForMonth,
);

const tasksWorkspaceController = require('../../modules/tasks/tasks-workspace.controller');
const firmNotificationsController = require('../../modules/notifications/firm-notifications.controller');

router.get('/client-tasks/workspace', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.listWorkspace);
router.get('/client-tasks/metrics', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.getMetrics);
router.get('/client-tasks/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.getDetail);
router.patch('/client-tasks/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.patch);
router.delete('/client-tasks/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.remove);
router.post('/client-tasks/:id/archive', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.archive);
router.post('/client-tasks/:id/reopen', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.reopen);
router.post('/client-tasks/:id/duplicate', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.duplicate);
router.post('/client-tasks/:id/comments', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), tasksWorkspaceController.addComment);
router.post(
  '/client-tasks/:id/attach',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  optionalSingle('file'),
  tasksWorkspaceController.attach,
);

router.get('/client-tasks', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientTasksController.list);
router.post(
  '/client-tasks',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  optionalSingle('file'),
  tasksWorkspaceController.create,
);

router.get('/notifications', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), firmNotificationsController.list);
router.patch('/notifications/:id/read', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), firmNotificationsController.markRead);
router.post('/notifications/read-all', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), firmNotificationsController.markAllRead);

router.get('/documents', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), obligationsController.listDocuments);
router.get('/documents/check-duplicate', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), documentsFirmController.checkDuplicate);
router.get('/documents/:id/detail', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), documentsFirmController.getById);
router.post('/documents/:id/request-resend', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), documentsFirmController.requestResend);
router.patch('/documents/:id/validate', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), documentsFirmController.validate);
router.delete('/documents/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), documentsFirmController.remove);
router.get('/documents/:id/download', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), documentsController.download);
router.get('/documents/:id/preview', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), documentsController.preview);

const inboxController = require('../../modules/inbox/inbox.controller');

router.get('/inbox', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), inboxController.getFirmInbox);
router.get('/messages/threads', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), messagesController.listThreads);
router.get('/messages/unread-summary', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), messagesController.unreadSummary);
router.get('/messages/clients/:clientId', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), messagesController.listByClient);
router.post(
  '/messages',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  optionalSingle('file'),
  messagesController.send,
);
router.patch('/messages/:messageId', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), messagesController.edit);
router.get(
  '/document-requests/clients/:clientId',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  documentRequestsController.listByClient,
);
router.post(
  '/document-requests',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  documentRequestsController.create,
);
router.post(
  '/document-requests/:id/complete',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  documentRequestsController.complete,
);
router.post(
  '/messages/:messageId/convert-to-request',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  messagesController.convertToDocumentRequest,
);
router.post('/messages/notify-critical', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), messagesController.notifyCritical);
router.post('/messages/notify-inactive', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), messagesController.notifyInactive);

router.get('/clients', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.list);
router.get('/clients/validate-nif', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.validateNif);
router.post('/clients', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.create);
router.get('/clients/:id/hub', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.getHub);
router.patch('/clients/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.patch);
router.delete('/clients/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.archive);
router.get('/clients/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), clientsController.getById);

router.post('/invites', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), invitesController.create);

router.get('/accounting-services', requirePermission(PERMISSIONS.FIRM_ACCOUNTING_SERVICES_VIEW), accountingServicesController.list);
router.get('/accounting-services/catalog-template', requirePermission(PERMISSIONS.FIRM_ACCOUNTING_SERVICES_VIEW), accountingServicesController.getCatalogTemplate);
router.post('/accounting-services/seed-catalog', requirePermission(PERMISSIONS.FIRM_ACCOUNTING_SERVICES_MANAGE), accountingServicesController.seedCatalog);
router.post('/accounting-services/activate-catalog', requirePermission(PERMISSIONS.FIRM_ACCOUNTING_SERVICES_MANAGE), accountingServicesController.activateFromCatalog);
router.post('/accounting-services/bulk', requirePermission(PERMISSIONS.FIRM_ACCOUNTING_SERVICES_MANAGE), accountingServicesController.bulkPatch);
router.post('/accounting-services', requirePermission(PERMISSIONS.FIRM_ACCOUNTING_SERVICES_MANAGE), accountingServicesController.create);
router.patch('/accounting-services/:id', requirePermission(PERMISSIONS.FIRM_ACCOUNTING_SERVICES_MANAGE), accountingServicesController.patch);

router.get('/booking-settings', requirePermission(PERMISSIONS.FIRM_CONSULTATIONS_MANAGE), bookingSettingsController.get);
router.patch('/booking-settings', requirePermission(PERMISSIONS.FIRM_CONSULTATIONS_MANAGE), bookingSettingsController.patch);

router.get('/consultations', requirePermission(PERMISSIONS.FIRM_CONSULTATIONS_MANAGE), consultationsController.list);
router.post('/consultations', requirePermission(PERMISSIONS.FIRM_CONSULTATIONS_MANAGE), consultationsController.create);
router.patch('/consultations/:id', requirePermission(PERMISSIONS.FIRM_CONSULTATIONS_MANAGE), consultationsController.update);

router.get('/broadcasts/meta', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), broadcastsController.getMeta);
router.get('/broadcasts', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), broadcastsController.listFirm);
router.post('/broadcasts', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), broadcastsController.create);
router.get('/broadcasts/:id/analytics', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), broadcastsController.analytics);
router.patch('/broadcasts/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), broadcastsController.update);
router.delete('/broadcasts/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), broadcastsController.remove);
// Legacy notícias (mantido); preferir /broadcasts

router.get('/news', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), newsController.listFirm);
router.get('/news/templates', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), newsController.getTemplates);
router.post(
  '/news/cover',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  uploadAvatarSingle('cover'),
  newsController.uploadCover
);
router.post('/news', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), newsController.create);
router.patch('/news/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), newsController.update);
router.delete('/news/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), newsController.remove);

router.get('/documents/:id/views', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), trackingController.getDocumentViewStats);
router.get('/obligations/:id/views', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), trackingController.getObligationViewStats);
router.get('/sms-logs', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), trackingController.listSmsLogs);

const liveController = require('../../modules/live/live.controller');
const teamController = require('../../modules/firm/team.controller');
const departmentsController = require('../../modules/firm/departments.controller');
const teamInvitesController = require('../../modules/firm/team-invites.controller');
const teamPermissionsController = require('../../modules/firm/team-permissions.controller');
const pushController = require('../../modules/push/push.controller');

router.get('/live/events', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), liveController.pollFirm);
router.get('/team', requirePermission(PERMISSIONS.USERS_READ), teamController.list);
router.post('/team', requirePermission(PERMISSIONS.USERS_CREATE), teamController.create);
router.get('/team/permissions', requirePermission(PERMISSIONS.FIRM_MEMBER_PERMISSION_MANAGE), teamPermissionsController.getByMember);
router.get('/team/:id/permissions', requirePermission(PERMISSIONS.FIRM_MEMBER_PERMISSION_MANAGE), teamPermissionsController.getByMember);
router.get('/team/:id', requirePermission(PERMISSIONS.USERS_READ), teamController.getById);
router.patch('/team/:id', requirePermission(PERMISSIONS.USERS_UPDATE), teamController.patch);
router.post('/team/:id/deactivate', requirePermission(PERMISSIONS.USERS_DELETE), teamController.deactivate);
router.post('/team/:id/reactivate', requirePermission(PERMISSIONS.USERS_UPDATE), teamController.reactivate);
router.post('/team/:id/resend-invite', requirePermission(PERMISSIONS.FIRM_INVITES_MANAGE), teamInvitesController.resendForMember);
router.post('/team/:id/revoke-invite', requirePermission(PERMISSIONS.FIRM_INVITES_MANAGE), teamInvitesController.revokeForMember);
router.post('/team/invites', requirePermission(PERMISSIONS.FIRM_INVITES_MANAGE), teamInvitesController.create);
router.patch('/team/:id/permissions', requirePermission(PERMISSIONS.FIRM_MEMBER_PERMISSION_MANAGE), teamPermissionsController.patchByMember);
router.get('/departments', requirePermission(PERMISSIONS.USERS_READ), departmentsController.list);
router.post('/departments', requirePermission(PERMISSIONS.FIRM_DEPARTMENTS_MANAGE), departmentsController.create);
router.patch('/departments/:id', requirePermission(PERMISSIONS.FIRM_DEPARTMENTS_MANAGE), departmentsController.patch);
router.delete('/departments/:id', requirePermission(PERMISSIONS.FIRM_DEPARTMENTS_MANAGE), departmentsController.remove);
router.get('/automation-rules', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), automationController.listRules);
router.post(
  '/automation-rules',
  requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE),
  [body('trigger').optional().isString().trim(), body('action').optional().isString().trim()],
  automationController.upsertRule,
);
router.post('/automations/run', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), automationController.runNow);
router.get('/push/vapid-public-key', pushController.getVapidKey);
router.post('/push/subscribe', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), pushController.subscribeFirm);

const serviceRequestsController = require('../../modules/service-requests/service-requests.controller');
router.get('/service-requests', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), serviceRequestsController.list);
router.post('/service-requests', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), serviceRequestsController.create);
router.get('/service-requests/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), serviceRequestsController.getDetail);
router.get('/service-requests/:id/quote', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), serviceRequestsController.getQuote);
router.patch('/service-requests/:id', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), serviceRequestsController.patch);
router.post('/service-requests/:id/comments', requirePermission(PERMISSIONS.FIRM_CLIENTS_MANAGE), serviceRequestsController.addComment);

module.exports = router;
