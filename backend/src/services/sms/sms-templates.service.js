/**
 * Templates SMS TegLion — Português de Portugal.
 */
const TEMPLATES = {
  DOCUMENT_SENT: {
    key: 'DOCUMENT_SENT',
    label: 'Documento enviado pelo escritório',
    build: ({ firmName }) =>
      `${firmName || 'O seu escritório de contabilidade'} enviou um novo documento. Consulte na plataforma TegLion.`,
  },
  OBLIGATION_CREATED: {
    key: 'OBLIGATION_CREATED',
    label: 'Nova obrigação fiscal',
    build: ({ firmName, obligationTitle, dueDate }) =>
      `${firmName || 'O seu escritório'} disponibilizou: ${obligationTitle || 'nova obrigação fiscal'}${dueDate ? ` (prazo ${dueDate})` : ''}. Consulte na plataforma.`,
  },
  DEADLINE_NEAR: {
    key: 'DEADLINE_NEAR',
    label: 'Prazo próximo',
    build: ({ firmName, obligationTitle, dueDate }) =>
      `Lembrete TegLion: ${obligationTitle || 'obrigação fiscal'} vence ${dueDate || 'em breve'}. ${firmName || 'O seu escritório'}.`,
  },
  URGENT_DOCUMENT: {
    key: 'URGENT_DOCUMENT',
    label: 'Documento urgente',
    build: ({ firmName }) =>
      `URGENTE: ${firmName || 'O seu escritório'} enviou um documento que requer a sua atenção imediata. Aceda ao portal TegLion.`,
  },
  NEW_TAX_AVAILABLE: {
    key: 'NEW_TAX_AVAILABLE',
    label: 'Novo imposto/guia disponível',
    build: ({ firmName, obligationTitle }) =>
      `${firmName || 'O seu escritório de contabilidade'} disponibilizou ${obligationTitle || 'uma guia de pagamento'}. Consulte na plataforma.`,
  },
  TASK_CREATED: {
    key: 'TASK_CREATED',
    label: 'Nova tarefa no portal',
    build: ({ firmName, taskTitle, dueDate }) =>
      `${firmName || 'O seu escritório'} pediu-lhe: ${taskTitle || 'nova tarefa no portal'}${dueDate ? ` (prazo ${dueDate})` : ''}. Aceda ao TegLion.`,
  },
};

function buildMessage(templateKey, vars = {}) {
  const tpl = TEMPLATES[templateKey];
  if (!tpl) return null;
  return tpl.build(vars);
}

function listTemplates() {
  return Object.values(TEMPLATES).map((t) => ({ key: t.key, label: t.label }));
}

module.exports = {
  TEMPLATES,
  buildMessage,
  listTemplates,
};
