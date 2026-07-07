const { AppError } = require('../../../middlewares/error.middleware');
const firmsRepository = require('../../../db/supabase/repositories/firms.repository');
const firmUsersRepository = require('../../../db/supabase/repositories/firm-users.repository');
const accountingServicesRepository = require('../../../db/supabase/repositories/accounting-services.repository');
const contabilNotifications = require('../../../services/notifications/contabil-notifications.service');
const bookingService = require('../../booking/booking.service');
const { requireLinkedClient } = require('./client.guard');

async function listBookingServicesForClient({ actor }) {
  const client = await requireLinkedClient(actor);
  const items = await accountingServicesRepository.listByFirm(client.firmId, { activeOnly: true });
  return { items };
}

async function listBookingSlotsForClient({ actor, serviceId, from, to }) {
  const client = await requireLinkedClient(actor);
  if (!serviceId) throw new AppError('Serviço obrigatório', 400);
  const fromIso = String(from || '').trim();
  const toIso = String(to || '').trim();
  const fromOk = Number.isFinite(new Date(fromIso).getTime());
  const toOk = Number.isFinite(new Date(toIso).getTime());
  if (!fromIso || !toIso || !fromOk || !toOk) throw new AppError('Indique datas from e to (ISO)', 400);
  return bookingService.listSlotsForBooking({
    firmId: client.firmId,
    serviceId,
    fromIso,
    toIso,
  });
}

async function bookConsultationAsClient({ actor, serviceId, scheduledAt }) {
  const client = await requireLinkedClient(actor);
  if (!serviceId) throw new AppError('Serviço obrigatório', 400);
  if (!scheduledAt) throw new AppError('Data obrigatória', 400);
  const result = await bookingService.bookAsClient({
    firmId: client.firmId,
    clientId: client.id,
    serviceId,
    scheduledAt,
  });

  const firm = await firmsRepository.findFirmById(client.firmId).catch(() => null);
  const bookingCfg = bookingService.normalizeBooking(firm?.settings?.booking);
  const tz = bookingCfg.timezone || 'Europe/Lisbon';
  const when = new Date(scheduledAt).toLocaleString('pt-PT', {
    timeZone: tz,
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const ownerEmail = await firmUsersRepository.findFirmOwnerEmail(client.firmId).catch(() => null);
  const notifyEmail = ownerEmail || firm?.settings?.contactEmail || firm?.settings?.notificationEmail;
  if (notifyEmail) {
    void contabilNotifications
      .notifyFirmConsultationBooked({
        staffEmail: notifyEmail,
        firmName: firm?.name,
        clientName: client.displayName || client.name,
        serviceName: result.service?.name,
        when,
      })
      .catch(() => {});
  }

  return result;
}

module.exports = {
  listBookingServicesForClient,
  listBookingSlotsForClient,
  bookConsultationAsClient,
};
