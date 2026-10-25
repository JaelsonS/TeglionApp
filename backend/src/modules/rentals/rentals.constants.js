const PROPERTY_STATUSES = ['active', 'archived'];

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
  'Recibos de renda INTERNOS para controlo do escritório. Não são recibos oficiais do Portal das Finanças nem comunicação à AT.';

module.exports = {
  PROPERTY_STATUSES,
  LEASE_STATUSES,
  LEASE_TYPES,
  RECEIPT_STATUSES,
  RECEIPT_STATUS_LABELS,
  RENT_PAYMENT_METHODS,
  INTERNAL_DISCLAIMER,
};
