import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { DeliveryReportService, getAllBatchesInDeliveryService, getBatchesByTruckDeliveryService, getGroupedTruckDeliveryDetails, sendDeliveryTestResultService, SaveAllHighGradeBatchesToQualityDelivery, createMissingQualityDeliveryRecords } from "../../services/quality/qualityDelivery.js";

export const getAllBatchesInDeliveryTesting = async (req, res) => {

    const { page = 1, limit = 10 } = req.query;


    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "SUPERVISOR" && req.user.role !== "MD" && req.user.role !== "FINANCE" && req.user.role !== "OPERATIONS" && req.user.role !== "QUALITY") {
        return res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to Perform this Request ' });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);


        const { batches, total } = await getAllBatchesInDeliveryService(offset, parseInt(limit));

        return res.json({
            message: "cws Batches in delivery testing retrieved successfully",
            data: {
                batches,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(total / limitNumber),
                },
            },
        });
    } catch (error) {
        res.status(400).json({ error: "Error in Getting all Batches in Delivery Testing ", message: error.message });
    }
};
export const getAllTrucksInDeliveryTesting = async (req, res) => {

    try {

        if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "SUPERVISOR" && req.user.role !== "MD" && req.user.role !== "FINANCE" && req.user.role !== "OPERATIONS" && req.user.role !== "QUALITY") {
            return res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to Perform this Request ' });
        }

        const { total, trucks } = await getGroupedTruckDeliveryDetails();

        return res.status(200).json({
            message: "Unique truck deliveries retrieved successfully",
            data: {
                total,
                trucks
            }
        });
    } catch (error) {
        console.error('Error fetching grouped trucks:', error);
        return res.status(500).json({
            error: "Server Error",
            message: error.message
        });
    }
};
export const getBatchesByTruck = async (req, res) => {

    const { page = 1, limit = 2000 } = req.query;
    const { truckNumber, transferDate, transportGroupId } = req.params;

    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "SUPERVISOR" && req.user.role !== "MD" && req.user.role !== "FINANCE" && req.user.role !== "OPERATIONS" && req.user.role !== "QUALITY") {
        return res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to Perform this Request ' });
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    try {
        const { categoryKgs, batches, total } = await getBatchesByTruckDeliveryService(offset, limitNumber, truckNumber, transferDate, transportGroupId);

        return res.status(200).json({
            message: `Batches in delivery testing by truck ${truckNumber} retrieved successfully`,
            data: {
                categoryKgs,
                batches,
                total,
                pagination: {
                    total,
                    page: pageNumber,
                    limit: limitNumber,
                    totalPages: Math.ceil(total / limitNumber),
                }
            }
        });
    } catch (error) {
        return res.status(500).json({
            error: "Server Error",
            message: error.message
        });
    }
};

export const sendDeliveryTestResult = async (req, res) => {
    try {

        if (req.user.role !== "ADMIN" && req.user.role !== "QUALITY") {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied: You do not have permission to perform this request.'
            });
        }

        const { categoryKgs, batches } = req.body;

        if (!Array.isArray(batches) || batches.length === 0) {
            return res.status(400).json({
                error: "Invalid or missing batches array",
                message: "Batches should be an array of objects"
            });
        }

        const results = [];

        for (const batch of batches) {
            const {
                id,
                transferId,
                labMoisture,
                screen,
                defect,
                ppScore,
                sampleStorageId,
                notes,
            } = batch;

            if (!transferId) {
                return res.status(400).json({
                    error: "Missing required field: transferId",
                    message: "Each batch must have a transferId"
                });
            }


            const updatedQuality = await sendDeliveryTestResultService({
                id,
                transferId,
                labMoisture,
                screen,
                defect,
                ppScore,
                sampleStorageId,
                notes,
                categoryKgs
            });

            results.push({
                updatedQuality,
            });
        }

        return res.status(200).json({
            message: "Test results updated successfully",
            data: results,
        });
    } catch (error) {
        console.error("Error in sending Delivery Test Result:", error.message);
        res.status(500).json({
            error: "Error in sending Delivery Test Result",
            details: error.message
        });
    }
};

export const DeliveryReportController = async (req, res) => {

    if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "SUPERVISOR" && req.user.role !== "MD" && req.user.role !== "FINANCE" && req.user.role !== "OPERATIONS" && req.user.role !== "QUALITY") {
        return res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to Perform this Request ' });
    }

    try {

        const { total, grandTotals, report } = await DeliveryReportService();

        return res.json({
            message: "Delivery Testing Retrieved successfully",
            data: {
                total: total,
                grandTotals,
                report: report,
            },
        });
    } catch (error) {
        res.status(400).json({ message: error.message, error: "Error in Delivery Report" });
    }
}
export const SaveAllHighGradeToqualityDelivery = async (req, res) => {
    try {
        const result = await SaveAllHighGradeBatchesToQualityDelivery();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
export const createMissingQualityDelivery = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "SUPERVISOR" && req.user.role !== "MD" && req.user.role !== "OPERATIONS" && req.user.role !== "QUALITY") {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied: You do not have permission to perform this request'
            });
        }

        const result = await createMissingQualityDeliveryRecords();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in createMissingQualityDelivery controller:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
