import { Router } from 'express';
import { getAllBatchesInTesting, sendBatchToTest, sendTestResult, getBatchesInTestingBycws, createQualityForAllBaggingOffController, createMissingQualityForBaggingOffController } from '../../controller/quality/quality.js';
import { protectedRoute } from '../../middleware/auth.js';


const router = Router();

/**
 * @swagger
 * /quality/sendBatchToTest:
 *   post:
 *     summary: Send multiple batches to testing
 *     tags: [Quality Sample]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batches:
 *                 type: array
 *                 description: Array of batches to send to testing
 *                 items:
 *                   type: object
 *                   properties:
 *                     batchNo:
 *                       type: string
 *                       description: The batch number of the processing record.
 *                     cwsMoisture1:
 *                       type: object
 *                       description: "Screen data (e.g., ``)."
 *                       example: { "A0": 2, "A1": 3 }
 *     responses:
 *       201:
 *         description: Batches sent to testing successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       batchNo:
 *                         type: string
 *                       cwsId:
 *                         type: integer
 *                       processingId:
 *                         type: integer
 *                       cwsMoisture1:
 *                         type: object
 *                         example: { "A0": 2, "A1": 3 }
 *                       status:
 *                         type: string
 *                       labMoisture:
 *                         type: object
 *                       screen:
 *                         type: object
 *                       defect:
 *                         type: number
 *                       potatoCups:
 *                         type: number
 *                       overallScore:
 *                         type: number
 *                       ppScore:
 *                         type: number
 *                       sampleStorageId:
 *                         type: integer
 *                       notes:
 *                         type: string
 *                       category:
 *                         type: string
 *                       cwsMoisture2:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid or missing batches array
 *       404:
 *         description: Processing not found for one or more batch numbers
 *       500:
 *         description: Internal server error
 *     description: |
 *       The `keys` object is dynamically determined based on the `processingType` of the batch. It is used to map specific fields in the quality record:
 *       - If `processingType` is `"NATURAL"`, `keys` will be `{ key1: "N1", key2: "N2" }`.
 *       - If `processingType` is `"HONEY"`, `keys` will be `{ key1: "H1", key2: "H2" }`.
 *       - If `processingType` is `"FULLY_WASHED"` or any other value, `keys` will default to `{ key1: "A0", key2: "A1" }`.
 *       
 *       These keys are used to structure the data for fields such as `cwsMoisture1`, `labMoisture`, `screen`, `defect`, `potatoCups`, `overallScore`, `ppScore`, `notes`, `category`, and `cwsMoisture2`. For example:
 *       - For `processingType: "NATURAL"`, `cwsMoisture1` will be stored as `{ "N1": value, "N2": value }`.
 *       - For `processingType: "HONEY"`, `cwsMoisture1` will be stored as `{ "H1": value, "H2": value }`.
 *       - For `processingType: "FULLY_WASHED"`, `cwsMoisture1` will be stored as `{ "A0": value, "A1": value }`.
 */
