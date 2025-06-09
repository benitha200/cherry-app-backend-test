import { getGradeABatches, getHighGradeTransfers } from "../../services/batches/batches.js";




// get Completed BaggingOff of High grade (A)  batches for specific CWS manager
export const getGradeABatchesController = async (req, res) => {
    const { cwsId } = req.params;
    const user = req.user;
    const { page = 1, limit } = req.query;

    if (user.cwsId !== parseInt(cwsId)) {
        res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to access this CWS.' });
    }

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { total, batches } = await getGradeABatches(cwsId, offset, parseInt(limit));

        return res.json({
            data: batches,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'internal server Error', message: error.message });
    }
};

// get Completed High Grade Tranfers  batches for specific CWS manager
export const getHighGradeTransfersController = async (req, res) => {
    const { cwsId } = req.params;
    const user = req.user;
    const { page = 1, limit } = req.query;

    if (user.cwsId !== parseInt(cwsId)) {
        res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to access this CWS.' });
    }

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { total, batches } = await getHighGradeTransfers(cwsId, offset, parseInt(limit));


        return res.json({
            data: batches,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'internal server Error', message: error.message });
    }
}