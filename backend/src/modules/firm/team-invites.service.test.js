const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

require('../../test/ensure-test-env');

const firmUsersRepository = require('../../db/supabase/repositories/firm-users.repository');
const firmMemberInvitesRepository = require('../../db/supabase/repositories/firm-member-invites.repository');
const firmsRepository = require('../../db/supabase/repositories/firms.repository');
const emailConfirmationService = require('../../services/email/email-confirmation.service');
const securityAudit = require('../../services/audit/security-audit.service');
const teamInvitesService = require('./team-invites.service');

function resetMocks() {
    mock.restoreAll();
}

const PENDING_INVITE = {
    id: 'invite-1',
    firm_id: 'firm-a',
    member_id: 'member-1',
    email: 'novo@firma.com',
    status: 'PENDING',
    expires_at: new Date(Date.now() + 60_000).toISOString(),
};

function baseMocks() {
    mock.method(firmMemberInvitesRepository, 'findInviteByToken', async () => ({ ...PENDING_INVITE }));
    mock.method(firmUsersRepository, 'findFirmUserByIdForFirm', async () => ({
        id: 'member-1',
        firmId: 'firm-a',
        fullName: 'Novo Membro',
        email: 'novo@firma.com',
    }));
    mock.method(firmsRepository, 'findFirmById', async () => ({ id: 'firm-a', name: 'Firma A' }));
    mock.method(emailConfirmationService, 'issueAndSendFirmUserEmailConfirmation', async () => ({
        emailSent: true,
        emailError: null,
    }));
    mock.method(securityAudit, 'recordTeamMutation', async () => {});
}

// Regressão: acceptInvite fazia check-then-write não atómico — lia invite.status,
// validava, e só depois gravava a senha + marcava o convite como aceite em duas
// chamadas separadas. Duas submissões concorrentes do mesmo convite (mesmo token)
// passavam ambas na validação antes de qualquer escrita, e a última a completar
// definia a senha final da conta sem que a outra soubesse que perdeu a corrida.

test('acceptInvite: quando markInviteAccepted perde a corrida (convite já reclamado), nunca chega a gravar a senha', async () => {
    resetMocks();
    baseMocks();
    mock.method(firmMemberInvitesRepository, 'markInviteAccepted', async () => null);
    let updateFirmMemberCalled = false;
    mock.method(firmUsersRepository, 'updateFirmMember', async () => {
        updateFirmMemberCalled = true;
        return {};
    });

    await assert.rejects(
        () =>
            teamInvitesService.acceptInvite({
                token: 'tok-1',
                email: 'novo@firma.com',
                password: 'SenhaForte!2026',
                fullName: 'Novo Membro',
            }),
        (err) => err?.statusCode === 410 && err?.details?.code === 'INVITE_ALREADY_USED',
    );

    assert.equal(updateFirmMemberCalled, false, 'perder a corrida nunca deve gravar/sobrepor a senha');
});

test('acceptInvite: caminho feliz — reclama o convite e grava a senha uma única vez', async () => {
    resetMocks();
    baseMocks();
    mock.method(firmMemberInvitesRepository, 'markInviteAccepted', async () => ({
        id: 'invite-1',
        status: 'ACCEPTED',
    }));
    let updateFirmMemberCalls = 0;
    mock.method(firmUsersRepository, 'updateFirmMember', async (firmId, memberId, patch) => {
        updateFirmMemberCalls += 1;
        return { id: memberId, firmId, email: 'novo@firma.com', fullName: patch.fullName, role: 'FIRM_STAFF' };
    });

    const result = await teamInvitesService.acceptInvite({
        token: 'tok-1',
        email: 'novo@firma.com',
        password: 'SenhaForte!2026',
        fullName: 'Novo Membro',
    });

    assert.equal(result.success, true);
    assert.equal(updateFirmMemberCalls, 1);
});

// Regressão (segunda auditoria): inverter a ordem para "reclamar antes de gravar a
// senha" fechou a corrida, mas abriu uma nova falha — se updateFirmMember lançar
// DEPOIS do convite já ter sido reclamado (blip de rede/DB), o convite ficava preso
// em ACCEPTED para sempre, sem senha gravada, exigindo reenvio manual por um admin.
test('acceptInvite: se updateFirmMember falhar depois do claim, o convite volta a PENDING (não fica queimado)', async () => {
    resetMocks();
    baseMocks();
    mock.method(firmMemberInvitesRepository, 'markInviteAccepted', async () => ({
        id: 'invite-1',
        status: 'ACCEPTED',
    }));
    mock.method(firmUsersRepository, 'updateFirmMember', async () => {
        throw new Error('falha transitória de rede/DB');
    });
    let revertedId = null;
    mock.method(firmMemberInvitesRepository, 'revertInviteToPending', async (id) => {
        revertedId = id;
    });

    await assert.rejects(
        () =>
            teamInvitesService.acceptInvite({
                token: 'tok-1',
                email: 'novo@firma.com',
                password: 'SenhaForte!2026',
                fullName: 'Novo Membro',
            }),
        (err) => err.message === 'falha transitória de rede/DB',
    );

    assert.equal(revertedId, 'invite-1', 'devia reverter o convite para PENDING para permitir nova tentativa');
});
