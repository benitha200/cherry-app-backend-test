import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


export const stockReport = async () => {
    try {

        const [allCws, purchasesByCws, parchmentOutputData, transportedData] = await Promise.all([
            prisma.cWS.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }),
            prisma.purchase.groupBy({
                by: ['cwsId'],
                _sum: {
                    totalKgs: true
                }
            }),
            prisma.baggingOff.findMany({
                select: {
                    totalOutputKgs: true,
                    processing: {
                        select: {
                            cwsId: true
                        }
                    }
                }
            }),
            prisma.transfer.findMany({
                where: {
                    status: 'COMPLETED'
                },
                select: {
                    outputKgs: true,
                    baggingOff: {
                        select: {
                            processing: {
                                select: {
                                    cwsId: true
                                }
                            }
                        }
                    }
                }
            })
        ]);

        const cwsMetrics = {};
        let totalCherryPurchase = 0;
        let totalParchmentOutput = 0;
        let totalTransportedKgs = 0;

        allCws.forEach(cws => {
            cwsMetrics[cws.id] = {
                cwsId: cws.id,
                cwsName: cws.name,
                cwsCode: cws.code,
                cherryPurchase: 0,
                parchmentOutput: 0,
                transportedKgs: 0,
                parchmentInstore: 0
            };
        });

        purchasesByCws.forEach(purchase => {
            const cwsId = purchase.cwsId;
            const totalKgs = purchase._sum.totalKgs || 0;
            if (cwsMetrics[cwsId]) {
                cwsMetrics[cwsId].cherryPurchase = totalKgs;
            }
            totalCherryPurchase += totalKgs;
        });

        parchmentOutputData.forEach(output => {
            const cwsId = output.processing?.cwsId;
            const totalKgs = output.totalOutputKgs || 0;
            if (cwsId && cwsMetrics[cwsId]) {
                cwsMetrics[cwsId].parchmentOutput += totalKgs;
            }
            totalParchmentOutput += totalKgs;
        });

        const transportedByCws = {};
        transportedData.forEach(transfer => {
            const cwsId = transfer.baggingOff?.processing?.cwsId;
            if (!cwsId || !transfer.outputKgs) return;

            let parsed;
            try {
                if (typeof transfer.outputKgs === 'string') {
                    parsed = JSON.parse(transfer.outputKgs);
                } else if (typeof transfer.outputKgs === 'object') {
                    parsed = transfer.outputKgs;
                } else {
                    console.warn('Unexpected outputKgs type:', typeof transfer.outputKgs, transfer.outputKgs);
                    return;
                }

                const kgs = Object.values(parsed).reduce((a, b) => Number(a) + Number(b), 0);
                transportedByCws[cwsId] = (transportedByCws[cwsId] || 0) + kgs;
                totalTransportedKgs += kgs;
            } catch (error) {
                console.error('Error parsing outputKgs:', transfer.outputKgs, error);
            }
        });

        Object.keys(transportedByCws).forEach(cwsId => {
            if (cwsMetrics[cwsId]) {
                cwsMetrics[cwsId].transportedKgs = transportedByCws[cwsId];
            }
        });

        Object.keys(cwsMetrics).forEach(cwsId => {
            cwsMetrics[cwsId].parchmentInstore = cwsMetrics[cwsId].parchmentOutput - cwsMetrics[cwsId].transportedKgs;
        });

        const totalParchmentInstore = totalParchmentOutput - totalTransportedKgs;

        const result = {
            totals: {
                totCherryPurchase: totalCherryPurchase,
                totalParchmentOutput: totalParchmentOutput,
                totalTransportedKgs: totalTransportedKgs,
                parchmentInstore: totalParchmentInstore,
            },
            byCws: Object.values(cwsMetrics)
        };

        return result;
    } catch (error) {
        console.error('Error generating the stock report :', error);
        throw new Error('Failed to fetch total weight');
    } finally {
        await prisma.$disconnect();
    }
}
