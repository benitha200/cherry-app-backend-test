import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create a new wet transfer
router.post('/', async (req, res) => {
  try {
    const {
      processingId,
      batchNo,
      date,
      sourceCwsId,
      destinationCwsId,
      totalKgs,
      outputKgs,
      grade,
      processingType,
      moistureContent,
      notes
    } = req.body;

    // Validate request
    if (!processingId || !sourceCwsId || !destinationCwsId || !grade || !processingType) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existingTransfer = await prisma.wetTransfer.findFirst({
      where: {
        processingId: parseInt(processingId),
        batchNo: batchNo,
        grade: grade,
      },
    });

    if (existingTransfer) {
      console.log(`Existing transfer found:`, existingTransfer);
      return res.status(400).json({
        error: "Wet transfer already exists",
        message: `Wet transfer already exists for this batch ${batchNo} with grade ${grade}`,
      });
    }


    // Create the wet transfer record
    const wetTransfer = await prisma.wetTransfer.create({
      data: {
        processingId,
        batchNo,
        date: date ? new Date(date) : new Date(),
        sourceCwsId: parseInt(sourceCwsId),
        destinationCwsId: parseInt(destinationCwsId),
        totalKgs: parseFloat(totalKgs),
        outputKgs: parseFloat(outputKgs || 0),
        grade,
        status: "PENDING",
        processingType,
        moistureContent: parseFloat(moistureContent || 12.0),
        notes: notes || null
      },
    });

    // Update the processing record status to TRANSFERRED
    await prisma.processing.update({
      where: { id: parseInt(processingId) },
      data: { status: "TRANSFERRED" }
    });

    res.status(201).json(wetTransfer);
  } catch (error) {
    console.error('Error creating wet transfer:', error);
    res.status(500).json({ message: "Failed to create wet transfer", error: error.message });
  }
});

