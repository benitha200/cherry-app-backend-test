import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
// import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

export const sendBatchToDeliveryTestService = async ({
    transferId,
    batchNo,
    cwsId,
    baggOffId,
    processingId,
    cwsMoisture,
    category,
    gradeKey
}) => {

    // console.log("data to be sent to delivery test", {
    //     transferId,
    //     // qualitysampleId,
    //     batchNo,
    //     cwsId,
    //     baggOffId,
    //     processingId,
    //     cwsMoisture,
    //     category,
    //     gradeKey
    // });

    const qualitysample = await prisma.quality.findFirst({
        where: {
            OR: [
                { baggingOffId: baggOffId },
                { batchNo: { startsWith: batchNo } },
                { batchNo: batchNo }
            ]
        }
    })
    const quality = await prisma.qualityDelivery.create({
        data: {
            batchNo,
            status: "TESTING",
            cwsMoisture,
            gradeKey,
            labMoisture: 0,
            screen: {
                "16+": "",
                "15": "",
                "14": "",
                "13": "",
                "B/12": ""
            },
            defect: 0,
            ppScore: 0,
            notes: "",
            category: category,
            newCategory: "-",
            categoryKgs: {
                "c2": 0,
                "c1": 0,
                "s86": 0,
                "s87": 0,
                "s88": 0,
                "A2": 0,
                "A3": 0,
                "B1": 0,
                "B2": 0,
                "N2": 0,
            },
            transfer: {
                connect: { id: transferId }
            },
            quality: {
                connect: { id: qualitysample.id }
            },
            cws: {
                connect: { id: cwsId }
            },
            processing: {
                connect: { id: processingId }
            },
            baggingOff: {
                connect: { id: baggOffId }
            },
            sampleStorage: {
                connect: { id: 2 }
            },
        }
    });


    return quality;
};