router.post('/sendBatchToTest', protectedRoute, sendBatchToTest);
/**
 * @swagger
 * /quality/getAllBatchesInTesting:
 *   get:
 *     summary: Get all batches in testing
 *     tags: [Quality Sample]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of records per page.
 *     responses:
 *       200:
 *         description: A list of batches in testing with grouped A0 and A1 data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of batches in testing.
 *                   example: 100
 *                 batches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The unique ID of the batch.
 *                         example: 1
 *                       batchNo:
 *                         type: string
 *                         description: The batch number.
 *                         example: "25MUS1303A"
 *                       cwsId:
 *                         type: integer
 *                         description: The CWS ID associated with the batch.
 *                         example: 6
 *                       processingId:
 *                         type: integer
 *                         description: The processing ID associated with the batch.
 *                         example: 414
 *                       status:
 *                         type: string
 *                         description: The status of the batch.
 *                         example: "TESTING"
 *                       cws:
 *                         type: object
 *                         description: Details of the Coffee Washing Station (CWS).
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: The unique ID of the CWS.
 *                             example: 6
 *                           name:
 *                             type: string
 *                             description: The name of the CWS.
 *                             example: "CWS Name"
 *                           code:
 *                             type: string
 *                             description: The code of the CWS.
 *                             example: "CWS123"
 *                           location:
 *                             type: string
 *                             description: The location of the CWS.
 *                             example: "Location Name"
 *                       processing:
 *                         type: object
 *                         description: Details of the processing record.
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: The unique ID of the processing record.
 *                             example: 414
 *                           batchNo:
 *                             type: string
 *                             description: The batch number of the processing record.
 *                             example: "25MUS1303A"
 *                           processingType:
 *                             type: string
 *                             description: The type of processing (e.g., NATURAL, HONEY, FULLY_WASHED).
 *                             example: "FULLY_WASHED"
 *                           grade:
 *                             type: string
 *                             description: The grade of the batch.
 *                             example: "Grade A"
 *                           status:
 *                             type: string
 *                             description: The status of the processing record.
 *                             example: "TESTING"
 *                           isTestSent:
 *                             type: boolean
 *                             description: Whether the batch has been sent for testing.
 *                             example: true
 *                       A0:
 *                         type: object
 *                         description: Data specific to A0.
 *                         properties:
 *                           cwsMoisture1:
 *                             type: string
 *                             description: CWS moisture for A0.
 *                             example: "12"
 *                           labMoisture:
 *                             type: string
 *                             description: Lab moisture for A0.
 *                             example: "10"
 *                           screen:
 *                             type: object
 *                             description: Screen data for A0.
 *                             example: { "16+": 0.18, "15+": 0.17 ,"14": 0.16, "12/13": 0.15, "B/12": 0.14 }
 *                           defect:
 *                             type: string
 *                             description: Defect percentage for A0.
 *                             example: "2"
 *                           potatoCups:
 *                             type: string
 *                             description: Potato cups percentage for A0.
 *                             example: "20.8"
 *                           overallScore:
 *                             type: string
 *                             description: Overall score for A0.
 *                             example: "87.4"
 *                           ppScore:
 *                             type: string
 *                             description: PP score for A0.
 *                             example: "98"
 *                           sampleStorageId:
 *                             type: integer
 *                             description: Sample storage ID for A0.
 *                             example: 1
 *                           notes:
 *                             type: string
 *                             description: Notes for A0.
 *                             example: "Sample A0 notes"
 *                           category:
 *                             type: string
 *                             description: Category for A0.
 *                             example: "C1"
 *                           cwsMoisture2:
 *                             type: string
 *                             description: CWS moisture 2 for A0.
 *                             example: "12"
 *                       A1:
 *                         type: object
 *                         description: Data specific to A1.
 *                         properties:
 *                           cwsMoisture1:
 *                             type: string
 *                             description: CWS moisture for A1.
 *                             example: "14"
 *                           labMoisture:
 *                             type: string
 *                             description: Lab moisture for A1.
 *                             example: "11"
 *                           screen:
 *                             type: object
 *                             description: Screen data for A1.
 *                             example: { "16+": 0.19, "15+": 0.16 ,"14": 0.15, "12/13": 0.14, "B/12": 0.13 }
 *                           defect:
 *                             type: string
 *                             description: Defect percentage for A1.
 *                             example: "3"
 *                           potatoCups:
 *                             type: string
 *                             description: Potato cups percentage for A1.
 *                             example: "21"
 *                           overallScore:
 *                             type: string
 *                             description: Overall score for A1.
 *                             example: "88"
 *                           ppScore:
 *                             type: string
 *                             description: PP score for A1.
 *                             example: "97.5"
 *                           sampleStorageId:
 *                             type: integer
 *                             description: Sample storage ID for A1.
 *                             example: 2
 *                           notes:
 *                             type: string
 *                             description: Notes for A1.
 *                             example: "Sample A1 notes"
 *                           category:
 *                             type: string
 *                             description: Category for A1.
 *                             example: "C2"
 *                           cwsMoisture2:
 *                             type: string
 *                             description: CWS moisture 2 for A1.
 *                             example: "14"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: The creation timestamp of the batch.
 *                         example: "2025-05-06T12:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: The last update timestamp of the batch.
 *                         example: "2025-05-06T12:30:00.000Z"
 *       400:
 *         description: Invalid request parameters.
 *       500:
 *         description: Internal server error.
 */
