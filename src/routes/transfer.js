import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendBatchToDeliveryTestService } from '../services/quality/qualityDelivery.js';
import { sendBatchToTestService } from '../services/quality/quality.js';


const router = Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  let {
    baggingOffId,
    batchNo,
    gradeGroup,
    outputKgs,
    gradeDetails,
    truckNumber,
    driverName,
    driverPhone,
    transferMode,
    notes,
    date,
    isGroupedTransfer,
    transportGroupId,
  } = req.body;

  // console.log("Received transfer request:", req.body);

  try {
    // Generate a single transport group ID for all transfers in this operation
    // const transportGroupId = req.body.transportGroupId || `TG-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}-${new Date().toISOString().slice(0, 10)}`;
    // Handle grouped transfers differently from individual transfers

    if (isGroupedTransfer && Array.isArray(baggingOffId)) {
      // For grouped transfers, we need to check all bagging off records
      const baggingOffRecords = await prisma.baggingOff.findMany({
        where: {
          id: {
            in: baggingOffId, // Use 'in' operator for array of IDs
          },
          // status: "COMPLETED",
        },
      });


      // Make sure all records exist and are completed
      if (baggingOffRecords.length !== baggingOffId.length) {
        return res.status(404).json({
          error: "One or more bagging off records not found or not completed",
        });
      }

      // For grouped transfers, check which grades have already been transferred
      const existingTransfers = await prisma.transfer.findMany({
        where: {
          baggingOffId: {
            in: baggingOffId,
          },
        },
      });

      const alreadyTransferredGrades = {};
      existingTransfers.forEach((transfer) => {
        if (!alreadyTransferredGrades[transfer.baggingOffId]) {
          alreadyTransferredGrades[transfer.baggingOffId] = new Set();
        }

        const transferOutputKgs = transfer.outputKgs;
        if (transferOutputKgs) {
          Object.keys(transferOutputKgs).forEach((grade) => {
            alreadyTransferredGrades[transfer.baggingOffId].add(grade);
          });
        }
      });

      // Create individual transfer records for each bagging off ID
      const transferPromises = baggingOffId.map(async (id) => {
        // Filter out already transferred grades for this specific bagging off record
        const recordTransferredGrades =
          alreadyTransferredGrades[id] || new Set();
        const filteredOutputKgs = {};

        Object.entries(outputKgs).forEach(([grade, kg]) => {
          if (!recordTransferredGrades.has(grade)) {
            filteredOutputKgs[grade] = kg;
          }
        });

        // Skip if all grades already transferred for this record
        if (Object.keys(filteredOutputKgs).length === 0) {
          return null;
        }

        // Filter grade details for untransferred grades
        const filteredGradeDetails = {};
        Object.keys(filteredOutputKgs).forEach((grade) => {
          if (gradeDetails[grade]) {
            filteredGradeDetails[grade] = gradeDetails[grade];
          }
        });

        // Calculate summary fields for backward compatibility
        let numberOfBags = 0;
        let cupProfile = null;
        let cupProfilePercentage = null;

        // Handle different grade groups for summary fields
        const highGradeKeys = Object.keys(filteredGradeDetails).filter(
          (grade) => ["A0", "A1", "N1", "H2"].includes(grade)
        );

        if (highGradeKeys.length > 0) {
          const firstHighGrade = highGradeKeys[0];
          const details = filteredGradeDetails[firstHighGrade];

          if (details) {
            numberOfBags += details.numberOfBags || 0;
            cupProfile = details.cupProfile || null;
            cupProfilePercentage = details.moistureContent || null;
          }
        }

        const lowGradeKeys = Object.keys(filteredGradeDetails).filter((grade) =>
          ["A2", "A3", "B1", "B2", "N2"].includes(grade)
        );

        lowGradeKeys.forEach((grade) => {
          const details = filteredGradeDetails[grade];
          if (details && details.numberOfBags) {
            numberOfBags += details.numberOfBags;
          }
        });

        // Create transfer record with both summary and detailed information
        // Now includes the transportGroupId to link related transfers
        return prisma.transfer.create({
          data: {
            batchNo,
            baggingOffId: id, // Use the individual ID
            gradeGroup,
            outputKgs: filteredOutputKgs,
            gradeDetails: filteredGradeDetails,
            truckNumber,
            driverName,
            driverPhone,
            transferMode,
            transferDate: date ? new Date(date) : new Date(),
            notes,
            isGrouped: true, // Mark this as part of a grouped transfer
            groupBatchNo: batchNo, // Store the group batch number
            transportGroupId, // Add the transport group ID to link related transfers
            // Summary fields
            numberOfBags,
            cupProfile,
            cupProfilePercentage,
          },
          include: {
            baggingOff: {
              include: {
                processing: {
                  include: {
                    cws: true,
                  },
                },
              },
            },
          },
        });
      });

      // Execute all transfer creations
      const transferResults = await Promise.all(transferPromises);
      const successfulTransfers = transferResults.filter((t) => t !== null);

      if (successfulTransfers.length === 0) {
        return res
          .status(400)
          .json({
            error: "All specified grades have already been transferred",
          });
      }

      res.status(201).json({
        message: `Successfully transferred ${successfulTransfers.length} records`,
        transportGroupId, // Return the transportGroupId in the response
        transfers: successfulTransfers,
      });
    } else {
      // Handle single transfers (original code path)
      // Check if bagging off record exists and is completed
      const baggingOff = await prisma.baggingOff.findFirst({
        where: {
          id: baggingOffId,
          // status: 'COMPLETED'
        },
        include: {
          processing: {
            select: {
              id: true,
              processingType: true,
              cwsId: true
            }
          }
        }
      });

      if (!baggingOff) {
        return res
          .status(404)
          .json({ error: "Bagging off record not found or not completed" });
      }

      // Check if we've already transferred any of these grades for this baggingOffId
      if (outputKgs) {
        const existingTransfers = await prisma.transfer.findMany({
          where: { baggingOffId },
        });

        // Look for any grades that have already been transferred
        const alreadyTransferredGrades = new Set();
        existingTransfers.forEach((transfer) => {
          const transferOutputKgs = transfer.outputKgs;
          if (transferOutputKgs) {
            Object.keys(transferOutputKgs).forEach((grade) => {
              alreadyTransferredGrades.add(grade);
            });
          }
        });

        // Filter out already transferred grades from outputKgs
        const filteredOutputKgs = {};
        Object.entries(outputKgs).forEach(([grade, kg]) => {
          if (!alreadyTransferredGrades.has(grade)) {
            filteredOutputKgs[grade] = kg;
          }
        });

        // If all grades have already been transferred, return an error
        if (Object.keys(filteredOutputKgs).length === 0) {
          return res
            .status(400)
            .json({
              error: "All specified grades have already been transferred",
            });
        }

        // Update outputKgs to only include untransferred grades
        outputKgs = filteredOutputKgs;

        // Update gradeDetails to only include untransferred grades
        const filteredGradeDetails = {};
        Object.keys(filteredOutputKgs).forEach((grade) => {
          if (gradeDetails[grade]) {
            filteredGradeDetails[grade] = gradeDetails[grade];
          }
        });
        gradeDetails = filteredGradeDetails;
      }

      // For backward compatibility, maintain summary info
      let numberOfBags = 0;
      let cupProfile = null;
      let cupProfilePercentage = null;

      // Handle different grade groups
      const highGradeKeys = Object.keys(gradeDetails).filter((grade) =>
        ["A0", "A1", "N1", "H2"].includes(grade)
      );

      if (highGradeKeys.length > 0) {
        const firstHighGrade = highGradeKeys[0];
        const details = gradeDetails[firstHighGrade];

        if (details) {
          // Add to the total bag count
          numberOfBags += details.numberOfBags || 0;

          // Set the cup profile from the first high grade
          cupProfile = details.cupProfile || null;
          cupProfilePercentage = details.moistureContent || null;
        }
      }

      // Add low grade bags to the total
      const lowGradeKeys = Object.keys(gradeDetails).filter((grade) =>
        ["A2", "A3", "B1", "B2", "N2"].includes(grade)
      );

      // Add all low grade bags to the total count
      lowGradeKeys.forEach((grade) => {
        const details = gradeDetails[grade];
        if (details && details.numberOfBags) {
          numberOfBags += details.numberOfBags;
        }
      });

      let qualitysample = await prisma.quality.findFirst({
        where: {
          OR: [
            { baggingOffId: baggingOffId },
            { batchNo: { startsWith: batchNo } },
            { batchNo: batchNo }
          ]
        }
      })

      // If not found, create the quality sample automatically using sendBatchToTestService
      if (!qualitysample) {
        const { batchNo } = baggingOff;
        const { id: processingId, processingType, cwsId } = baggingOff.processing;
        qualitysample = await sendBatchToTestService({
          batchNo,
          cwsId,
          baggOffId: baggingOffId,
          processingId,
          processingType
        });
      }

      // Create transfer record with both summary and detailed information
      // Now includes the transportGroupId
      const transfer = await prisma.transfer.create({
        data: {
          batchNo,
          baggingOffId,
          gradeGroup,
          outputKgs,
          gradeDetails, // Store the complete grade details object
          gradeDetails: gradeDetails,  // Store the complete grade details object
          truckNumber,
          driverName,
          driverPhone,
          transferMode,
          transferDate: date ? new Date(date) : new Date(),
          notes,
          transportGroupId, // Add the transport group ID even for single transfers
          // Keep the summary fields for backward compatibility
          numberOfBags,
          cupProfile,
          cupProfilePercentage,
        },
        include: {
          baggingOff: {
            include: {
              processing: {
                include: {
                  cws: true,
                },
              },
            },
          },
        },
      });

      const transferredGrades = Object.keys(outputKgs);

      await prisma.$transaction(async (tx) => {

        const currentBaggingOff = await tx.$queryRaw`
          SELECT hgtransported FROM baggingoff WHERE id = ${transfer.baggingOffId} FOR UPDATE
            `;

        const hgtransportedValue = currentBaggingOff[0]?.hgtransported || '[]';
        const existingTransferredGrades = JSON.parse(hgtransportedValue);
        const updatedTransferredGrades = [...new Set([...existingTransferredGrades, ...transferredGrades])];


        await tx.baggingOff.update({
          where: { id: transfer.baggingOffId },
          data: {
            hgtransported: JSON.stringify(updatedTransferredGrades)
          }
        });
      }, {
        isolationLevel: 'Serializable'
      });

      const gradeKeys = Object.keys(transfer.outputKgs || {});
      for (const gradeKey of gradeKeys) {
        await sendBatchToDeliveryTestService({
          transferId: transfer.id,
          qualitysampleId: qualitysample.id,
          batchNo: transfer.batchNo,
          cwsId: transfer.baggingOff.processing.cws.id,
          baggOffId: transfer.baggingOff.id,
          processingId: transfer.baggingOff.processing.id,
          cwsMoisture: transfer.cupProfilePercentage,
          category: transfer.cupProfile,
          gradeKey,
        });
      }

      res.status(201).json({
        ...transfer,
        transportGroupId, // Return the transportGroupId in the response
      });
    }
  } catch (error) {
    console.error("Transfer creation error:", error);
    res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const transfers = await prisma.transfer.findMany({
      include: {
        baggingOff: {
          include: {
            processing: {
              include: {
                cws: true,
              },
            },
          },
        },
      },
      orderBy: {
        transferDate: "desc",
      },
    });

    res.json(transfers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transfers by batch number
router.get("/batch/:batchNo", async (req, res) => {
  const { batchNo } = req.params;

  try {
    const transfers = await prisma.transfer.findMany({
      where: { batchNo },
      include: {
        baggingOff: {
          include: {
            processing: {
              include: {
                cws: true,
              },
            },
          },
        },
      },
      orderBy: {
        transferDate: "desc",
      },
    });

    if (transfers.length === 0) {
      return res
        .status(404)
        .json({ error: "No transfers found for this batch" });
    }

    res.json(transfers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transfers by CWS
router.get("/cws/:cwsId", async (req, res) => {
  const { cwsId } = req.params;
  const { startDate, endDate } = req.query;

  try {
    const where = {
      baggingOff: {
        processing: {
          cwsId: parseInt(cwsId),
        },
      },
    };

    // Add date filtering if both dates are provided
    if (startDate && endDate) {
      where.transferDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        baggingOff: {
          include: {
            processing: {
              include: {
                cws: true,
              },
            },
          },
        },
      },
      orderBy: {
        transferDate: "desc",
      },
    });

    res.json(transfers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get transfer history for a specific bagging off record
router.get("/bagging-off/:baggingOffId", async (req, res) => {
  const { baggingOffId } = req.params;

  try {
    const transfers = await prisma.transfer.findMany({
      where: {
        baggingOffId: parseInt(baggingOffId),
      },
      include: {
        baggingOff: {
          include: {
            processing: {
              include: {
                cws: true,
              },
            },
          },
        },
      },
      orderBy: {
        transferDate: "desc",
      },
    });

    res.json(transfers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update transfer
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { notes, status } = req.body;

  try {
    const transfer = await prisma.transfer.update({
      where: { id: parseInt(id) },
      data: {
        notes,
        status,
      },
      include: {
        baggingOff: {
          include: {
            processing: {
              include: {
                cws: true,
              },
            },
          },
        },
      },
    });

    res.json(transfer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
