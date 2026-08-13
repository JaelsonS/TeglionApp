const { getSupabaseAdmin } = require('../client');

/**
 * Tenta reservar o envio de um lembrete (obligation_id + channel + dia civil).
 * Retorna true só se esta chamada de facto inseriu a linha — ou seja, só a
 * primeira tentativa do dia para aquele canal recebe `true`; tentativas
 * seguintes no mesmo dia recebem `false` sem lançar erro (violação de
 * UNIQUE é o caminho esperado, não uma falha).
 * @param {{ firmId: string, obligationId: string, channel: 'message'|'email', dayBucket: string }} opts
 * @returns {Promise<boolean>}
 */
async function tryClaimReminderSend({ firmId, obligationId, channel, dayBucket }) {
  const sb = getSupabaseAdmin();
  const { error } = await sb.from('obligation_reminder_sends').insert({
    firm_id: firmId,
    obligation_id: obligationId,
    channel,
    day_bucket: dayBucket,
  });
  if (!error) return true;
  if (error.code === '23505') return false; // já enviado hoje neste canal
  throw error;
}

module.exports = { tryClaimReminderSend };
