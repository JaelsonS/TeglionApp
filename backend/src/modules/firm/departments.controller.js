const departmentsService = require('./departments.service');
const { requireUserFirmId, parseEntityId } = require('../../utils/contabil-scope');

exports.list = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const items = await departmentsService.list(firmId);
        return res.json({ items });
    } catch (err) {
        return next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const department = await departmentsService.create({
            firmId,
            actor: req.user,
            payload: req.body || {},
            req,
        });
        return res.status(201).json({ department });
    } catch (err) {
        return next(err);
    }
};

exports.patch = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const departmentId = parseEntityId(req.params.id, 'id');
        const department = await departmentsService.patch({
            firmId,
            departmentId,
            actor: req.user,
            payload: req.body || {},
            req,
        });
        return res.json({ department });
    } catch (err) {
        return next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const firmId = requireUserFirmId(req);
        const departmentId = parseEntityId(req.params.id, 'id');
        const department = await departmentsService.remove({
            firmId,
            departmentId,
            actor: req.user,
            req,
        });
        return res.json({ department });
    } catch (err) {
        return next(err);
    }
};
