const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');
const teamInvitesService = require('./team-invites.service');

exports.create = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const result = await teamInvitesService.createStaffInvite({
            firmId,
            actor: req.user,
            payload: req.body || {},
            req,
        });
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
};

exports.resendForMember = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const memberId = parseEntityId(req.params.id, 'id');
        const result = await teamInvitesService.resendStaffInvite({
            firmId,
            memberId,
            actor: req.user,
            req,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
};

exports.revokeForMember = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const memberId = parseEntityId(req.params.id, 'id');
        const result = await teamInvitesService.revokeStaffInvite({
            firmId,
            memberId,
            actor: req.user,
            req,
        });
        return res.json(result);
    } catch (err) {
        return next(err);
    }
};

exports.previewPublic = async (req, res, next) => {
    try {
        const data = await teamInvitesService.previewInvite(req.params.token);
        return res.json(data);
    } catch (err) {
        return next(err);
    }
};

exports.acceptPublic = async (req, res, next) => {
    try {
        const data = await teamInvitesService.acceptInvite({
            token: req.params.token,
            email: req.body?.email,
            password: req.body?.password,
            fullName: req.body?.fullName,
            req,
        });
        return res.status(201).json(data);
    } catch (err) {
        return next(err);
    }
};

exports.confirmEmailPublic = async (req, res, next) => {
    try {
        const data = await teamInvitesService.confirmMemberEmail({ token: req.params.token, req });
        return res.json(data);
    } catch (err) {
        return next(err);
    }
};