router.get('/getAllBatchesInTesting', protectedRoute, getAllBatchesInTesting);
/**
 * @swagger
 * /quality/getBatchesInTestingBycws/{cwsId}:
 *   get:
 *     summary: Get all batches in testing for a specific CWS
 *     tags: [Quality Sample]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cwsId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the Coffee Washing Station (CWS).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of records per page.
 *     responses:
 *       200:
 *         description: A list of batches in testing for the specified CWS.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "cws Batches in testing retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The unique ID of the batch.
 *                         example: 1
 *                       batchNo:
 *                         type: string
 *                         description: The batch number.
 *                         example: "25MUS1303A"
 *                       cwsId:
 *                         type: integer
 *                         description: The CWS ID associated with the batch.
 *                         example: 6
 *                       processingId:
 *                         type: integer
 *                         description: The processing ID associated with the batch.
 *                         example: 414
 *                       status:
 *                         type: string
 *                         description: The status of the batch.
 *                         example: "TESTING"
 *                       cws:
 *                         type: object
 *                         description: Details of the Coffee Washing Station (CWS).
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: The unique ID of the CWS.
 *                             example: 6
 *                           name:
 *                             type: string
 *                             description: The name of the CWS.
 *                             example: "CWS Name"
 *                           code:
 *                             type: string
 *                             description: The code of the CWS.
 *                             example: "CWS123"
 *                           location:
 *                             type: string
 *                             description: The location of the CWS.
 *                             example: "Location Name"
 *                       processing:
 *                         type: object
 *                         description: Details of the processing record.
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: The unique ID of the processing record.
 *                             example: 414
 *                           batchNo:
 *                             type: string
 *                             description: The batch number of the processing record.
 *                             example: "25MUS1303A"
 *                           processingType:
 *                             type: string
 *                             description: The type of processing (e.g., NATURAL, HONEY, FULLY_WASHED).
 *                             example: "FULLY_WASHED"
 *                           grade:
 *                             type: string
 *                             description: The grade of the batch.
 *                             example: "Grade A"
 *                           status:
 *                             type: string
 *                             description: The status of the processing record.
 *                             example: "TESTING"
 *                           isTestSent:
 *                             type: boolean
 *                             description: Whether the batch has been sent for testing.
 *                             example: true
 *                       A0:
 *                         type: object
 *                         description: Data specific to A0.
 *                         properties:
 *                           cwsMoisture1:
 *                             type: string
 *                             description: CWS moisture for A0.
 *                             example: "12"
 *                           labMoisture:
 *                             type: string
 *                             description: Lab moisture for A0.
 *                             example: "10"
 *                           screen:
 *                             type: object
 *                             description: Screen data for A0.
 *                             example: { "16+": 0.18, "15+": 0.17 }
 *                           defect:
 *                             type: string
 *                             description: Defect percentage for A0.
 *                             example: "2"
 *                           potatoCups:
 *                             type: string
 *                             description: Potato cups percentage for A0.
 *                             example: "20.8"
 *                           overallScore:
 *                             type: string
 *                             description: Overall score for A0.
 *                             example: "87.4"
 *                           ppScore:
 *                             type: string
 *                             description: PP score for A0.
 *                             example: "98"
 *                           sampleStorageId:
 *                             type: integer
 *                             description: Sample storage ID for A0.
 *                             example: 1
 *                           notes:
 *                             type: string
 *                             description: Notes for A0.
 *                             example: "Sample A0 notes"
 *                           category:
 *                             type: string
 *                             description: Category for A0.
 *                             example: "C1"
 *                           cwsMoisture2:
 *                             type: string
 *                             description: CWS moisture 2 for A0.
 *                             example: "12"
 *                       A1:
 *                         type: object
 *                         description: Data specific to A1.
 *                         properties:
 *                           cwsMoisture1:
 *                             type: string
 *                             description: CWS moisture for A1.
 *                             example: "14"
 *                           labMoisture:
 *                             type: string
 *                             description: Lab moisture for A1.
 *                             example: "11"
 *                           screen:
 *                             type: object
 *                             description: Screen data for A1.
 *                             example: { "16+": 0.19, "15+": 0.16 }
 *                           defect:
 *                             type: string
 *                             description: Defect percentage for A1.
 *                             example: "3"
 *                           potatoCups:
 *                             type: string
 *                             description: Potato cups percentage for A1.
 *                             example: "21"
 *                           overallScore:
 *                             type: string
 *                             description: Overall score for A1.
 *                             example: "88"
 *                           ppScore:
 *                             type: string
 *                             description: PP score for A1.
 *                             example: "97.5"
 *                           sampleStorageId:
 *                             type: integer
 *                             description: Sample storage ID for A1.
 *                             example: 2
 *                           notes:
 *                             type: string
 *                             description: Notes for A1.
 *                             example: "Sample A1 notes"
 *                           category:
 *                             type: string
 *                             description: Category for A1.
 *                             example: "C2"
 *                           cwsMoisture2:
 *                             type: string
 *                             description: CWS moisture 2 for A1.
 *                             example: "14"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: The creation timestamp of the batch.
 *                         example: "2025-05-06T12:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         description: The last update timestamp of the batch.
 *                         example: "2025-05-06T12:30:00.000Z"
 *       400:
 *         description: Invalid request parameters.
 *       403:
 *         description: Access denied.
 *       500:
 *         description: Internal server error.
 */
