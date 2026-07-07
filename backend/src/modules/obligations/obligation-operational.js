/**
 * Classificação operacional de obrigações (faixas do escritório).
 */
const MS_DAY = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function classifyObligationLane(ob, now = new Date()) {
  const status = String(ob.status || 'PENDING').toUpperCase();
  if (status === 'DELIVERED' || status === 'CANCELLED') return 'completed';

  const due = startOfDay(ob.dueDate || ob.due_date);
  const today = startOfDay(now);
  const diffDays = Math.round((due.getTime() - today.getTime()) / MS_DAY);

  if (status === 'OVERDUE' || diffDays < 0) return 'overdue';
  if (status === 'WAITING_CLIENT') return 'waiting_client';

  const priority = String(ob.priority || 'NORMAL').toUpperCase();
  const payment = String(ob.paymentStatus || ob.payment_status || 'PENDING').toUpperCase();

  if (priority === 'URGENT' || payment === 'OVERDUE' || diffDays <= 2) return 'critical';
  if (diffDays <= 7 || status === 'IN_PROGRESS' || status === 'PENDING') return 'upcoming';

  return 'upcoming';
}

function nextPeriodFromFrequency(frequency, currentPeriod) {
  const freq = String(frequency || 'MONTHLY').toUpperCase();
  const base = currentPeriod || currentPeriodLabel('MONTHLY');
  if (freq === 'ANNUAL') {
    const y = parseInt(String(base).slice(0, 4), 10) || new Date().getFullYear();
    return String(y + 1);
  }
  if (freq === 'QUARTERLY') {
    const m = /(\d{4})-(\d{2})/.exec(String(base));
    if (m) {
      let y = parseInt(m[1], 10);
      let month = parseInt(m[2], 10) + 3;
      if (month > 12) {
        month -= 12;
        y += 1;
      }
      return `${y}-${String(month).padStart(2, '0')}`;
    }
  }
  const m = /(\d{4})-(\d{2})/.exec(String(base));
  if (m) {
    let y = parseInt(m[1], 10);
    let month = parseInt(m[2], 10) + 1;
    if (month > 12) {
      month = 1;
      y += 1;
    }
    return `${y}-${String(month).padStart(2, '0')}`;
  }
  return currentPeriodLabel('MONTHLY');
}

function currentPeriodLabel(frequency = 'MONTHLY') {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  if (frequency === 'ANNUAL') return String(y);
  if (frequency === 'QUARTERLY') {
    const qEnd = Math.ceil((now.getMonth() + 1) / 3) * 3;
    return `${y}-${String(qEnd).padStart(2, '0')}`;
  }
  return `${y}-${m}`;
}

function dueDateForPeriod(period, dueDay = 20) {
  const day = Math.min(Math.max(Number(dueDay) || 20, 1), 28);
  const m = /(\d{4})-(\d{2})/.exec(String(period));
  if (m) {
    let y = parseInt(m[1], 10);
    let month = parseInt(m[2], 10) + 1;
    if (month > 12) {
      month = 1;
      y += 1;
    }
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  if (/^\d{4}$/.test(String(period))) {
    return `${period}-12-${String(day).padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

module.exports = {
  classifyObligationLane,
  nextPeriodFromFrequency,
  currentPeriodLabel,
  dueDateForPeriod,
};
