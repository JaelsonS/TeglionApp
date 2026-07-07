const obligationsRepo = require('./obligations.repository');
const tasksRepo = require('./tasks.repository');
const documentsRepo = require('./documents.repository');
const firmDashboardRepo = require('./firm-dashboard.repository');
const auditRepo = require('./audit.repository');

const contabilRepository = {
  driver: 'supabase',
  ...obligationsRepo,
  ...tasksRepo,
  ...documentsRepo,
  ...firmDashboardRepo,
  ...auditRepo,
};

module.exports = { contabilRepository };