// Get all wet transfers
router.get('/', async (req, res) => {
  try {
    const wetTransfers = await prisma.wetTransfer.findMany({
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(wetTransfers);
  } catch (error) {
    console.error('Error fetching wet transfers:', error);
    res.status(500).json({ message: "Failed to fetch wet transfers", error: error.message });
  }
});

// Get wet transfers by source CWS ID
router.get('/source/:cwsId', async (req, res) => {
  try {
    const { cwsId } = req.params;

    const wetTransfers = await prisma.wetTransfer.findMany({
      where: {
        sourceCwsId: parseInt(cwsId)
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(wetTransfers);
  } catch (error) {
    console.error('Error fetching wet transfers by source CWS:', error);
    res.status(500).json({ message: "Failed to fetch wet transfers", error: error.message });
  }
});

// Get wet transfers by destination CWS ID
router.get('/destination/:cwsId', async (req, res) => {
  try {
    const { cwsId } = req.params;

    const transfers = await prisma.wetTransfer.findMany({
      where: {
        destinationCwsId: parseInt(cwsId)
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: "Failed to fetch transfers", error: error.message });
  }
});


// Receive wet transfer endpoint
router.post('/receive', async (req, res) => {
  try {
    const {
      transferId,
      receivedDate,
      receivingCwsId,
      sourceCwsId,
      notes,
      moisture,
      defectPercentage,
      cleanCupScore
    } = req.body;

    // Validate request
    if (!transferId || !receivingCwsId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Update the wet transfer record
    const updatedTransfer = await prisma.wetTransfer.update({
      where: { id: parseInt(transferId) },
      data: {
        status: "RECEIVED",
        // Store quality metrics in notes field
        notes: notes ?
          `${notes}\nMoisture: ${moisture || 'N/A'}, Defects: ${defectPercentage || 'N/A'}, Cup Score: ${cleanCupScore || 'N/A'} ` :
          `Moisture: ${moisture || 'N/A'}, Defects: ${defectPercentage || 'N/A'}, Cup Score: ${cleanCupScore || 'N/A'} `
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.status(200).json(updatedTransfer);
  } catch (error) {
    console.error('Error receiving wet transfer:', error);
    res.status(500).json({ message: "Failed to receive wet transfer", error: error.message });
  }
});

// Reject wet transfer endpoint
router.post('/reject', async (req, res) => {
  try {
    const { transferId, rejectionReason, receivingCwsId } = req.body;

    // Validate request
    if (!transferId || !receivingCwsId) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Update the wet transfer record
    const updatedTransfer = await prisma.wetTransfer.update({
      where: { id: parseInt(transferId) },
      data: {
        status: "REJECTED",
        notes: rejectionReason || "Rejected by receiver"
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.status(200).json(updatedTransfer);
  } catch (error) {
    console.error('Error rejecting wet transfer:', error);
    res.status(500).json({ message: "Failed to reject wet transfer", error: error.message });
  }
});

// Get wet transfers summary by CWS (for dashboard)
router.get('/summary/:cwsId', async (req, res) => {
  try {
    const { cwsId } = req.params;

    // Get sent transfers summary
    const sentTransfers = await prisma.wetTransfer.findMany({
      where: {
        sourceCwsId: parseInt(cwsId)
      },
      select: {
        id: true,
        status: true,
        outputKgs: true
      }
    });

    // Get received transfers summary
    const receivedTransfers = await prisma.wetTransfer.findMany({
      where: {
        destinationCwsId: parseInt(cwsId)
      },
      select: {
        id: true,
        status: true,
        outputKgs: true
      }
    });

    // Calculate statistics
    const summary = {
      sent: {
        total: sentTransfers.length,
        pending: sentTransfers.filter(t => t.status === 'PENDING').length,
        received: sentTransfers.filter(t => t.status === 'RECEIVED').length,
        rejected: sentTransfers.filter(t => t.status === 'REJECTED').length,
        totalKgs: sentTransfers.reduce((sum, t) => sum + parseFloat(t.outputKgs || 0), 0).toFixed(2)
      },
      received: {
        total: receivedTransfers.length,
        pending: receivedTransfers.filter(t => t.status === 'PENDING').length,
        received: receivedTransfers.filter(t => t.status === 'RECEIVED').length,
        rejected: receivedTransfers.filter(t => t.status === 'REJECTED').length,
        totalKgs: receivedTransfers.reduce((sum, t) => sum + parseFloat(t.outputKgs || 0), 0).toFixed(2)
      }
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching wet transfers summary:', error);
    res.status(500).json({ message: "Failed to fetch wet transfers summary", error: error.message });
  }
});

// Get recent transfers for a CWS (both sent and received)
router.get('/recent/:cwsId', async (req, res) => {
  try {
    const { cwsId } = req.params;
    const { limit = 5 } = req.query;

    // Get recent transfers where the CWS is either the source or destination
    const recentTransfers = await prisma.wetTransfer.findMany({
      where: {
        OR: [
          { sourceCwsId: parseInt(cwsId) },
          { destinationCwsId: parseInt(cwsId) }
        ]
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: parseInt(limit)
    });

    // Add direction metadata to each transfer
    const transfersWithDirection = recentTransfers.map(transfer => ({
      ...transfer,
      direction: transfer.sourceCwsId === parseInt(cwsId) ? 'OUTBOUND' : 'INBOUND'
    }));

    res.json(transfersWithDirection);
  } catch (error) {
    console.error('Error fetching recent wet transfers:', error);
    res.status(500).json({ message: "Failed to fetch recent wet transfers", error: error.message });
  }
});

// Get wet transfers by batch number
router.get('/batch/:batchNo', async (req, res) => {
  try {
    const { batchNo } = req.params;

    const wetTransfers = await prisma.wetTransfer.findMany({
      where: {
        batchNo: {
          contains: batchNo
        }
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(wetTransfers);
  } catch (error) {
    console.error('Error fetching wet transfers by batch number:', error);
    res.status(500).json({ message: "Failed to fetch wet transfers", error: error.message });
  }
});


// Get all CWS mappings

router.get('/cws-mappings', async (req, res) => {
  try {
    const mappings = await prisma.cWSMapping.findMany({
      include: {
        senderCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        receivingCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Format the response to match the expected structure in the frontend
    const formattedMappings = mappings.map(mapping => ({
      senderCws: mapping.senderCws.name,
      receivingCws: mapping.receivingCws.name,
      senderCwsId: mapping.senderCwsId,
      receivingCwsId: mapping.receivingCwsId
    }));

    res.json(formattedMappings);
  } catch (error) {
    console.error('Error fetching CWS mappings:', error);
    res.status(500).json({ message: "Failed to fetch CWS mappings", error: error.message });
  }
});

// Get a specific wet transfer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const wetTransfer = await prisma.wetTransfer.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!wetTransfer) {
      return res.status(404).json({ message: "Wet transfer not found" });
    }

    res.json(wetTransfer);
  } catch (error) {
    console.error('Error fetching wet transfer by ID:', error);
    res.status(500).json({ message: "Failed to fetch wet transfer", error: error.message });
  }
});
router.put('/update-cws-mappings', async (req, res) => {
  try {
    const { mappings } = req.body;

    // Validate request
    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ message: "Invalid request. 'mappings' must be an array." });
    }

    // Validate each mapping
    for (const mapping of mappings) {
      if (!mapping.senderCws || !mapping.receivingCws || !mapping.senderCwsId || !mapping.receivingCwsId) {
        return res.status(400).json({
          message: "Each mapping must contain 'senderCws', 'receivingCws', 'senderCwsId', and 'receivingCwsId'."
        });
      }
    }

    // Fetch all CWS from the database to validate the names
    const allCws = await prisma.cWS.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Create a map of CWS names to IDs for quick lookup
    const cwsNameToId = allCws.reduce((map, cws) => {
      map[cws.name] = cws.id;
      return map;
    }, {});

    // Process each mapping update
    const updatedResults = [];
    for (const mapping of mappings) {
      const newSenderCwsId = cwsNameToId[mapping.senderCws];
      const newReceivingCwsId = cwsNameToId[mapping.receivingCws];

      if (!newSenderCwsId || !newReceivingCwsId) {
        return res.status(400).json({
          message: `Invalid CWS name in mapping: ${mapping.senderCws} -> ${mapping.receivingCws} `
        });
      }

      // Update the mapping in the database
      await prisma.cWSMapping.update({
        where: {
          // Create a unique composite key based on the existing IDs
          senderCwsId_receivingCwsId: {
            senderCwsId: mapping.senderCwsId,
            receivingCwsId: mapping.receivingCwsId
          }
        },
        data: {
          senderCwsId: newSenderCwsId,
          receivingCwsId: newReceivingCwsId,
        },
      });

      updatedResults.push({
        senderCws: mapping.senderCws,
        receivingCws: mapping.receivingCws,
        previousSenderCwsId: mapping.senderCwsId,
        previousReceivingCwsId: mapping.receivingCwsId,
        newSenderCwsId,
        newReceivingCwsId,
      });
    }

    res.status(200).json({
      message: "CWS mappings updated successfully",
      results: updatedResults
    });
  } catch (error) {
    console.error('Error updating CWS mappings:', error);
    res.status(500).json({
      message: "Failed to update CWS mappings",
      error: error.message
    });
  }
});

// Update all wet transfers with a specific batch number
// router.put('/batch/:batchNo', async (req, res) => {
//   try {
//     const { batchNo } = req.params;
//     const {
//       date,
//       outputKgs,
//       moistureContent,
//       status,
//       notes
//     } = req.body;

//     // Check if batch number exists
//     const existingTransfers = await prisma.wetTransfer.findMany({
//       where: {
//         batchNo
//       }
//     });

//     if (existingTransfers.length === 0) {
//       return res.status(404).json({ message: `No wet transfers found with batch number: ${batchNo} ` });
//     }

//     // Update all wet transfers with the matching batch number
//     const updateData = {
//       ...(date && { date: new Date(date) }),
//       ...(outputKgs !== undefined && { outputKgs: parseFloat(outputKgs) }),
//       ...(moistureContent !== undefined && { moistureContent: parseFloat(moistureContent) }),
//       ...(status && { status }),
//       ...(notes && { notes })
//     };

//     // Only perform update if there's data to update
//     if (Object.keys(updateData).length === 0) {
//       return res.status(400).json({ message: "No valid update fields provided" });
//     }

//     const updatedTransfers = await prisma.wetTransfer.updateMany({
//       where: {
//         batchNo
//       },
//       data: updateData
//     });

//     // Fetch the updated records to return in the response
//     const transfers = await prisma.wetTransfer.findMany({
//       where: {
//         batchNo
//       },
//       include: {
//         sourceCws: {
//           select: {
//             id: true,
//             name: true,
//             code: true
//           }
//         },
//         destinationCws: {
//           select: {
//             id: true,
//             name: true,
//             code: true
//           }
//         }
//       }
//     });

//     res.json({
//       message: `Updated ${updatedTransfers.count} wet transfers with batch number: ${batchNo} `,
//       updatedTransfers: transfers
//     });
//   } catch (error) {
//     console.error('Error updating wet transfers by batch number:', error);
//     res.status(500).json({
//       message: "Failed to update wet transfers by batch number",
//       error: error.message
//     });
//   }
// });

// Update all wet transfers with a specific batch number
router.put('/batch/:batchNo', async (req, res) => {
  try {
    const { batchNo } = req.params;
    const {
      date,
      outputKgs,
      moistureContent,
      status,
      notes
    } = req.body;

    // Check if batch number exists
    const existingTransfers = await prisma.wetTransfer.findMany({
      where: {
        batchNo
      }
    });

    if (existingTransfers.length === 0) {
      return res.status(404).json({ message: `No wet transfers found with batch number: ${batchNo} ` });
    }

    // Update all wet transfers with the matching batch number
    const updateData = {
      ...(date && { date: new Date(date) }),
      // Remove outputKgs from automatic updates
      ...(moistureContent !== undefined && { moistureContent: parseFloat(moistureContent) }),
      ...(status && { status }),
      ...(notes && { notes })
    };

    // Only perform update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid update fields provided" });
    }

    const updatedTransfers = await prisma.wetTransfer.updateMany({
      where: {
        batchNo
      },
      data: updateData
    });

    // Fetch the updated records to return in the response
    const transfers = await prisma.wetTransfer.findMany({
      where: {
        batchNo
      },
      include: {
        sourceCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        destinationCws: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.json({
      message: `Updated ${updatedTransfers.count} wet transfers with batch number: ${batchNo} `,
      updatedTransfers: transfers
    });
  } catch (error) {
    console.error('Error updating wet transfers by batch number:', error);
    res.status(500).json({
      message: "Failed to update wet transfers by batch number",
      error: error.message
    });
  }
});

// Update a wet transfer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      outputKgs,
      moistureContent,
      status,
      notes
    } = req.body;

    const wetTransfer = await prisma.wetTransfer.update({
      where: {
        id: parseInt(id)
      },
      data: {
        date: date ? new Date(date) : undefined,
        outputKgs: outputKgs ? parseFloat(outputKgs) : undefined,
        moistureContent: moistureContent ? parseFloat(moistureContent) : undefined,
        status,
        notes
      }
    });

    res.json(wetTransfer);
  } catch (error) {
    console.error('Error updating wet transfer:', error);
    res.status(500).json({ message: "Failed to update wet transfer", error: error.message });
  }
});

// update existing CWS mapping

router.delete('/cws-mappings/:senderCwsId/:receivingCwsId', async (req, res) => {
  try {
    const { senderCwsId, receivingCwsId } = req.params;

    // Validate IDs
    const senderCwsIdInt = parseInt(senderCwsId);
    const receivingCwsIdInt = parseInt(receivingCwsId);

    if (isNaN(senderCwsIdInt) || isNaN(receivingCwsIdInt)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    // Delete the mapping using individual fields
    // Since the compound key doesn't seem to be defined in your schema
    await prisma.cWSMapping.deleteMany({
      where: {
        AND: [
          { senderCwsId: senderCwsIdInt },
          { receivingCwsId: receivingCwsIdInt }
        ]
      }
    });

    res.json({ message: "CWS mapping deleted successfully" });
  } catch (error) {
    console.error('Error deleting CWS mapping:', error);
    res.status(500).json({ message: "Failed to delete CWS mapping", error: error.message });
  }
});
// Delete a wet transfer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the processing ID before deleting
    const wetTransfer = await prisma.wetTransfer.findUnique({
      where: { id: parseInt(id) },
      select: { processingId: true }
    });

    if (!wetTransfer) {
      return res.status(404).json({ message: "Wet transfer not found" });
    }

    // Delete the wet transfer
    await prisma.wetTransfer.delete({
      where: { id: parseInt(id) }
    });

    // Update the processing status back to IN_PROGRESS
    await prisma.processing.update({
      where: { id: wetTransfer.processingId },
      data: { status: "IN_PROGRESS" }
    });

    res.json({ message: "Wet transfer deleted successfully" });
  } catch (error) {
    console.error('Error deleting wet transfer:', error);
    res.status(500).json({ message: "Failed to delete wet transfer", error: error.message });
  }
});

// Delete a CWS mapping


router.post('/map-cws', async (req, res) => {
  try {
    const { mappings } = req.body;

    // Validate request
    if (!mappings || !Array.isArray(mappings)) {
      return res.status(400).json({ message: "Invalid request. 'mappings' must be an array." });
    }

    // Validate each mapping
    for (const mapping of mappings) {
      if (!mapping.senderCws || !mapping.receivingCws) {
        return res.status(400).json({ message: "Each mapping must contain 'senderCws' and 'receivingCws'." });
      }
    }

    // Fetch all CWS from the database to validate the names
    const allCws = await prisma.cWS.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Create a map of CWS names to IDs for quick lookup
    const cwsNameToId = allCws.reduce((map, cws) => {
      map[cws.name] = cws.id;
      return map;
    }, {});

    // Process each mapping
    const mappedResults = [];
    for (const mapping of mappings) {
      const senderCwsId = cwsNameToId[mapping.senderCws];
      const receivingCwsId = cwsNameToId[mapping.receivingCws];

      if (!senderCwsId || !receivingCwsId) {
        return res.status(400).json({ message: `Invalid CWS name in mapping: ${mapping.senderCws} -> ${mapping.receivingCws} ` });
      }

      // Store the mapping (you can create a new model for this if needed)
      // For now, we'll just log it or store it in a simple table
      mappedResults.push({
        senderCws: mapping.senderCws,
        receivingCws: mapping.receivingCws,
        senderCwsId,
        receivingCwsId,
      });
    }

    // Save mappings to the database (if you have a model for this)
    // Example: await prisma.cwsMapping.createMany({ data: mappedResults });
    await prisma.cWSMapping.createMany({
      data: mappedResults.map(mapping => ({
        senderCwsId: mapping.senderCwsId,
        receivingCwsId: mapping.receivingCwsId,
      })),
    });

    res.status(201).json({ message: "CWS mappings processed successfully", results: mappedResults });
  } catch (error) {
    console.error('Error mapping CWS:', error);
    res.status(500).json({ message: "Failed to map CWS", error: error.message });
  }
});


export default router;