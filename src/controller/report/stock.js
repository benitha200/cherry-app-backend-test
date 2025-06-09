import { stockReport } from '../../services/report/stock.js';

export const getStockReport = async (req, res) => {
    try {

        if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "SUPERVISOR" && req.user.role !== "MD" && req.user.role !== "FINANCE" && req.user.role !== "OPERATIONS") {
            return res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to Perform this Request ' });
        }

        const result = await stockReport();

        if (!result) {
            return res.status(404).json({ message: 'No stock report found' });
        }

        res.status(200).json({ message: 'Stock report fetched successfully', data: result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stock report', message: error.message });
    }
};
