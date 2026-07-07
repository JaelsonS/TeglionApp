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

async function markInviteAccepted(id) {
    const sb = getSupabaseAdmin();
    const { error } = await sb
        .from('firm_member_invites')
        .update({ status: 'ACCEPTED', accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id);
    if (error) throw error;
}

module.exports = {
    createInvite,
    findInviteByToken,
    findPendingInviteByMember,
    revokePendingInvitesForMember,
    markInviteExpired,
    markInviteAccepted,
};
