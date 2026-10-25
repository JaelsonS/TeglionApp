const FEE_CHARGE_STATUSES = ['draft', 'confirmed', 'sent', 'paid', 'cancelled'];

const FEE_PAYMENT_METHODS = [
  { id: 'transfer', label: 'Transferência' },
  { id: 'mbway', label: 'MB Way' },
  { id: 'multibanco', label: 'Multibanco' },
  { id: 'cash', label: 'Numerário' },
  { id: 'stripe', label: 'Stripe (online)' },
  { id: 'other', label: 'Outro' },
];

const STATUS_LABELS = {
  draft: 'Rascunho',
  confirmed: 'Confirmada',
  sent: 'Enviada',
  paid: 'Paga',
  cancelled: 'Cancelada',
};

module.exports = {
  FEE_CHARGE_STATUSES,
  FEE_PAYMENT_METHODS,
  STATUS_LABELS,
};
