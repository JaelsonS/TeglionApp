/**
 * Agrega obrigações do mês por (tipo + data de vencimento) → N tratados / M total.
 * Vista estilo «calendário AT do mês» sobre dados reais do escritório.
 */

const TYPE_LABELS = {
  IVA: 'IVA',
  IRS: 'IRS',
  IRC: 'IRC',
  SS: 'Segurança Social',
  SAFT: 'SAF-T',
  PAYROLL: 'Folha salarial',
  IES: 'IES',
  DRF: 'DRF',
  DAS: 'DAS',
  CUSTOM: 'Personalizada',
};

function assertYearMonth(ym) {
  const s = String(ym || '');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s)) {
    const err = new Error('Período inválido (use AAAA-MM)');
    err.code = 'INVALID_YEAR_MONTH';
    throw err;
  }
  return s;
}

function monthBounds(yearMonth) {
  const ym = assertYearMonth(yearMonth);
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    yearMonth: ym,
    dueDateGte: `${ym}-01`,
    dueDateLte: `${ym}-${String(last).padStart(2, '0')}`,
  };
}

function isTreated(status) {
  return String(status || '').toUpperCase() === 'DELIVERED';
}

function isCancelled(status) {
  return String(status || '').toUpperCase() === 'CANCELLED';
}

function typeLabel(type) {
  const t = String(type || 'CUSTOM').toUpperCase();
  return TYPE_LABELS[t] || t;
}

/**
 * @param {Array<object>} obligations mapped rows (dueDate, type, status, clientId, …)
 * @param {string} yearMonth YYYY-MM
 */
function buildMonthMatrix(obligations, yearMonth) {
  const bounds = monthBounds(yearMonth);
  const buckets = new Map();

  for (const ob of obligations || []) {
    if (isCancelled(ob.status)) continue;
    const due = String(ob.dueDate || ob.due_date || '').slice(0, 10);
    if (!due || due < bounds.dueDateGte || due > bounds.dueDateLte) continue;

    const type = String(ob.type || 'CUSTOM').toUpperCase();
    const key = `${type}|${due}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        type,
        typeLabel: typeLabel(type),
        dueDate: due,
        title: ob.title || typeLabel(type),
        total: 0,
        treated: 0,
        pending: 0,
        overdue: 0,
        waitingClient: 0,
        items: [],
      });
    }
    const b = buckets.get(key);
    b.total += 1;
    const status = String(ob.status || 'PENDING').toUpperCase();
    if (isTreated(status)) b.treated += 1;
    else {
      b.pending += 1;
      if (status === 'OVERDUE') b.overdue += 1;
      if (status === 'WAITING_CLIENT') b.waitingClient += 1;
    }
    b.items.push({
      id: ob.id || ob._id,
      clientId: ob.clientId || ob.client_id,
      clientName: ob.clientName || ob.clients?.display_name || null,
      clientTaxId: ob.clientTaxId || ob.clients?.tax_id || null,
      title: ob.title || null,
      status,
      period: ob.period || null,
      assignedStaffId: ob.assignedStaffId || ob.assigned_staff_id || null,
    });
  }

  const groups = Array.from(buckets.values()).sort((a, b) => {
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return a.typeLabel.localeCompare(b.typeLabel, 'pt');
  });

  const summary = {
    groups: groups.length,
    total: groups.reduce((s, g) => s + g.total, 0),
    treated: groups.reduce((s, g) => s + g.treated, 0),
    pending: groups.reduce((s, g) => s + g.pending, 0),
    completeGroups: groups.filter((g) => g.pending === 0 && g.total > 0).length,
  };

  return {
    yearMonth: bounds.yearMonth,
    dueDateGte: bounds.dueDateGte,
    dueDateLte: bounds.dueDateLte,
    summary,
    groups: groups.map((g) => ({
      key: g.key,
      type: g.type,
      typeLabel: g.typeLabel,
      dueDate: g.dueDate,
      title: g.title,
      total: g.total,
      treated: g.treated,
      pending: g.pending,
      overdue: g.overdue,
      waitingClient: g.waitingClient,
      ratioLabel: `${g.treated}/${g.total}`,
      complete: g.pending === 0 && g.total > 0,
      items: g.items.sort((a, b) =>
        String(a.clientName || '').localeCompare(String(b.clientName || ''), 'pt'),
      ),
    })),
    note: 'Contagem a partir das obrigações do escritório neste mês (por data de vencimento). Não inventa prazos da AT — confirma sempre no Portal das Finanças.',
  };
}

module.exports = {
  TYPE_LABELS,
  assertYearMonth,
  monthBounds,
  buildMonthMatrix,
  typeLabel,
};
