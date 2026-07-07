const BROADCAST_CATEGORIES = [
  { id: 'IVA', label: 'IVA' },
  { id: 'IRS', label: 'IRS' },
  { id: 'IRC', label: 'IRC' },
  { id: 'SS', label: 'Segurança Social' },
  { id: 'DOC_PENDING', label: 'Documentos pendentes' },
  { id: 'LEGAL', label: 'Alterações legais' },
  { id: 'MAINTENANCE', label: 'Manutenção' },
  { id: 'INTERNAL', label: 'Avisos internos' },
  { id: 'URGENT', label: 'Urgente' },
  { id: 'AVISO', label: 'Aviso geral' },
];

const BROADCAST_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const FAN_OUT_CHUNK = 80;

module.exports = { BROADCAST_CATEGORIES, BROADCAST_PRIORITIES, FAN_OUT_CHUNK };
