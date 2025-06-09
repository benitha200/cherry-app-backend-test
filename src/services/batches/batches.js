import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// get Completed BaggingOff of High grade (A)  batches for specific CWS manager
export const getGradeABatches = async (cwsId, offset, limit) => {
    const [total, batches] = await Promise.all([
        prisma.baggingOff.findMany({
            where: {
                status: 'COMPLETED',
                qualityStatus: 'PENDING',
                processing: {
                    cwsId: parseInt(cwsId),
                    grade: 'A',
                }
            },
            distinct: ['batchNo'],
        }),
        prisma.baggingOff.findMany({
            where: {
                status: 'COMPLETED',
                qualityStatus: 'PENDING',
                processing: {
                    cwsId: parseInt(cwsId),
                    grade: 'A',
                },
            },
            include: {
                processing: {
                    include: {
                        cws: true,
                    },
                },
            },
            orderBy: [
                { batchNo: 'asc' },
                { createdAt: 'desc' }
            ],
            distinct: ['batchNo'],
            skip: offset,
            take: limit
        })
    ]);

    return { total: total.length, batches };
};

// get Completed High Grade Tranfers  batches for specific CWS manager
export const getHighGradeTransfers = async (cwsId, offset, limit) => {
    const [total, batches] = await Promise.all([
        prisma.transfer.findMany({
            where: {
                baggingOff: {
                    processing: {
                        cwsId: parseInt(cwsId),
                    }
                },
                gradeGroup: 'HIGH',
                status: 'COMPLETED'
            },
            distinct: ['batchNo', 'baggingOffId'],

        }),
        prisma.transfer.findMany({
            where: {
                baggingOff: {
                    processing: {
                        cwsId: parseInt(cwsId),
                    }
                },
                gradeGroup: 'HIGH',
                status: 'COMPLETED'
            },
            include: {
                baggingOff: {
                    include: {
                        processing: true,
                    },
                },
            },
            orderBy: [
                { batchNo: 'asc' },
                { createdAt: 'desc' }
            ],
            skip: offset,
            take: limit
        })
    ]);

    const groupedBatches = Object.values(
        batches.reduce((acc, batch) => {
            const baggingOffId = batch.baggingOffId;
            if (!acc[baggingOffId]) {
                acc[baggingOffId] = {
                    id: batch.id,
                    batchNo: batch.batchNo,
                    baggingOffId: batch.baggingOffId,
                    gradeGroup: batch.gradeGroup,
                    outputKgs: { ...batch.outputKgs },
                    gradeDetails: { ...batch.gradeDetails },
                    truckNumber: batch.truckNumber,
                    driverName: batch.driverName,
                    driverPhone: batch.driverPhone,
                    transferMode: batch.transferMode,
                    transferDate: batch.transferDate,
                    status: batch.status,
                    notes: batch.notes,
                    isGrouped: batch.isGrouped,
                    groupBatchNo: batch.groupBatchNo,
                    createdAt: batch.createdAt,
                    updatedAt: batch.updatedAt,
                    baggingOff: {
                        id: batch.baggingOff.id,
                        batchNo: batch.baggingOff.batchNo,
                        processingId: batch.baggingOff.processingId,
                        date: batch.baggingOff.date,
                        outputKgs: { ...batch.baggingOff.outputKgs },
                        totalOutputKgs: batch.baggingOff.totalOutputKgs,
                        processingType: batch.baggingOff.processingType,
                        processing: {
                            id: batch.baggingOff.processing.id,
                            batchNo: batch.baggingOff.processing.batchNo,
                            processingType: batch.baggingOff.processing.processingType,
                            totalKgs: batch.baggingOff.processing.totalKgs,
                            grade: batch.baggingOff.processing.grade,
                        }
                    }
                };
            } else {
                Object.entries(batch.outputKgs).forEach(([key, value]) => {
                    acc[baggingOffId].outputKgs[key] = (acc[baggingOffId].outputKgs[key] || 0) + value;
                });

                Object.entries(batch.gradeDetails).forEach(([key, value]) => {
                    acc[baggingOffId].gradeDetails[key] = acc[baggingOffId].gradeDetails[key] || value;
                });
            }
            return acc;
        }, {})
    );

    return { total: total.length, batches: groupedBatches };
};