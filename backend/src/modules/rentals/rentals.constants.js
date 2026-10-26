const PROPERTY_STATUSES = ['active', 'archived'];

const COST_CATEGORIES = [
  { id: 'arrendamento', label: 'Arrendamento / renda do escritório' },
  { id: 'luz', label: 'Electricidade' },
  { id: 'gas', label: 'Gás' },
  { id: 'agua', label: 'Água' },
  { id: 'software', label: 'Software / licenças' },
  { id: 'telecom', label: 'Telecomunicações' },
  { id: 'seguro', label: 'Seguros' },
  { id: 'outro', label: 'Outro' },
];

const LEASE_STATUSES = ['draft', 'active', 'ended', 'cancelled'];

const LEASE_TYPES = [
  { id: 'habitacao', label: 'Habitação' },
  { id: 'comercio', label: 'Comércio' },
  { id: 'outro', label: 'Outro' },
];

const RECEIPT_STATUSES = ['draft', 'issued', 'paid', 'cancelled'];

const RECEIPT_STATUS_LABELS = {
  draft: 'Rascunho',
  issued: 'Emitido (interno)',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

const RENT_PAYMENT_METHODS = [
  { id: 'transfer', label: 'Transferência' },
  { id: 'mbway', label: 'MB Way' },
  { id: 'multibanco', label: 'Multibanco' },
  { id: 'cash', label: 'Numerário' },
  { id: 'other', label: 'Outro' },
];

const INTERNAL_DISCLAIMER =
  'Registo interno de custos e contratos do gabinete (renda, luz, gás, software, etc.). Não substitui facturas oficiais nem o Portal das Finanças.';

const CLIENT_RENTALS_DISCLAIMER =
  'Registo interno de imóveis e rendas dos clientes (senhorio → inquilino). Não são recibos oficiais AT nem comunicação ao Portal das Finanças.';

module.exports = {
  PROPERTY_STATUSES,
  COST_CATEGORIES,
  LEASE_STATUSES,
  LEASE_TYPES,
  RECEIPT_STATUSES,
  RECEIPT_STATUS_LABELS,
  RENT_PAYMENT_METHODS,
  INTERNAL_DISCLAIMER,
  CLIENT_RENTALS_DISCLAIMER,
};
