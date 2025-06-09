import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

export const sendBatchToTestService = async ({ batchNo, cwsId, baggOffId, processingId, processingType }) => {
    let keys;
    if (processingType === "NATURAL") {
        keys = ["N1"];
    } else if (processingType === "HONEY") {
        keys = ["H1"];
    } else {
        keys = ["A0", "A1"]; // Default to FULLY_WASHED
    }

    const existingQuality = await prisma.quality.findFirst({
        where: {
            batchNo,
            cwsId,
            processingId,
        },
        include: {
            baggingOff: {
                select: {
                    status: true,
                }
            }
        }
    });

    // console.log("Existing Quality Record:", existingQuality);
    if (existingQuality) {
        return existingQuality;
    }


    const cwsMoisture1 = {};
    const labMoisture = {};
    const screen = {};
    const defect = {};
    const ppScore = {};
    const notes = {};
    const category = {};
    keys.forEach(key => {
        cwsMoisture1[key] = "";
        labMoisture[key] = "";
        screen[key] = { "16+": "", "15": "", "14": "", "13": "", "B/12": "" };
        defect[key] = "";
        ppScore[key] = "";
        notes[key] = "";
        category[key] = "";
    });

    const data = {
        batchNo,
        status: "PENDING",
        cwsMoisture1,
        labMoisture,
        screen,
        defect,
        ppScore,
        notes,
        category,
        cws: { connect: { id: cwsId } },
        processing: { connect: { id: processingId } },
        baggingOff: { connect: { id: baggOffId } },
        sampleStorage_0: { connect: { id: 2 } },
        sampleStorage_1: { connect: { id: 2 } },
    };


    const quality = await prisma.quality.create({ data });

    await prisma.baggingOff.updateMany({
        where: { batchNo },
        data: { qualityStatus: "TESTING" },
    });

    return quality;
};