router.get('/getBatchesInTestingBycws/:cwsId', protectedRoute, getBatchesInTestingBycws);
/**
 * @swagger
 * /quality/sendTestResult:
 *   put:
 *     summary: Send Result of Test for Multiple Batches
 *     tags: [Quality Sample]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [batches]
 *             properties:
 *               batches:
 *                 type: array
 *                 description: List of batch test results to update
 *                 items:
 *                   type: object
 *                   required: [batchNo]
 *                   properties:
 *                     batchNo:
 *                       type: string
 *                       description: Batch number of the quality record
 *                       example: BATCH001
 *                     labMoisture:
 *                       type: object
 *                       description: Lab moisture values keyed by processing type (e.g., A0, A1)
 *                       example: { "A0": 2.5, "A1": 3.0 }
 *                     screen:
 *                       type: object
 *                       description: Screen results for each key
 *                       example: {
 *                         "A0": { "16+": 0.18, "15": 0.17, "14": 0.15, "13": 0.14, "B/12": 0.13 },
 *                         "A1": { "16+": 0.19, "15": 0.16, "14": 0.15, "13": 0.14, "B/12": 0.13 }
 *                       }
 *                     defect:
 *                       type: object
 *                       description: Defect percentages for each key
 *                       example: { "A0": 3.5, "A1": 4.0 }
 *                     ppScore:
 *                       type: object
 *                       description: Pre-processing scores
 *                       example: { "A0": 98.0, "A1": 97.5 }
 *                     sampleStorageId_0:
 *                       type: integer
 *                       description: Storage ID for the first key
 *                       example: 1
 *                     sampleStorageId_1:
 *                       type: integer
 *                       description: Storage ID for the second key
 *                       example: 2
 *                     notes:
 *                       type: object
 *                       description: Notes for each key
 *                       example: { "A0": "Sample A0 notes", "A1": "Sample A1 notes" }
 *     responses:
 *       200:
 *         description: Test results updated successfully for all batches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Test results updated successfully
 *                 updatedBatches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       batchNo:
 *                         type: string
 *                       status:
 *                         type: string
 *                         example: TESTED
 *       400:
 *         description: Validation error or missing required fields
 *       404:
 *         description: One or more quality records not found
 *       500:
 *         description: Internal server error
 *     description: |
 *       The `keys` object is dynamically determined based on the `processingType` of the batch. It is used to map specific fields in the quality record:
 *       - If `processingType` is `"NATURAL"`, `keys` will be `{ key1: "N1", key2: "N2" }`.
 *       - If `processingType` is `"HONEY"`, `keys` will be `{ key1: "H1", key2: "H2" }`.
 *       - If `processingType` is `"FULLY_WASHED"` or any other value, `keys` will default to `{ key1: "A0", key2: "A1" }`.
 *       
 *       These keys are used to structure the data for fields such as `cwsMoisture1`, `labMoisture`, `screen`, `defect`, `potatoCups`, `overallScore`, `ppScore`, `notes`, `category`, and `cwsMoisture2`. For example:
 *       - For `processingType: "NATURAL"`, `cwsMoisture1` will be stored as `{ "N1": value, "N2": value }`.
 *       - For `processingType: "HONEY"`, `cwsMoisture1` will be stored as `{ "H1": value, "H2": value }`.
 *       - For `processingType: "FULLY_WASHED"`, `cwsMoisture1` will be stored as `{ "A0": value, "A1": value }`.
 */
