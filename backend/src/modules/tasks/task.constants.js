const TASK_STATUSES = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'WAITING_CLIENT',
  'REVIEW',
  'DONE',
  'ARCHIVED',
];

const KANBAN_COLUMNS = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEW', 'DONE'];

const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

const LEGACY_STATUS_MAP = {
  OPEN: 'TODO',
  SUBMITTED: 'WAITING_CLIENT',
  APPROVED: 'DONE',
  CANCELLED: 'ARCHIVED',
};

function normalizeStatus(status) {
  const s = String(status || 'TODO').toUpperCase();
  if (TASK_STATUSES.includes(s)) return s;
  return LEGACY_STATUS_MAP[s] || 'TODO';
}

module.exports = { TASK_STATUSES, KANBAN_COLUMNS, TASK_PRIORITIES, LEGACY_STATUS_MAP, normalizeStatus };
