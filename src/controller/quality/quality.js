import { getAllBatchesInTestingService, getBatchesInTestingBycwsService, sendBatchToTestService, sendTestResultService, createQualityForAllBaggingOff, createMissingQualityForBaggingOff } from '../../services/quality/quality.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendBatchToTest = async (req, res) => {
    try {
        const { batches } = req.body;


        if (req.user.role !== "CWS_MANAGER") {
            return res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to Perform this Request Unless You have CWS role' });
        }

        if (!Array.isArray(batches) || batches.length === 0) {
            return res.status(400).json({ error: "Invalid or missing batches array", message: "Batches should be an array of objects" });
        }


        const results = [];

        for (const batch of batches) {
            const { batchNo, cwsMoisture1 } = batch;

            if (!batchNo || !cwsMoisture1) {
                return res.status(400).json({ error: "Missing required fields in batch object", message: "Each batch must have a batchNo and cwsMoisture1" });
            }
            const existingQuality = await prisma.quality.findFirst({
                where: {
                    batchNo,
                },
            });

            if (existingQuality) {
                return res.status(400).json({ error: "Batch already exists in the quality table", message: `Batch ${batchNo} already exists in the quality table` });
            }

            const baggoff = await prisma.baggingOff.findFirst({
                where: {
                    batchNo,
                    status: 'COMPLETED',
                    processing: {
                        grade: 'A',
                    }
                },
                include: {
                    processing: {
                        select: {
                            id: true,
                            processingType: true,
                            cwsId: true,
                        }
                    }
                },
            });

            if (!baggoff) {
                return res.status(404).json({ error: `BaggOff not found for batchNo: ${batchNo} `, message: `No Grade A baggoff found for batchNo: ${batchNo} That is COMPLETED` });
            }


            const { id: baggOffId } = baggoff;
            const { processingType, cwsId, id: processingId } = baggoff.processing;



            const quality = await sendBatchToTestService({
                batchNo,
                cwsId,
                baggOffId,
                processingId,
                cwsMoisture1,
                processingType
            });

            results.push(quality);
        }

        return res.status(201).json({
            message: "Batches sent to testing successfully",
            data: results,
        });
    } catch (error) {
        console.error("Error in sendBatchToTest:", error.message);
        res.status(500).json({ error: "Internal server error", message: error.message });
    }
};

export const getAllBatchesInTesting = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;


        if (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN" && req.user.role !== "SUPERVISOR" && req.user.role !== "MD" && req.user.role !== "FINANCE" && req.user.role !== "OPERATIONS" && req.user.role !== "QUALITY") {
            return res.status(403).json({ error: 'Forbidden ', message: 'Access denied: You do not have permission to Perform this Request ' });
        }

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ error: "Invalid pagination parameters" });
        }


        const { batches, total } = await getAllBatchesInTestingService(pageNumber, limitNumber);

        return res.status(200).json({
            message: "Batches in testing retrieved successfully",
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
        console.error("Error in getAllBatchesInTesting:", error.message);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};

export const getBatchesInTestingBycws = async (req, res) => {
    const { cwsId } = req.params;
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    try {
        const offset = (parseInt(page) - 1) * parseInt(limit);


        const { batches, total } = await getBatchesInTestingBycwsService(user, cwsId, offset, parseInt(limit));

        return res.json({
            message: "cws Batches in testing retrieved successfully",
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
        res.status(400).json({ error: error.message });
    }
};

export const sendTestResult = async (req, res) => {
    try {
        const { user } = req.user;

        if (req.user.role !== "ADMIN" && req.user.role !== "QUALITY") {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied: You do not have permission to perform this request'
            });
        }


        const { batches } = req.body;

        if (!Array.isArray(batches) || batches.length === 0) {
            return res.status(400).json({
                error: "Invalid or missing batches array",
                message: "Batches should be an array of objects"
            });
        }

        const results = [];

        for (const batch of batches) {
            const {
                batchNo,
                cwsMoisture1,
                labMoisture,
                screen,
                defect,
                ppScore,
                sampleStorageId_0,
                sampleStorageId_1,
                notes,
            } = batch;

            if (!batchNo) {
                return res.status(400).json({
                    error: "Missing required field: batchNo",
                    message: "Each batch must have a batchNo"
                });
            }

            const baggoff = await prisma.baggingOff.findFirst({
                where: {
                    batchNo,
                    // status: 'COMPLETED',
                    processing: {
                        grade: 'A',
                    }
                },
                include: {
                    processing: {
                        select: {
                            id: true,
                            processingType: true,
                            cwsId: true,
                        }
                    }
                },
            });

            if (!baggoff) {
                return res.status(404).json({
                    error: `BaggOff not found for batchNo: ${batchNo}`,
                    message: `No Grade A baggoff found for batchNo: ${batchNo} that is COMPLETED`
                });
            }

            const { processingType, cwsId } = baggoff.processing;

            const updatedQuality = await sendTestResultService({
                batchNo,
                cwsId,
                baggOffId: baggoff.id,
                processingType,
                cwsMoisture1,
                labMoisture,
                screen,
                defect,
                ppScore,
                sampleStorageId_0,
                sampleStorageId_1,
                notes
            });

            results.push({
                batchNo,
                updatedQuality,
            });
        }

        return res.status(200).json({
            message: "Test results updated successfully",
            data: results,
        });
    } catch (error) {
        console.error("Error in sendTestResult:", error.message);
        res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
};

export const createQualityForAllBaggingOffController = async (req, res) => {
    try {

        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied: You do not have permission to perform this operation'
            });
        }

        const result = await createQualityForAllBaggingOff();

        return res.status(201).json({
            success: true,
            message: result.message,
            data: {
                created: result.created,
                createdQualities: result.createdQualities,
                errors: result.errors
            }
        });

    } catch (error) {
        console.error("Error in createQualityForAllBaggingOffController:", error.message);
        res.status(500).json({
            error: "Internal server error",
            message: error.message,
            details: error.stack
        });
    }
};

export const createMissingQualityForBaggingOffController = async (req, res) => {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied: You do not have permission to perform this operation'
            });
        }
        const result = await createMissingQualityForBaggingOff();
        return res.status(201).json({
            success: true,
            message: result.message,
            data: {
                created: result.created,
                createdQualities: result.createdQualities,
                errors: result.errors
            }
        });
    } catch (error) {
        console.error("Error in createMissingQualityForBaggingOffController:", error.message);
        res.status(500).json({
            error: "Internal server error",
            message: error.message,
            details: error.stack
        });
    }
};