router.put('/sendTestResult/', protectedRoute, sendTestResult);
/**
 * @swagger
 * /quality/createQualityForAllBaggingOff:
 *   post:
 *     summary: Create quality records for all baggingOff records (bulk operation)
 *     description: Creates quality records for all unique baggingOff records (latest per batchNo) that don't already have quality records.
 *     tags: [Quality Sample]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Quality records created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Successfully created 15 quality records"
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                       description: Number of quality records created
 *                       example: 15
 *                     createdQualities:
 *                       type: array
 *                       description: Array of created quality records with metadata
 *                       items:
 *                         type: object
 *                         properties:
 *                           qualityId:
 *                             type: integer
 *                             description: ID of the created quality record
 *                           batchNo:
 *                             type: string
 *                             description: Batch number
 *                           cwsId:
 *                             type: integer
 *                             description: CWS ID
 *                           processingId:
 *                             type: integer
 *                             description: Processing ID
 *                           processingType:
 *                             type: string
 *                             enum: [NATURAL, HONEY, FULLY_WASHED]
 *                             description: Type of processing
 *                           occurrence_count:
 *                             type: integer
 *                             description: Number of baggingOff records with this batchNo
 *                     errors:
 *                       type: array
 *                       nullable: true
 *                       description: Array of errors encountered during processing
 *                       items:
 *                         type: object
 *                         properties:
 *                           batchNo:
 *                             type: string
 *                             description: Batch number that failed
 *                           error:
 *                             type: string
 *                             description: Error message
 *       403:
 *         description: Access denied - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 *                 message:
 *                   type: string
 *                   example: "Access denied: You do not have permission to perform this operation"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   description: Error message
 */
router.post('/createQualityForAllBaggingOff', protectedRoute, createQualityForAllBaggingOffController);
/**
 * @swagger
 * /quality/create-missing-quality:
 *   post:
 *     summary: Create quality records for baggingOff batches missing in the quality table
 *     tags: [Quality Sample]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Successfully created missing quality records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     created:
 *                       type: integer
 *                     createdQualities:
 *                       type: array
 *                       items:
 *                         type: object
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/create-missing-quality', protectedRoute, createMissingQualityForBaggingOffController);



export default router;
