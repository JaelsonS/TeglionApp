const { getSupabaseAdmin } = require('../client');

function mapFirmUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    firmId: row.firm_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    jobTitle: row.job_title || null,
    departmentId: row.department_id || null,
    invitedBy: row.invited_by || null,
    invitedAt: row.invited_at || null,
    inviteStatus: row.invite_status || 'ACCEPTED',
    emailConfirmedAt: row.email_confirmed_at || null,
    permissionsOverride: Array.isArray(row.permissions_override) ? row.permissions_override : null,
  };
}

function jwtRoleFromFirmRole(role) {
  if (role === 'FIRM_OWNER') return 'FIRM_OWNER';
  if (role === 'FIRM_CONSULTANT') return 'CONSULTANT';
  return 'FIRM_STAFF';
}

async function findFirmUserByEmail(email) {
  const sb = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  const { data, error } = await sb
    .from('firm_users')
    .select('*')
    .eq('email', normalized)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findFirmUserById(id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from('firm_users').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

async function listFirmUsers(firmId, { activeOnly = true } = {}) {
  const sb = getSupabaseAdmin();
  let q = sb
    .from('firm_users')
    .select('id, firm_id, email, full_name, role, is_active, created_at, updated_at, job_title, department_id, invited_by, invited_at, invite_status, email_confirmed_at, permissions_override')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: true });
  if (activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((row) => mapFirmUser(row));
}

async function findFirmUserByEmailExcluding(email, excludeUserId) {
  const sb = getSupabaseAdmin();
  const normalized = String(email || '').trim().toLowerCase();
  let q = sb.from('firm_users').select('id, firm_id, email').eq('email', normalized).limit(1);
  if (excludeUserId) q = q.neq('id', excludeUserId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data;
}

async function findFirmUserByIdForFirm(firmId, id) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_users')
    .select('id, firm_id, email, full_name, role, is_active, created_at, updated_at, job_title, department_id, invited_by, invited_at, invite_status, email_confirmed_at, permissions_override')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return mapFirmUser(data);
}

async function updateFirmUserProfile(id, firmId, { fullName, email }) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (fullName != null) row.full_name = String(fullName).trim();
  if (email != null) row.email = String(email).trim().toLowerCase();
  const { data, error } = await sb
    .from('firm_users')
    .update(row)
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deactivateAllFirmUsers(firmId) {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from('firm_users')
    .update({
      is_active: false,
      refresh_token_hash: null,
      refresh_token_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId);
  if (error) throw error;
}

async function createFirmMember({
  firmId,
  email,
  fullName,
  role = 'FIRM_STAFF',
  jobTitle = null,
  departmentId = null,
  invitedBy = null,
  invitedAt = null,
  inviteStatus = 'PENDING',
  passwordHash = null,
  isActive = true,
  emailConfirmedAt = new Date().toISOString(),
  permissionsOverride = null,
}) {
  const sb = getSupabaseAdmin();
  const row = {
    firm_id: firmId,
    email: String(email || '').trim().toLowerCase(),
    full_name: fullName || null,
    role,
    job_title: jobTitle,
    is_active: Boolean(isActive),
    department_id: departmentId,
    invited_by: invitedBy,
    invited_at: invitedAt,
    invite_status: inviteStatus,
    email_confirmed_at: emailConfirmedAt,
    permissions_override: permissionsOverride,
  };
  if (passwordHash) row.password_hash = passwordHash;
  const { data, error } = await sb
    .from('firm_users')
    .insert(row)
    .select('id, firm_id, email, full_name, role, is_active, created_at, updated_at, job_title, department_id, invited_by, invited_at, invite_status, email_confirmed_at, permissions_override')
    .single();
  if (error) throw error;
  return mapFirmUser(data);
}

async function updateFirmMember(firmId, userId, patch) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (patch.fullName !== undefined) row.full_name = patch.fullName || null;
  if (patch.email !== undefined) row.email = String(patch.email || '').trim().toLowerCase();
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.jobTitle !== undefined) row.job_title = patch.jobTitle || null;
  if (patch.departmentId !== undefined) row.department_id = patch.departmentId || null;
  if (patch.inviteStatus !== undefined) row.invite_status = patch.inviteStatus;
  if (patch.isActive !== undefined) row.is_active = Boolean(patch.isActive);
  if (patch.passwordHash !== undefined) row.password_hash = patch.passwordHash;
  if (patch.emailConfirmedAt !== undefined) row.email_confirmed_at = patch.emailConfirmedAt;
  if (patch.permissionsOverride !== undefined) row.permissions_override = patch.permissionsOverride;

  const { data, error } = await sb
    .from('firm_users')
    .update(row)
    .eq('firm_id', firmId)
    .eq('id', userId)
    .select('id, firm_id, email, full_name, role, is_active, created_at, updated_at, job_title, department_id, invited_by, invited_at, invite_status, email_confirmed_at, permissions_override')
    .single();
  if (error) throw error;
  return mapFirmUser(data);
}

