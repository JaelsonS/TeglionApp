const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');
const teamPermissionsService = require('./team-permissions.service');

exports.getByMember = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const memberId = parseEntityId(req.query.memberId || req.params.id, 'memberId');
        const data = await teamPermissionsService.getTeamPermissions({ firmId, memberId });
        return res.json(data);
    } catch (err) {
        return next(err);
    }
};

exports.patchByMember = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const memberId = parseEntityId(req.params.id, 'id');
        const data = await teamPermissionsService.patchTeamPermissions({
            firmId,
            memberId,
            actor: req.user,
            payload: req.body || {},
            req,
        });
        return res.json(data);
    } catch (err) {
        return next(err);
    }
};