export const getAllBatchesInTestingService = async (page, limit) => {
    const skip = (page - 1) * limit;

    const [total, batches] = await Promise.all([
        prisma.quality.count({
            // where: {
            //     NOT: {
            //         status: 'COMPLETED'
            //     }
            // },
        }),

        prisma.quality.findMany({
            skip,
            take: limit,
            // where: {
            //     NOT: {
            //         status: 'COMPLETED'
            //     }
            // },
            include: {
                sampleStorage_0: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                sampleStorage_1: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                cws: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true,
                    },
                },
                processing: {
                    select: {
                        id: true,
                        batchNo: true,
                        processingType: true,
                        grade: true,
                        status: true,
                    },
                },
                baggingOff: {
                    select: {
                        id: true,
                        batchNo: true,
                        date: true,
                        outputKgs: true,
                        totalOutputKgs: true,
                        processingType: true,
                        status: true,
                        notes: true,
                        qualityStatus: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
        })
    ]);

    const groupedBatches = batches.map((batch) => {
        const processingType = batch.processing?.processingType || "FULLY_WASHED";
        let keys;
        if (processingType === "NATURAL") {
            keys = ["N1"];
        } else if (processingType === "HONEY") {
            keys = ["H1"];
        } else {
            keys = ["A0", "A1"];
        }

        const result = {
            id: batch.id,
            batchNo: batch.batchNo,
            cwsId: batch.cwsId,
            processingId: batch.processingId,
            status: batch.status,
            cws: batch.cws,
            processing: batch.processing,
            baggingOff: batch.baggingOff,
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt,
        };
        keys.forEach((key, idx) => {
            result[key] = {
                cwsMoisture1: batch.cwsMoisture1?.[key] || "",
                labMoisture: batch.labMoisture?.[key] || "",
                screen: batch.screen?.[key] || {},
                defect: batch.defect?.[key] || "",
                ppScore: batch.ppScore?.[key] || "",
                notes: batch.notes?.[key] || "",
                category: batch.category?.[key] || "",
                ...(idx === 0 ? { sampleStorage_0: batch.sampleStorage_0 || null } : { sampleStorage_1: batch.sampleStorage_1 || null })
            };
        });
        return result;
    });

    // Sort: not completed (status !== 'COMPLETED') first, then the rest
    groupedBatches.sort((a, b) => {
        const aCompleted = a.status === 'COMPLETED';
        const bCompleted = b.status === 'COMPLETED';
        if (aCompleted === bCompleted) return 0;
        return aCompleted ? 1 : -1;
    });
    return { batches: groupedBatches, total };
};

export const getBatchesInTestingBycwsService = async (user, cwsId, offset, limit) => {
    if (user.cwsId !== parseInt(cwsId)) {
        throw new Error('Access denied: You do not have permission to access this CWS.');
    }

    const [total, batches] = await Promise.all([
        prisma.quality.count({
            where: {
                cwsId: parseInt(cwsId),
                // NOT: {
                //     status: 'COMPLETED'
                // }
            }
        }),
        prisma.quality.findMany({
            where: {
                cwsId: parseInt(cwsId),
                // NOT: {
                //     status: 'COMPLETED'
                // }
            },
            include: {
                sampleStorage_0: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                sampleStorage_1: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                cws: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true,
                    },
                },
                processing: {
                    select: {
                        id: true,
                        batchNo: true,
                        processingType: true,
                        grade: true,
                        status: true,
                    },
                },
                baggingOff: {
                    select: {
                        id: true,
                        batchNo: true,
                        date: true,
                        outputKgs: true,
                        totalOutputKgs: true,
                        processingType: true,
                        status: true,
                        notes: true,
                        qualityStatus: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: offset,
            take: limit,
        })
    ]);

    const groupedBatches = batches.map((batch) => {
        const processingType = batch.processing?.processingType || "FULLY_WASHED";
        let keys;
        if (processingType === "NATURAL") {
            keys = ["N1"];
        } else if (processingType === "HONEY") {
            keys = ["H1"];
        } else {
            keys = ["A0", "A1"];
        }

        const result = {
            id: batch.id,
            batchNo: batch.batchNo,
            cwsId: batch.cwsId,
            processingId: batch.processingId,
            status: batch.status,
            cws: batch.cws,
            processing: batch.processing,
            baggingOff: batch.baggingOff,
            createdAt: batch.createdAt,
            updatedAt: batch.updatedAt,
        };
        keys.forEach((key, idx) => {
            result[key] = {
                cwsMoisture1: batch.cwsMoisture1?.[key] || "",
                labMoisture: batch.labMoisture?.[key] || "",
                screen: batch.screen?.[key] || {},
                defect: batch.defect?.[key] || "",
                ppScore: batch.ppScore?.[key] || "",
                notes: batch.notes?.[key] || "",
                category: batch.category?.[key] || "",
                ...(idx === 0 ? { sampleStorage_0: batch.sampleStorage_0 || null } : { sampleStorage_1: batch.sampleStorage_1 || null })
            };
        });
        return result;
    });

    // Sort: not completed (status !== 'COMPLETED') first, then the rest
    groupedBatches.sort((a, b) => {
        const aCompleted = a.status === 'COMPLETED';
        const bCompleted = b.status === 'COMPLETED';
        if (aCompleted === bCompleted) return 0;
        return aCompleted ? 1 : -1;
    });

    return { batches: groupedBatches, total };

};

export const sendTestResultService = async ({
    batchNo,
    cwsId,
    baggOffId,
    processingType,
    cwsMoisture1,
    labMoisture,
    screen,
    defect,
    ppScore,
    notes,
    sampleStorageId_0,
    sampleStorageId_1,
}) => {
    const quality = await prisma.quality.findFirst({
        where: {
            batchNo: batchNo,
            cwsId: cwsId,
        },
    });

    if (!quality) {
        throw new Error("Quality record not found");
    }

    let keys;
    if (processingType === "NATURAL") {
        keys = ["N1"];
    } else if (processingType === "HONEY") {
        keys = ["H1"];
    } else {
        keys = ["A0", "A1"];
    }

    const deepMerge = (target = {}, source = {}) => {
        const result = { ...target };
        for (const key in source) {
            const sourceValue = source[key];
            const targetValue = target?.[key];
            if (
                sourceValue &&
                typeof sourceValue === 'object' &&
                !Array.isArray(sourceValue)
            ) {
                result[key] = deepMerge(targetValue, sourceValue);
            } else if (sourceValue !== "") {
                result[key] = sourceValue;
            }
        }
        return result;
    };

    const mergedCwsMoisture = {};
    const mergedLabMoisture = {};
    const mergedScreen = {};
    const mergedDefect = {};
    const mergedPpScore = {};
    const mergedNotes = {};
    const mergedCategory = {};

    const calculateCategory = (score) => {
        if (score < 20) return "-";
        if (score < 84) return "C2";
        if (score < 86) return "C1";
        if (score < 87) return "S86";
        if (score < 88) return "S87";
        return "S88";
    };

    keys.forEach((key) => {
        mergedCwsMoisture[key] = cwsMoisture1?.[key] || quality.cwsMoisture1?.[key] || "";
        mergedLabMoisture[key] = labMoisture?.[key] || quality.labMoisture?.[key] || "";
        mergedScreen[key] = deepMerge(quality.screen?.[key], screen?.[key]);
        mergedDefect[key] = defect?.[key] || quality.defect?.[key] || "";
        mergedPpScore[key] = ppScore?.[key] || quality.ppScore?.[key] || "";
        mergedNotes[key] = notes?.[key] || quality.notes?.[key] || "";
        mergedCategory[key] = calculateCategory(
            (ppScore?.[key] || quality.ppScore?.[key] || 0)
        );
    });

    const isCompleted =
        keys.every(key => mergedLabMoisture[key] !== "") &&
        keys.every(key => Object.values(mergedScreen[key] || {}).every(value => value !== "")) &&
        keys.every(key => mergedDefect[key] !== "") &&
        keys.every(key => mergedPpScore[key] !== "");

    const status = isCompleted ? "COMPLETED" : "TESTED";

    const updatedQuality = await prisma.quality.update({
        where: {
            id: quality.id,
        },
        data: {
            status: status,
            cwsMoisture1: mergedCwsMoisture,
            labMoisture: mergedLabMoisture,
            screen: mergedScreen,
            defect: mergedDefect,
            ppScore: mergedPpScore,
            notes: mergedNotes,
            sampleStorageId_0: sampleStorageId_0 ? parseInt(sampleStorageId_0, 10) : quality.sampleStorageId_0,
            sampleStorageId_1: sampleStorageId_1 ? parseInt(sampleStorageId_1, 10) : quality.sampleStorageId_1,
            category: mergedCategory,
        },
    });
    await prisma.baggingOff.update({
        where: {
            id: baggOffId,
            batchNo: batchNo,
        },
        data: {
            qualityStatus: "TESTED",
        },
    });

    return updatedQuality;
};

export const createQualityForAllBaggingOff = async () => {
    try {

        const latestBaggingOffRecords = await prisma.$queryRaw`
            SELECT 
                bo1.id,
                bo1.batchNo,
                bo1.outputKgs,
                bo1.totalOutputKgs,
                bo1.processingId,
                bo1.createdAt,
                bo1.updatedAt,
                (SELECT COUNT(*) FROM baggingOff bo3 WHERE bo3.batchNo = bo1.batchNo) AS occurrence_count
            FROM baggingOff bo1
            WHERE bo1.id = (
                SELECT bo2.id
                FROM baggingOff bo2
                WHERE bo2.batchNo = bo1.batchNo
                ORDER BY bo2.createdAt DESC
                LIMIT 1
            )
            ORDER BY bo1.batchNo
        `;


        const processingIds = latestBaggingOffRecords.map(record => record.processingId);
        const processingData = await prisma.processing.findMany({
            where: {
                id: { in: processingIds }
            },
            select: {
                id: true,
                processingType: true,
                cwsId: true
            }
        });


        const processingMap = processingData.reduce((map, processing) => {
            map[processing.id] = processing;
            return map;
        }, {});

        const createdQualities = [];
        const errors = [];

        for (const baggingOff of latestBaggingOffRecords) {
            try {
                const { id: baggOffId, batchNo, processingId } = baggingOff;
                const processing = processingMap[processingId];

                if (!processing) {
                    errors.push({
                        batchNo,
                        error: `Processing data not found for processingId: ${processingId}`
                    });
                    continue;
                }

                const { processingType, cwsId } = processing;


                const existingQuality = await prisma.quality.findFirst({
                    where: {
                        batchNo,
                        cwsId,
                        processingId,
                    },
                    include: {
                        baggingOff: {
                            select: {
                                status: true,
                            }
                        }
                    }
                });

                if (existingQuality && existingQuality.baggingOff.status === "COMPLETED") {
                    continue;
                }


                if (existingQuality) {
                    continue;
                }

                let keys;
                if (processingType === "NATURAL") {
                    keys = ["N1"];
                } else if (processingType === "HONEY") {
                    keys = ["H1"];
                } else {
                    keys = ["A0", "A1"]; // Default to FULLY_WASHED
                }

                const cwsMoisture1 = {};
                const labMoisture = {};
                const screen = {};
                const defect = {};
                const ppScore = {};
                const notes = {};
                const category = {};

                keys.forEach(key => {
                    cwsMoisture1[key] = "";
                    labMoisture[key] = "";
                    screen[key] = { "16+": "", "15": "", "14": "", "13": "", "B/12": "" };
                    defect[key] = "";
                    ppScore[key] = "";
                    notes[key] = "";
                    category[key] = "";
                });


                const qualityData = {
                    batchNo,
                    status: "PENDING",
                    cwsMoisture1,
                    labMoisture,
                    screen,
                    defect,
                    ppScore,
                    notes,
                    category,
                    cws: { connect: { id: cwsId } },
                    processing: { connect: { id: processingId } },
                    baggingOff: { connect: { id: baggOffId } },
                    sampleStorage_0: { connect: { id: 2 } },
                    sampleStorage_1: { connect: { id: 2 } },
                };

                const quality = await prisma.quality.create({ data: qualityData });


                await prisma.baggingOff.update({
                    where: { id: baggOffId },
                    data: { qualityStatus: "TESTING" },
                });

                createdQualities.push({
                    qualityId: quality.id,
                    batchNo,
                    cwsId,
                    processingId,
                    processingType,
                    occurrence_count: Number(baggingOff.occurrence_count) // Convert BigInt to Number
                });

            } catch (error) {
                errors.push({
                    batchNo: baggingOff.batchNo,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            created: createdQualities.length,
            createdQualities,
            errors: errors.length > 0 ? errors : null,
            message: `Successfully created ${createdQualities.length} quality records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
        };

    } catch (error) {
        console.error('Error creating quality records for all baggingOff:', error);
        throw new Error('Failed to create quality records: ' + error.message);
    } finally {
        await prisma.$disconnect();
    }
};


export const createMissingQualityForBaggingOff = async () => {
    try {

        const missingBaggingOffs = await prisma.$queryRaw`
            SELECT bo.*
            FROM baggingOff bo
            LEFT JOIN quality q ON bo.batchNo = q.batchNo
            WHERE q.batchNo IS NULL
        `;

        const processingIds = missingBaggingOffs.map(record => record.processingId);
        const processingData = await prisma.processing.findMany({
            where: { id: { in: processingIds } },
            select: { id: true, processingType: true, cwsId: true }
        });
        const processingMap = processingData.reduce((map, processing) => {
            map[processing.id] = processing;
            return map;
        }, {});

        const createdQualities = [];
        const errors = [];

        for (const baggingOff of missingBaggingOffs) {
            try {
                const { id: baggOffId, batchNo, processingId } = baggingOff;
                const processing = processingMap[processingId];
                if (!processing) {
                    errors.push({ batchNo, error: `Processing data not found for processingId: ${processingId}` });
                    continue;
                }
                const { processingType, cwsId } = processing;
                let keys;
                if (processingType === "NATURAL") {
                    keys = ["N1"];
                } else if (processingType === "HONEY") {
                    keys = ["H1"];
                } else {
                    keys = ["A0", "A1"];
                }
                const cwsMoisture1 = {};
                const labMoisture = {};
                const screen = {};
                const defect = {};
                const ppScore = {};
                const notes = {};
                const category = {};
                keys.forEach(key => {
                    cwsMoisture1[key] = "";
                    labMoisture[key] = "";
                    screen[key] = { "16+": "", "15": "", "14": "", "13": "", "B/12": "" };
                    defect[key] = "";
                    ppScore[key] = "";
                    notes[key] = "";
                    category[key] = "";
                });
                const qualityData = {
                    batchNo,
                    status: "PENDING",
                    cwsMoisture1,
                    labMoisture,
                    screen,
                    defect,
                    ppScore,
                    notes,
                    category,
                    cws: { connect: { id: cwsId } },
                    processing: { connect: { id: processingId } },
                    baggingOff: { connect: { id: baggOffId } },
                    sampleStorage_0: { connect: { id: 2 } },
                    sampleStorage_1: { connect: { id: 2 } },
                };
                const quality = await prisma.quality.create({ data: qualityData });
                await prisma.baggingOff.update({ where: { id: baggOffId }, data: { qualityStatus: "TESTING" } });
                createdQualities.push({ qualityId: quality.id, batchNo, cwsId, processingId, processingType });
            } catch (error) {
                errors.push({ batchNo: baggingOff.batchNo, error: error.message });
            }
        }
        return {
            success: true,
            created: createdQualities.length,
            createdQualities,
            errors: errors.length > 0 ? errors : null,
            message: `Successfully created ${createdQualities.length} missing quality records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
        };
    } catch (error) {
        console.error('Error creating missing quality records for baggingOff:', error);
        throw new Error('Failed to create missing quality records: ' + error.message);
    }
};