async function setFirmMemberActive(firmId, userId, isActive) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_users')
    .update({
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    })
    .eq('firm_id', firmId)
    .eq('id', userId)
    .select('id, firm_id, email, full_name, role, is_active, created_at, updated_at, job_title, department_id, invited_by, invited_at, invite_status, email_confirmed_at, permissions_override')
    .single();
  if (error) throw error;
  return mapFirmUser(data);
}

async function findFirmOwnerEmail(firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_users')
    .select('email')
    .eq('firm_id', firmId)
    .eq('role', 'FIRM_OWNER')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.email || null;
}

async function createFirmOwner({ firmId, email, fullName, passwordHash, ssoProvider, ssoSubject }) {
  const sb = getSupabaseAdmin();
  const row = {
    firm_id: firmId,
    email: String(email).trim().toLowerCase(),
    full_name: fullName,
    role: 'FIRM_OWNER',
    is_active: true,
  };
  if (passwordHash !== undefined && passwordHash !== null) {
    row.password_hash = passwordHash;
  }
  if (ssoProvider) row.sso_provider = String(ssoProvider);
  if (ssoSubject) row.sso_subject = String(ssoSubject);
  const { data, error } = await sb.from('firm_users').insert(row).select().single();
  if (error) throw error;
  return data;
}

async function updateFirmUserSso(id, { ssoProvider, ssoSubject }) {
  const sb = getSupabaseAdmin();
  const row = { updated_at: new Date().toISOString() };
  if (ssoProvider !== undefined) row.sso_provider = ssoProvider;
  if (ssoSubject !== undefined) row.sso_subject = ssoSubject;
  const { data, error } = await sb.from('firm_users').update(row).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function updateFirmUserAuth(id, { refreshTokenHash, refreshTokenExpiresAt, passwordHash }) {
  const sb = getSupabaseAdmin();
  const row = {};
  if (refreshTokenHash !== undefined) row.refresh_token_hash = refreshTokenHash;
  if (refreshTokenExpiresAt !== undefined) row.refresh_token_expires_at = refreshTokenExpiresAt;
  if (passwordHash !== undefined) row.password_hash = passwordHash;
  const { data, error } = await sb.from('firm_users').update(row).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

async function markFirmUserEmailConfirmed(id, firmId) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_users')
    .update({
      email_confirmed_at: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('firm_id', firmId)
    .select('id, firm_id, email, full_name, role, is_active, created_at, updated_at, job_title, department_id, invited_by, invited_at, invite_status, email_confirmed_at, permissions_override')
    .single();
  if (error) throw error;
  return mapFirmUser(data);
}

async function updateOnboardingCompleted(id, firmId, completed) {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from('firm_users')
    .update({
      onboarding_completed: Boolean(completed),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('firm_id', firmId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  mapFirmUser,
  jwtRoleFromFirmRole,
  findFirmUserByEmail,
  findFirmUserById,
  listFirmUsers,
  findFirmUserByEmailExcluding,
  findFirmUserByIdForFirm,
  updateFirmUserProfile,
  updateOnboardingCompleted,
  deactivateAllFirmUsers,
  findFirmOwnerEmail,
  createFirmMember,
  updateFirmMember,
  setFirmMemberActive,
  createFirmOwner,
  updateFirmUserSso,
  updateFirmUserAuth,
  markFirmUserEmailConfirmed,
};