export const getAllBatchesInDeliveryService = async () => {
    const allRecords = await prisma.qualityDelivery.findMany({
        include: {
            sampleStorage: { select: { id: true, name: true, description: true } },
            transfer: {
                select: {
                    id: true,
                    batchNo: true,
                    outputKgs: true,
                    gradeDetails: true,
                    truckNumber: true,
                    driverName: true,
                    driverPhone: true
                }
            },
            quality: {
                select: {
                    id: true,
                    cwsMoisture1: true,
                    labMoisture: true,
                    screen: true,
                    defect: true,
                    ppScore: true,
                    category: true
                }
            },
            baggingOff: {
                select: {
                    id: true,
                    batchNo: true,
                    date: true,
                    outputKgs: true,
                    totalOutputKgs: true,
                    processingType: true
                }
            },
            processing: {
                select: {
                    id: true,
                    batchNo: true,
                    processingType: true,
                    grade: true,
                    status: true
                }
            },
            cws: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    location: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const truckGroups = {};

    for (const record of allRecords) {
        const truckNumber = record.transfer?.truckNumber || 'UNKNOWN';

        if (!truckGroups[truckNumber]) {
            truckGroups[truckNumber] = [];
        }
        truckGroups[truckNumber].push(record);
    }

    const structuredByTruck = {};

    for (const [truckNumber, records] of Object.entries(truckGroups)) {
        const groupedMap = new Map();

        for (const record of records) {
            const key = `${record.batchNo} - ${record.processingId} - ${record.baggingOffId}`;

            if (!groupedMap.has(key)) {
                groupedMap.set(key, []);
            }

            groupedMap.get(key).push(record);
        }

        const groupedAndFlattened = Array.from(groupedMap.values()).map(group => {
            const [first] = group;
            const sharedFields = {
                batchNo: first.batchNo,
                baggingOff: first.baggingOff,
                processing: first.processing,
                cws: first.cws
            };

            for (const item of group) {
                sharedFields[item.gradeKey] = {
                    id: item.id,
                    qualityId: item.qualityId,
                    transferId: item.transferId,
                    processingId: item.processingId,
                    transfer: {
                        id: item.transfer.id,
                        outputKgs: item.transfer.outputKgs,
                        truckNumber: item.transfer.truckNumber,
                        driverName: item.transfer.driverName,
                        driverPhone: item.transfer.driverPhone
                    },
                    cwsMoisture: item.cwsMoisture,
                    labMoisture: item.labMoisture,
                    screen: item.screen,
                    defect: item.defect,
                    ppScore: item.ppScore,
                    category: item.category,
                    notes: item.notes,
                    sampleStorage: item.sampleStorage,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                };
            }

            return sharedFields;
        });

        structuredByTruck[truckNumber] = groupedAndFlattened;
    }

    return {
        total: Object.keys(structuredByTruck).length,
        batches: structuredByTruck
    };
};

export const getGroupedTruckDeliveryDetails = async () => {

    const [allRecords, lowGrades] = await Promise.all([

        prisma.qualityDelivery.findMany({
            where: {
                NOT: {
                    status: 'COMPLETED'
                },
                // batchNo:'25NYG0106'

                // transfer: {
                //     transportGroupId: 'TG-1748895726081-319'
                // }
            },
            include: {
                transfer: {
                    select: {
                        id: true,
                        truckNumber: true,
                        transferDate: true,
                        driverName: true,
                        driverPhone: true,
                        numberOfBags: true,
                        outputKgs: true,
                        transportGroupId: true,

                    }
                },
                cws: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }

        }),
        prisma.transfer.findMany({
            where: {
                gradeGroup: 'LOW'
            },
            select: {
                batchNo: true,
                outputKgs: true,
                truckNumber: true,
                transferDate: true,
                transportGroupId: true,
                baggingOff: {
                    select: {
                        processing: true
                    }
                }
            }
        })

    ])



    // console.log("lowGrades", lowGrades);
    // console.log("allGrades:", allRecords)

    const groupedTrucks = new Map();

    for (const record of allRecords) {
        const transfer = record.transfer;
        if (!transfer || !transfer.truckNumber) continue;

        const transferDate = transfer.transferDate ?
            new Date(transfer.transferDate).toISOString().replace('T', ' ').slice(0, 10) :
            'unknown';

        // console.log("transferDate", transferDate);
        const key = `${transfer.truckNumber} - ${transferDate}`;

        const existing = groupedTrucks.get(key);

        // console.log("existing", existing);

        if (!existing) {
            groupedTrucks.set(key, {
                truckNumber: transfer.truckNumber,
                transferDate: transferDate,
                transferGroupId: transfer.transportGroupId,
                driverName: transfer.driverName,
                driverPhone: transfer.driverPhone,
                numberOfBags: transfer.numberOfBags || 0,
                outputKgs: { ...transfer.outputKgs },
                cws: record.cws.name,
                processingId: record.processingId,
            });
        } else {
            existing.numberOfBags += transfer.numberOfBags || 0;

            for (const [grade, value] of Object.entries(transfer.outputKgs || {})) {
                const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;
                if (existing.outputKgs[grade]) {
                    existing.outputKgs[grade] += numericValue;
                } else {
                    existing.outputKgs[grade] = numericValue;
                }
            }
        }
    }

    for (const lowGrade of lowGrades) {
        const transferDate = lowGrade.transferDate ?
            new Date(lowGrade.transferDate).toISOString().replace('T', ' ').slice(0, 10) :
            'unknown';

        const key = `${lowGrade.truckNumber} - ${transferDate}`;
        const existing = groupedTrucks.get(key);

        if (existing && existing.processingId === lowGrade.baggingOff.processing.id) {

            for (const [grade, value] of Object.entries(lowGrade.outputKgs || {})) {
                const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;
                if (existing.outputKgs[grade]) {
                    existing.outputKgs[grade] += numericValue;
                } else {
                    existing.outputKgs[grade] = numericValue;
                }
            }
        }
    }

    const truckList = Array.from(groupedTrucks.values()).map(truck => {
        return truck;
    });

    // console.log("truckList", truckList);

    return {
        total: truckList.length,
        trucks: truckList
    };
};
export const getBatchesByTruckDeliveryService = async (offset, limit, truckNumber, transferDate, transportGroupId) => {
    // const parsedDate = transferDate ? new Date(transferDate.replace(' ', 'T') + ':00Z') : null;

    // const startDate = parsedDate ? new Date(parsedDate.getTime() - (30 * 60 * 1000)) : null;
    // const endDate = parsedDate ? new Date(parsedDate.getTime() + (30 * 60 * 1000)) : null;

    let dateFilter = {};
    if (transferDate) {
        dateFilter = {
            gte: new Date(`${transferDate}T00:00:00.000Z`),
            lt: new Date(`${transferDate}T23:59:59.999Z`)
        };
    }
    const [total, allRecords, lowGrades] = await Promise.all([
        prisma.qualityDelivery.count({
            where: {
                transfer: {
                    truckNumber: truckNumber,
                    transportGroupId: transportGroupId,
                    // transferDate: dateFilter
                },
                NOT: {
                    status: 'COMPLETED'
                }
            },
        }),

        prisma.qualityDelivery.findMany({
            where: {
                transfer: {
                    truckNumber: truckNumber,
                    transportGroupId: transportGroupId,
                    // transferDate: dateFilter
                },
                NOT: {
                    status: 'COMPLETED'
                }
            },
            include: {
                sampleStorage: { select: { id: true, name: true, description: true } },
                transfer: {
                    select: {
                        id: true,
                        batchNo: true,
                        outputKgs: true,
                        gradeDetails: true,
                        truckNumber: true,
                        driverName: true,
                        driverPhone: true,
                        transferDate: true
                    }
                },
                quality: {
                    select: {
                        id: true,
                        cwsMoisture1: true,
                        labMoisture: true,
                        screen: true,
                        defect: true,
                        ppScore: true,
                        category: true
                    }
                },
                baggingOff: {
                    select: {
                        id: true,
                        batchNo: true,
                        date: true,
                        outputKgs: true,
                        totalOutputKgs: true,
                        processingType: true
                    }
                },
                processing: {
                    select: {
                        id: true,
                        batchNo: true,
                        processingType: true,
                        grade: true,
                        status: true
                    }
                },
                cws: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
        }),

        prisma.transfer.findMany({
            where: {
                truckNumber: truckNumber,
                transferDate: dateFilter,
                gradeGroup: "LOW",
            },
            select: {
                outputKgs: true,
                numberOfBags: true,
                baggingOff: {
                    select: {
                        batchNo: true,
                    }
                }
            }
        })

    ])


    const groupedMap = new Map();

    for (const record of allRecords) {
        const key = `${record.batchNo} - ${record.processingId}`;

        if (!groupedMap.has(key)) {
            groupedMap.set(key, []);
        }

        groupedMap.get(key).push(record);
    }


    const groupedAndFlattened = Array.from(groupedMap.values()).map(group => {
        const [first] = group;

        const sharedFields = {
            batchNo: first.baggingOff.batchNo,
            mainbatch: [],
            lowGrades: lowGrades,
            // baggingOff: first.baggingOff,
            processing: first.processing,
            cws: first.cws
        };

        for (const item of group) {
            sharedFields.mainbatch.push({
                id: item.id,
                gradeKey: item.gradeKey,
                qualityId: item.qualityId,
                transferId: item.transferId,
                processingId: item.processingId,
                transfer: {
                    id: item.transfer.id,
                    outputKgs: item.transfer.outputKgs,
                    truckNumber: item.transfer.truckNumber,
                    driverName: item.transfer.driverName,
                    driverPhone: item.transfer.driverPhone,
                    transferDate: item.transfer.transferDate ? new Date(item.transfer.transferDate).toISOString().replace('T', ' ').slice(0, 16) : null
                },
                baggingOff: {
                    id: item.baggingOff.id,
                    batchNo: item.baggingOff.batchNo,
                    date: item.baggingOff.date ? new Date(item.baggingOff.date).toISOString().replace('T', ' ').slice(0, 16) : null,
                    outputKgs: item.baggingOff.outputKgs,
                    totalOutputKgs: item.baggingOff.totalOutputKgs,
                    processingType: item.baggingOff.processingType
                },
                cwsMoisture: item.cwsMoisture,
                labMoisture: item.labMoisture,
                screen: item.screen,
                defect: item.defect,
                ppScore: item.ppScore,
                category: item.category,
                newCategory: item.newCategory,
                notes: item.notes,
                sampleStorage: item.sampleStorage,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            })

        }

        return sharedFields;
    });


    return {
        categoryKgs: allRecords ? allRecords[0]?.categoryKgs : null,
        batches: groupedAndFlattened,
        total,
    };
};
export const sendDeliveryTestResultService = async ({
    id,
    transferId,
    labMoisture,
    screen,
    defect,
    ppScore,
    sampleStorageId,
    notes,
    categoryKgs
}) => {

    // console.log("data to be sent to delivery test result", {
    //     id,
    //     transferId,
    //     batchNo,
    //     labMoisture,
    //     screen,
    //     defect,
    //     ppScore,
    //     sampleStorageId,
    //     notes,
    //     categoryKgs
    // });

    const qualityDelivery = await prisma.qualityDelivery.findUnique({
        where: {
            id,
            transferId,
        },
    })

    if (!qualityDelivery) {
        throw new Error(`Quality delivery record not found for id ${id}`);
    }


    const calculateCategory = (score) => {
        if (score < 20) return "-";
        if (score < 84) return "C2";
        if (score < 86) return "C1";
        if (score < 87) return "S86";
        if (score < 88) return "S87";
        return "S88";
    };

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



    const isValid = (value) => value !== 0 && value !== "";

    const isCompleted =
        isValid(labMoisture ?? qualityDelivery.labMoisture) &&
        Object.values(screen ?? qualityDelivery.screen).every(isValid) &&
        isValid(defect ?? qualityDelivery.defect) &&
        isValid(ppScore ?? qualityDelivery.ppScore);

    const mergedScreen = deepMerge(qualityDelivery.screen, screen);



    const status = isCompleted ? "COMPLETED" : "TESTED";

    const updatedQuality = await prisma.qualityDelivery.update({
        where: {
            id: qualityDelivery.id,
        },
        data: {
            status: status,
            labMoisture: labMoisture || qualityDelivery.labMoisture,
            screen: mergedScreen,
            defect: defect || qualityDelivery.defect,
            ppScore: ppScore || qualityDelivery.ppScore,
            notes: notes || qualityDelivery.notes,
            sampleStorageId: sampleStorageId ? parseInt(sampleStorageId, 10) : qualityDelivery.sampleStorageId,
            category: qualityDelivery.category,
            newCategory: calculateCategory(ppScore || qualityDelivery.ppScore || 0),
            categoryKgs: categoryKgs || qualityDelivery.categoryKgs,
        }

    });

    return updatedQuality;
};

export const DeliveryReportService = async () => {

    const [allRecords, lowGrades] = await Promise.all([
        prisma.qualityDelivery.findMany({
            // where: { NOT: { status: 'COMPLETED' } },
            include: {
                sampleStorage: {
                    select: { id: true, name: true, description: true }
                },
                transfer: {
                    select: {
                        id: true,
                        batchNo: true,
                        outputKgs: true,
                        gradeDetails: true,
                        truckNumber: true,
                        driverName: true,
                        driverPhone: true
                    }
                },
                quality: {
                    select: {
                        id: true,
                        cwsMoisture1: true,
                        labMoisture: true,
                        screen: true,
                        defect: true,
                        ppScore: true,
                        category: true
                    }
                },
                baggingOff: {
                    select: {
                        id: true,
                        batchNo: true,
                        date: true,
                        outputKgs: true,
                        totalOutputKgs: true,
                        processingType: true
                    }
                },
                processing: {
                    select: {
                        id: true,
                        batchNo: true,
                        processingType: true,
                        grade: true,
                        status: true
                    }
                },
                cws: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        location: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.transfer.findMany({
            where: {
                gradeGroup: "LOW",
            },
            select: {
                outputKgs: true,
                numberOfBags: true,
                baggingOff: {
                    select: {
                        batchNo: true,
                    }
                }
            }
        })

    ])

    // console.log("low grades found", lowGrades);

    const groupedMap = {};

    for (const record of allRecords) {

        const key = `${record.batchNo} - ${record.processingId} - ${record.baggingOffId} `;
        if (!groupedMap[key]) groupedMap[key] = [];
        groupedMap[key].push(record);
    }

    const groupedAndFlattened = Object.values(groupedMap).map(group => {
        const [first] = group;
        if (!first || !first.baggingOff) return null;

        const sample = {
            outputKgs: { ...(first.baggingOff.outputKgs || {}) },
            totalOutputKgs: first.baggingOff.totalOutputKgs || 0,
            batches: []
        };



        const delivery = {
            transportedKgs: {},
            totalTransported: 0,
            deliveryKgs: {},
            totalDelivery: 0,
            variationKgs: 0,
            batches: []
        };

        const lowgradeKey = ["A2", "A3", "B1", "B2", "N2", "H2"];

        const transferdLowGrades = lowGrades
            .filter(grade => grade.baggingOff.batchNo === first?.baggingOff?.batchNo)


        const totalLowGradeKgs = transferdLowGrades.reduce((sum, grade) => {
            return sum + lowgradeKey.reduce((subSum, key) => {
                if (grade.outputKgs?.[key]) {
                    delivery.transportedKgs[key] = (delivery.transportedKgs[key] || 0) + parseFloat(grade.outputKgs[key] || 0);
                }
                return subSum + parseFloat(grade.outputKgs?.[key] || 0);
            }, 0);
        }, 0);

        delivery.totalTransported += totalLowGradeKgs;

        const deliverykey = ["c2", "c1", "s86", "s87", "s88", "A2", "A3", "B1", "B2", "N2", "lg"];

        deliverykey.forEach(key => {
            const value = parseFloat(first.categoryKgs?.[key] || 0);
            if (value !== 0) {
                delivery.deliveryKgs[key] = value;
            }
        });

        delivery.totalDelivery += Object.values(delivery.deliveryKgs).reduce((sum, kgs) => sum + kgs, 0);


        for (const item of group) {
            const gradeKey = item.gradeKey;
            if (!gradeKey) continue;

            const sampleScreen = item.quality?.screen?.[gradeKey] || {};
            const screen16_sample = parseFloat(sampleScreen["16+"] || 0);
            const screen15_sample = parseFloat(sampleScreen["15"] || 0);
            const screen14_sample = parseFloat(sampleScreen["14"] || 0);
            const screen13_sample = parseFloat(sampleScreen["13"] || 0);
            const screenb12_sample = parseFloat(sampleScreen["B/12"] || 0);
            const defect_sample = parseFloat(item.quality?.defect?.[gradeKey] || 0);

            const avg15Plus = screen16_sample + screen15_sample;
            const avg1314 = screen14_sample + screen13_sample;
            const avgLG = screenb12_sample + defect_sample;
            const OTSample = avg15Plus + avg1314 + avgLG;

            sample.batches.push({
                id: item.id,
                gradeKey: gradeKey,
                cwsMoisture: item.quality?.cwsMoisture1?.[gradeKey] || null,
                labMoisture: item.quality?.labMoisture?.[gradeKey] || null,
                screen: sampleScreen,
                "AVG15+": avg15Plus,
                "AVG13/14": avg1314,
                defect: item.quality?.defect?.[gradeKey] || null,
                "AVGLG": avgLG,
                ppScore: item.quality?.ppScore?.[gradeKey] || null,
                category: item.quality?.category?.[gradeKey] || null,
                OTSample
            });

            const transportedKgs = parseFloat(item.transfer?.outputKgs?.[gradeKey] || 0);
            delivery.transportedKgs[gradeKey] = (delivery.transportedKgs[gradeKey] || 0) + transportedKgs;
            delivery.totalTransported += transportedKgs;


            const deliveryScreen = item.screen || {};
            const screen16_delivery = parseFloat(deliveryScreen["16+"] || 0);
            const screen15_delivery = parseFloat(deliveryScreen["15"] || 0);
            const screen14_delivery = parseFloat(deliveryScreen["14"] || 0);
            const screen13_delivery = parseFloat(deliveryScreen["13"] || 0);
            const screenB12_delivery = parseFloat(deliveryScreen["B/12"] || 0);
            const defect_delivery = parseFloat(item.defect || 0);

            const deliveryAvg15Plus = screen16_delivery + screen15_delivery;
            const deliveryAvg1314 = screen14_delivery + screen13_delivery;
            const deliveryAvgLG = screenB12_delivery + defect_delivery;
            const OTDelivery = deliveryAvg15Plus + deliveryAvg1314 + deliveryAvgLG;

            delivery.batches.push({
                id: item.id,
                gradeKey: item.gradeKey,
                cwsMoisture: item.cwsMoisture,
                labMoisture: item.labMoisture,
                screen: deliveryScreen,
                "AVG15+": deliveryAvg15Plus,
                "AVG13/14": deliveryAvg1314,
                defect: item.defect,
                "AVGLG": deliveryAvgLG,
                ppScore: item.ppScore,
                category: item.category,
                newCategory: item.newCategory,
                OTDelivery,
                sampleStorage: item.sampleStorage,
                transfer: {
                    id: item.transfer?.id,
                    truckNumber: item.transfer?.truckNumber,
                    driverName: item.transfer?.driverName,
                    driverPhone: item.transfer?.driverPhone
                },
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            });
        }

        delivery.variationKgs = delivery.totalTransported - delivery.totalDelivery;

        return {
            batchNo: first.baggingOff?.batchNo,
            sample,
            delivery,
            cws: first.cws
        };
    }).filter(Boolean);

    const cwsGrouped = {};
    for (const item of groupedAndFlattened) {
        const cwsId = item.cws?.id || 'UNKNOWN';
        if (!cwsGrouped[cwsId]) {
            cwsGrouped[cwsId] = {
                cws: {
                    ...item.cws,
                    totalTransportedKgs: 0,
                    totalDeliveredKgs: 0,
                    totalVariationKgs: 0,
                    totMoistureCws: 0,
                    totMoistureLab: 0,
                    totVmc: 0,
                    tot16plus: 0,
                    tot15: 0,
                    totAvg15PlusDelivery: 0,
                    totAvg15PlusSample: 0,
                    totv15plus: 0,
                    tot13: 0,
                    tot14: 0,
                    totAvg1314Delivery: 0,
                    totAvg1314Sample: 0,
                    totv1314: 0,
                    totB12: 0,
                    totDefect: 0,
                    totAVLGDelivery: 0,
                    totAVLGSample: 0,
                    totvlg: 0,
                    totOTSample: 0,
                    totOTDelivery: 0,
                    totvOT: 0,
                    avgPPScoreDelivery: 0,
                    avgPPScoreSample: 0,
                    totvppscore: 0
                },
                batches: []
            };
        }

        const sampleBatches = item.sample.batches;
        const deliveryBatches = item.delivery.batches;

        const sampleMap = {};
        for (const s of sampleBatches) {
            sampleMap[s.gradeKey] = s;
        }

        const deliveryWithTotals = deliveryBatches.map(d => {
            const s = sampleMap[d.gradeKey] || {};

            const vmc = (s.labMoisture != null && d.cwsMoisture != null) ? (s.labMoisture - d.cwsMoisture) : null;
            const v15plus = (d["AVG15+"] != null && s["AVG15+"] != null) ? (d["AVG15+"] - s["AVG15+"]) : null;
            const v1314 = (d["AVG13/14"] != null && s["AVG13/14"] != null) ? (d["AVG13/14"] - s["AVG13/14"]) : null;
            const vlg = (d["AVGLG"] != null && s["AVGLG"] != null) ? (d["AVGLG"] - s["AVGLG"]) : null;
            const vot = (d.OTDelivery != null && s.OTSample != null) ? (d.OTDelivery - s.OTSample) : null;
            const vppscore = (d.ppScore != null && s.ppScore != null) ? (d.ppScore - s.ppScore) : null;

            cwsGrouped[cwsId].cws.totMoistureCws += parseFloat(s.labMoisture || 0);
            cwsGrouped[cwsId].cws.totMoistureLab += parseFloat(d.cwsMoisture || 0);
            cwsGrouped[cwsId].cws.totVmc += vmc || 0;
            cwsGrouped[cwsId].cws.tot16plus += parseFloat(d.screen?.["16+"] || 0);
            cwsGrouped[cwsId].cws.tot15 += parseFloat(d.screen?.["15"] || 0);
            cwsGrouped[cwsId].cws.totAvg15PlusDelivery += parseFloat(d["AVG15+"] || 0);
            cwsGrouped[cwsId].cws.totAvg15PlusSample += parseFloat(s["AVG15+"] || 0);
            cwsGrouped[cwsId].cws.totv15plus += v15plus || 0;
            cwsGrouped[cwsId].cws.tot13 += parseFloat(d.screen?.["13"] || 0);
            cwsGrouped[cwsId].cws.tot14 += parseFloat(d.screen?.["14"] || 0);
            cwsGrouped[cwsId].cws.totAvg1314Delivery += d["AVG13/14"] || 0;
            cwsGrouped[cwsId].cws.totAvg1314Sample += s["AVG13/14"] || 0;
            cwsGrouped[cwsId].cws.totv1314 += v1314 || 0;
            cwsGrouped[cwsId].cws.totB12 += parseFloat(d.screen?.["B/12"] || 0);
            cwsGrouped[cwsId].cws.totDefect += parseFloat(d.defect || 0);
            cwsGrouped[cwsId].cws.totAVLGDelivery += parseFloat(d["AVGLG"] || 0);
            cwsGrouped[cwsId].cws.totAVLGSample += parseFloat(s["AVGLG"] || 0);
            cwsGrouped[cwsId].cws.totvlg += vlg || 0;
            cwsGrouped[cwsId].cws.totOTSample += parseFloat(s.OTSample || 0);
            cwsGrouped[cwsId].cws.totOTDelivery += parseFloat(d.OTDelivery || 0);
            cwsGrouped[cwsId].cws.totvOT += vot || 0;
            cwsGrouped[cwsId].cws.avgPPScoreDelivery += parseFloat(d.ppScore || 0) / deliveryBatches.length;
            cwsGrouped[cwsId].cws.avgPPScoreSample += parseFloat(s.ppScore || 0) / sampleBatches.length;
            cwsGrouped[cwsId].cws.totvppscore += vppscore || 0;
            return {
                ...d,
                totals: {
                    vmc,
                    v15plus,
                    v1314,
                    vlg,
                    vot,
                    vppscore
                }
            };
        });

        cwsGrouped[cwsId].cws.totalTransportedKgs += item.delivery.totalTransported || 0;
        cwsGrouped[cwsId].cws.totalDeliveredKgs += item.delivery.totalDelivery || 0;
        cwsGrouped[cwsId].cws.totalVariationKgs += item.delivery.variationKgs || 0;

        cwsGrouped[cwsId].batches.push({
            batchNo: item.batchNo,
            sample: item.sample,
            delivery: {
                ...item.delivery,
                batches: deliveryWithTotals
            }
        });
    }

    // Calculate grand totals from all CWS data
    const cwsValues = Object.values(cwsGrouped);
    const grandTotals = {
        GrandtotalTransportedKgs: 0,
        GrandtotalDeliveredKgs: 0,
        GrandtotAvg15PlusDelivery: 0,
        GrandtotAvg1314Delivery: 0,
        GrandtotAVLGDelivery: 0,
        GrandtotOTDelivery: 0
    };

    for (const cwsGroup of cwsValues) {
        grandTotals.GrandtotalTransportedKgs += cwsGroup.cws.totalTransportedKgs || 0;
        grandTotals.GrandtotalDeliveredKgs += cwsGroup.cws.totalDeliveredKgs || 0;
        grandTotals.GrandtotAvg15PlusDelivery += cwsGroup.cws.totAvg15PlusDelivery || 0;
        grandTotals.GrandtotAvg1314Delivery += cwsGroup.cws.totAvg1314Delivery || 0;
        grandTotals.GrandtotAVLGDelivery += cwsGroup.cws.totAVLGDelivery || 0;
        grandTotals.GrandtotOTDelivery += cwsGroup.cws.totOTDelivery || 0;
    }

    return {
        total: Object.keys(cwsGrouped).length,
        grandTotals,
        report: Object.values(cwsGrouped)
    };
};

export const SaveAllHighGradeBatchesToQualityDelivery = async () => {
    const createdQualities = [];
    const errors = [];
    const transfers = await prisma.transfer.findMany({
        where: { gradeGroup: 'HIGH' },
        include: {
            baggingOff: { include: { processing: true } }
        }
    });

    for (const transfer of transfers) {
        let gradeDetails = transfer.gradeDetails;
        if (typeof gradeDetails === 'string') {
            try {
                gradeDetails = JSON.parse(gradeDetails);
            } catch (e) {
                errors.push({ batchNo: transfer.batchNo, baggingOffId: transfer.baggingOffId, error: 'Invalid gradeDetails JSON' });
                continue;
            }
        }
        if (!gradeDetails || typeof gradeDetails !== 'object') continue;
        for (const [gradeKey, value] of Object.entries(gradeDetails)) {
            const baggingOffId = transfer.baggingOffId;
            const processingId = transfer.baggingOff?.processingId;
            const cwsId = transfer.baggingOff?.processing?.cwsId;
            const batchNo = transfer.batchNo;
            const category = value.cupProfile || "-";
            const cwsMoisture = value.moistureContent || 0;
            try {
                const qualitysample = await prisma.quality.findFirst({
                    where: {
                        baggingOffId
                    }
                });
                if (!qualitysample) {
                    errors.push({ batchNo, baggingOffId, gradeKey, error: 'No quality sample found' });
                    continue;
                }
                const exists = await prisma.qualityDelivery.findFirst({
                    where: { batchNo, baggingOffId, gradeKey, cwsId, processingId }
                });
                if (exists) continue;
                const created = await prisma.qualityDelivery.create({
                    data: {
                        batchNo,
                        status: "TESTING",
                        cwsMoisture,
                        gradeKey,
                        labMoisture: 0,
                        screen: {
                            "16+": "",
                            "15": "",
                            "14": "",
                            "13": "",
                            "B/12": ""
                        },
                        defect: 0,
                        ppScore: 0,
                        notes: "",
                        category: category,
                        newCategory: "-",
                        categoryKgs: {
                            "c2": 0,
                            "c1": 0,
                            "s86": 0,
                            "s87": 0,
                            "s88": 0,
                            "A2": 0,
                            "A3": 0,
                            "B1": 0,
                            "B2": 0,
                            "N2": 0,
                        },
                        transfer: { connect: { id: transfer.id } },
                        quality: { connect: { id: qualitysample.id } },
                        cws: { connect: { id: cwsId } },
                        processing: { connect: { id: processingId } },
                        baggingOff: { connect: { id: baggingOffId } },
                        sampleStorage: { connect: { id: 2 } },
                    }
                });
                createdQualities.push(created);
            } catch (error) {
                errors.push({ batchNo, baggingOffId, gradeKey, error: error.message });
            }
        }
    }
    return {
        success: true,
        created: createdQualities.length,
        createdQualities,
        errors: errors.length > 0 ? errors : null,
        message: `Successfully created ${createdQualities.length} quality records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
    };
};

export const createMissingQualityDeliveryRecords = async () => {
    try {
        const missingTransfers = await prisma.$queryRaw`
            SELECT DISTINCT 
                t.id as transfer_id,
                t.batchNo,
                t.baggingOffId,
                t.gradeGroup,
                t.outputKgs,
                t.gradeDetails,
                t.truckNumber,
                t.transferDate,
                bo.processingId,
                p.cwsId
            FROM transfer t
            INNER JOIN baggingoff bo ON t.baggingOffId = bo.id
            INNER JOIN processing p ON bo.processingId = p.id
            LEFT JOIN qualitydelivery qd ON qd.transferId = t.id 
                AND qd.baggingOffId = t.baggingOffId 
                AND qd.batchNo = t.batchNo
            WHERE t.gradeGroup = 'HIGH'
            AND qd.id IS NULL
            ORDER BY t.transferDate DESC
        `;

        const createdRecords = [];
        const errors = [];
        let totalProcessed = 0;

        for (const transfer of missingTransfers) {
            try {
                let gradeDetails = transfer.gradeDetails;
                if (typeof gradeDetails === 'string') {
                    try {
                        gradeDetails = JSON.parse(gradeDetails);
                    } catch (e) {
                        errors.push({
                            transferId: transfer.transfer_id,
                            batchNo: transfer.batchNo,
                            error: 'Invalid gradeDetails JSON'
                        });
                        continue;
                    }
                }

                if (!gradeDetails || typeof gradeDetails !== 'object') {
                    errors.push({
                        transferId: transfer.transfer_id,
                        batchNo: transfer.batchNo,
                        error: 'No gradeDetails found'
                    });
                    continue;
                }

                const qualitySample = await prisma.quality.findFirst({
                    where: {
                        OR: [
                            { baggingOffId: transfer.baggingOffId },
                            { batchNo: { startsWith: transfer.batchNo } },
                            { batchNo: transfer.batchNo }
                        ]
                    }
                });

                if (!qualitySample) {
                    errors.push({
                        transferId: transfer.transfer_id,
                        batchNo: transfer.batchNo,
                        baggingOffId: transfer.baggingOffId,
                        error: 'No quality sample found - required by sendBatchToDeliveryTestService'
                    });
                    continue;
                }

                for (const [gradeKey, gradeValue] of Object.entries(gradeDetails)) {
                    try {
                        const existingRecord = await prisma.qualityDelivery.findFirst({
                            where: {
                                transferId: transfer.transfer_id,
                                batchNo: transfer.batchNo,
                                baggingOffId: transfer.baggingOffId,
                                gradeKey: gradeKey
                            }
                        });

                        if (existingRecord) {
                            continue;
                        }


                        const category = gradeValue?.cupProfile || "-";
                        const cwsMoisture = gradeValue?.moistureContent || 0;

                        const created = await sendBatchToDeliveryTestService({
                            transferId: transfer.transfer_id,
                            batchNo: transfer.batchNo,
                            cwsId: transfer.cwsId,
                            baggOffId: transfer.baggingOffId,
                            processingId: transfer.processingId,
                            cwsMoisture: cwsMoisture,
                            category: category,
                            gradeKey: gradeKey
                        });

                        createdRecords.push({
                            id: created.id,
                            transferId: transfer.transfer_id,
                            batchNo: transfer.batchNo,
                            gradeKey: gradeKey,
                            category: category,
                            cwsMoisture: cwsMoisture,
                            status: created.status,
                            createdAt: created.createdAt
                        });

                        totalProcessed++;

                    } catch (gradeError) {
                        errors.push({
                            transferId: transfer.transfer_id,
                            batchNo: transfer.batchNo,
                            gradeKey: gradeKey,
                            error: gradeError.message
                        });
                    }
                }

            } catch (transferError) {
                errors.push({
                    transferId: transfer.transfer_id,
                    batchNo: transfer.batchNo,
                    error: transferError.message
                });
            }
        }

        return {
            success: true,
            totalFound: missingTransfers.length,
            totalProcessed: totalProcessed,
            created: createdRecords,
            errors: errors.length > 0 ? errors : null,
            message: `Found ${missingTransfers.length} missing transfers. Successfully created ${totalProcessed} quality delivery records${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
        };

    } catch (error) {
        console.error('Error creating missing quality delivery records:', error);
        throw new Error(`Failed to create missing quality delivery records: ${error.message}`);
    }
};

// function sampleStorageNameToId(name) {
//     if (!name || typeof name !== "string" || !/^1[A-Z]$/.test(name.trim())) return null;
//     const letter = name.trim().toUpperCase().charCodeAt(1) - 65 + 1;
//     return letter;
// }

// export const getBatchesFromCsvFile = () => {
//     const csvFilePath = path.join(process.cwd(), 'batches.csv');
//     const csvContent = fs.readFileSync(csvFilePath, 'utf8');
//     const records = parse(csvContent, {
//         columns: header => header.map(h => h.trim()),
//         skip_empty_lines: true,
//         relax_column_count: true
//     });

//     // Group by batch date prefix (e.g., 2603 from KGM-2603-A0)
//     const batchGroups = {};
//     records.forEach(row => {
//         let batchNumber = (row['Batch number'] || '').trim();
//         batchNumber = batchNumber.replace(/\s+/g, '');
//         // Make regex more flexible: allow optional dashes, tolerate A0/A1 case, and log unmatched
//         const match = batchNumber.match(/^([A-Z]+)[-]?(\d+)[-]?(A0|A1)$/i);
//         if (!match) {
//             // Uncomment for debugging:
//             // console.log('Unmatched batch number:', batchNumber);
//             return;
//         }
//         const datePart = match[1] + match[2]; // e.g., KGM2603
//         const key = match[3].toUpperCase();
//         if (!batchGroups[datePart]) batchGroups[datePart] = {};
//         batchGroups[datePart][key] = row;
//     });

//     const batches = Object.entries(batchGroups).map(([datePart, keysObj]) => {
//         const parseNum = v => {
//             if (typeof v !== 'string') return 0;
//             const n = parseFloat(v.replace(/,/g, '').trim());
//             return isNaN(n) ? 0 : n;
//         };
//         const emptyScreen = { "13": "", "14": "", "15": "", "16+": "", "B/12": "" };
//         const labMoisture = { A0: 0, A1: 0 };
//         const cwsMoisture1 = { A0: 0, A1: 0 };
//         const screen = { A0: { ...emptyScreen }, A1: { ...emptyScreen } };
//         const defect = { A0: 0, A1: 0 };
//         const ppScore = { A0: 0, A1: 0 };
//         const notes = { A0: "", A1: "" };
//         let sampleStorageId_0 = null;
//         let sampleStorageId_1 = null;
//         ['A0', 'A1'].forEach((key, idx) => {
//             const row = keysObj[key];
//             if (!row) return;
//             labMoisture[key] = parseNum(row['Moisture content lab (%)']);
//             cwsMoisture1[key] = parseNum(row['Moisture content CWS (%)']);
//             screen[key] = {
//                 "13": parseNum(row['13']) || "",
//                 "14": parseNum(row['14']) || "",
//                 "15": parseNum(row['15']) || "",
//                 "16+": parseNum(row['16+'] || row['16 +']) || "",
//                 "B/12": parseNum(row['B12'] || row['B/12']) || ""
//             };
//             defect[key] = parseNum(row['Defects (%)']);
//             let score = (row['PP Score'] || '').trim();
//             if (!score) score = (row['Overall Score'] || row[' Overall Score '] || '').trim();
//             ppScore[key] = parseNum(score);
//             const noteParts = [
//                 row['Flavor/After taste'],
//                 row['Acidity'],
//                 row['Body'],
//                 row['Comments']
//             ].map(v => (v || '').trim()).filter(Boolean);
//             notes[key] = noteParts.length ? noteParts.join(' - ') : '';
//             if (idx === 0) sampleStorageId_0 = sampleStorageNameToId(row['Sample storage']);
//             if (idx === 1) sampleStorageId_1 = sampleStorageNameToId(row['Sample storage']);
//         });
//         let batchNoRaw = null;
//         for (const key of ['A0', 'A1']) {
//             if (keysObj[key] && keysObj[key]['Batch number']) {
//                 batchNoRaw = keysObj[key]['Batch number'].replace(/\s+/g, '');
//                 break;
//             }
//         }
//         let batchNo = '';
//         if (batchNoRaw) {
//             batchNo = '25' + batchNoRaw.replace(/-/g, '');
//         }
//         return {
//             batchNo,
//             labMoisture,
//             cwsMoisture1,
//             screen,
//             defect,
//             ppScore,
//             sampleStorageId_0: sampleStorageId_0 === null ? 0 : sampleStorageId_0,
//             sampleStorageId_1: sampleStorageId_1 === null ? 0 : sampleStorageId_1,
//             notes
//         };
//     });
//     return { batches };
// };