const { getSupabaseAdmin } = require('../client');

async function createInvite({ firmId, memberId, email, token, expiresAt, createdBy }) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
        .from('firm_member_invites')
        .insert({
            firm_id: firmId,
            member_id: memberId,
            email: String(email || '').trim().toLowerCase(),
            token,
            status: 'PENDING',
            expires_at: expiresAt,
            created_by: createdBy || null,
        })
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

async function findInviteByToken(token) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
        .from('firm_member_invites')
        .select('*')
        .eq('token', token)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function findPendingInviteByMember(memberId) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
        .from('firm_member_invites')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function revokePendingInvitesForMember(memberId) {
    const sb = getSupabaseAdmin();
    const { error } = await sb
        .from('firm_member_invites')
        .update({ status: 'REVOKED', revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('member_id', memberId)
        .eq('status', 'PENDING');
    if (error) throw error;
}

async function markInviteExpired(id) {
    const sb = getSupabaseAdmin();
    const { error } = await sb
        .from('firm_member_invites')
        .update({ status: 'EXPIRED', updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
}

/**
 * Reclama o convite atomicamente (UPDATE condicionado a status='PENDING'). Se dois
 * pedidos concorrentes aceitarem o mesmo convite, só um consegue transitar o estado
 * — o outro recebe null e deve ser tratado como "convite já usado", em vez de ambos
 * prosseguirem e um deles sobrepor silenciosamente a senha definida pelo outro.
 */
async function markInviteAccepted(id) {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
        .from('firm_member_invites')
        .update({ status: 'ACCEPTED', accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'PENDING')
        .select()
        .maybeSingle();
    if (error) throw error;
    return data;
}

/**
 * Reverte um convite reclamado de volta a PENDING (condicionado a status='ACCEPTED').
 * Usado quando a reclamação teve sucesso mas o passo seguinte (gravar a senha) falha
 * — sem isto, uma falha transitória queimaria o link do convite permanentemente,
 * exigindo reenvio manual por um administrador para um problema que era só de rede/DB.
 */
async function revertInviteToPending(id) {
    const sb = getSupabaseAdmin();
    const { error } = await sb
        .from('firm_member_invites')
        .update({ status: 'PENDING', accepted_at: null, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('status', 'ACCEPTED');
    if (error) throw error;
}

module.exports = {
    createInvite,
    findInviteByToken,
    findPendingInviteByMember,
    revokePendingInvitesForMember,
    markInviteExpired,
    markInviteAccepted,
    revertInviteToPending,
};
