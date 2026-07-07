const { AppError } = require('../../middlewares/error.middleware');
const { getSupabaseAdmin, isSupabaseConfigured } = require('../../db/supabase/client');
const { currentPeriodLabel, dueDateForPeriod } = require('./obligation-operational');

const SYSTEM_TEMPLATES = [
  {
    code: 'IVA',
    type: 'IVA',
    name: 'IVA — Declaração periódica',
    recurrence_frequency: 'MONTHLY',
    default_due_day: 20,
    default_priority: 'HIGH',
    checklist: ['Validar faturação do período', 'Submeter declaração', 'Confirmar pagamento'],
    expected_documents: ['Mapa de vendas', 'Mapa de compras', 'Extrato bancário'],
  },
  {
    code: 'IRS',
    type: 'IRS',
    name: 'IRS — Retenções na fonte',
    recurrence_frequency: 'MONTHLY',
    default_due_day: 20,
    default_priority: 'HIGH',
    checklist: ['Conferir retenções', 'Entregar declaração'],
    expected_documents: ['Folha de salários', 'Mapa de retenções'],
  },
  {
    code: 'SS',
    type: 'SS',
    name: 'Segurança Social',
    recurrence_frequency: 'MONTHLY',
    default_due_day: 20,
    default_priority: 'URGENT',
    checklist: ['Validar contributivos', 'Emitir guia DMR'],
    expected_documents: ['Folha salarial', 'Comprovativo SS anterior'],
  },
  {
    code: 'SAFT',
    type: 'SAFT',
    name: 'SAF-T (PT)',
    recurrence_frequency: 'MONTHLY',
    default_due_day: 5,
    default_priority: 'HIGH',
    checklist: ['Exportar SAF-T', 'Validar XSD', 'Submeter AT'],
    expected_documents: ['SAF-T mensal'],
  },
  {
    code: 'PAYROLL',
    type: 'PAYROLL',
    name: 'Folha salarial',
    recurrence_frequency: 'MONTHLY',
    default_due_day: 25,
    default_priority: 'NORMAL',
    checklist: ['Processar salários', 'Enviar recibos ao cliente'],
    expected_documents: ['Mapa de salários', 'Subsídios e faltas'],
  },
  {
    code: 'IRC',
    type: 'IRC',
    name: 'IRC — Pagamento por conta',
    recurrence_frequency: 'QUARTERLY',
    default_due_day: 15,
    default_priority: 'HIGH',
    checklist: ['Calcular pagamento', 'Submeter declaração'],
    expected_documents: ['Balancete trimestral'],
  },
  {
    code: 'IES',
    type: 'IES',
    name: 'IES — Anual',
    recurrence_frequency: 'ANNUAL',
    default_due_day: 15,
    default_priority: 'URGENT',
    checklist: ['Preparar IES', 'Validar anexos', 'Submeter'],
    expected_documents: ['IES', 'Anexos contabilísticos'],
  },
];

function mapTemplateRow(row) {
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    code: row.code,
    name: row.name,
    type: row.type,
    recurrenceFrequency: row.recurrence_frequency,
    defaultDueDay: row.default_due_day,
    defaultPriority: row.default_priority,
    defaultAmountCents: row.default_amount_cents,
    checklist: row.checklist || [],
    expectedDocuments: row.expected_documents || [],
    defaultTaskDescription: row.default_task_description,
    notifyOnCreate: row.notify_on_create,
    createClientTask: row.create_client_task,
    isSystem: row.is_system,
    isActive: row.is_active,
  };
}

function ensureSb() {
  if (!isSupabaseConfigured()) throw new AppError('Supabase não configurado', 503);
  return getSupabaseAdmin();
}

async function seedSystemTemplates(firmId) {
  const sb = ensureSb();
  const rows = SYSTEM_TEMPLATES.map((t) => ({
    firm_id: firmId,
    code: t.code,
    name: t.name,
    type: t.type,
    recurrence_frequency: t.recurrence_frequency,
    default_due_day: t.default_due_day,
    default_priority: t.default_priority,
    checklist: t.checklist,
    expected_documents: t.expected_documents,
    is_system: true,
    notify_on_create: true,
    create_client_task: true,
  }));
  const { error } = await sb.from('obligation_templates').upsert(rows, { onConflict: 'firm_id,code' });
  if (error) throw error;
}

async function listTemplates(firmId) {
  const sb = ensureSb();
  const { count } = await sb
    .from('obligation_templates')
    .select('id', { count: 'exact', head: true })
    .eq('firm_id', firmId);
  if (!count) await seedSystemTemplates(firmId);

  const { data, error } = await sb
    .from('obligation_templates')
    .select('*')
    .eq('firm_id', firmId)
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapTemplateRow);
}

async function createTemplate(firmId, payload) {
  const sb = ensureSb();
  const row = {
    firm_id: firmId,
    code: String(payload.code || payload.type).trim().toUpperCase(),
    name: String(payload.name).trim(),
    type: String(payload.type).trim(),
    recurrence_frequency: payload.recurrenceFrequency || 'MONTHLY',
    default_due_day: payload.defaultDueDay ?? 20,
    default_priority: payload.defaultPriority || 'NORMAL',
    default_amount_cents: payload.defaultAmountCents ?? null,
    checklist: payload.checklist || [],
    expected_documents: payload.expectedDocuments || [],
    default_task_description: payload.defaultTaskDescription || null,
    notify_on_create: payload.notifyOnCreate !== false,
    create_client_task: payload.createClientTask !== false,
    is_system: false,
  };
  const { data, error } = await sb.from('obligation_templates').insert(row).select().single();
  if (error) throw error;
  return mapTemplateRow(data);
}

async function createRecurrenceRule(firmId, payload) {
  const sb = ensureSb();
  const template = await sb
    .from('obligation_templates')
    .select('*')
    .eq('id', payload.templateId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (template.error) throw template.error;
  if (!template.data) throw new AppError('Modelo não encontrado', 404);

  const freq = payload.frequency || template.data.recurrence_frequency;
  const period = payload.nextPeriod || currentPeriodLabel(freq);
  const due = payload.nextDueDate || dueDateForPeriod(period, template.data.default_due_day);

  const row = {
    firm_id: firmId,
    client_id: payload.clientId,
    template_id: payload.templateId,
    frequency: freq,
    last_period: null,
    next_period: period,
    next_due_date: due,
    assigned_staff_id: payload.assignedStaffId || null,
    is_active: true,
  };
  const { data, error } = await sb.from('obligation_recurrence_rules').insert(row).select().single();
  if (error) throw error;
  return data;
}

module.exports = {
  listTemplates,
  createTemplate,
  createRecurrenceRule,
  seedSystemTemplates,
  mapTemplateRow,
  SYSTEM_TEMPLATES,
};
