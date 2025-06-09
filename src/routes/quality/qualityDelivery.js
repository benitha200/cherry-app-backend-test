import express from 'express';
import { protectedRoute } from '../../middleware/auth.js';
import { DeliveryReportController, getAllBatchesInDeliveryTesting, getAllTrucksInDeliveryTesting, getBatchesByTruck, sendDeliveryTestResult, SaveAllHighGradeToqualityDelivery, createMissingQualityDelivery } from '../../controller/quality/qualityDelivery.js';
// import { getBatchesFromCsvFile } from '../../services/quality/qualityDelivery.js';






const router = express.Router();

/**
 * @swagger
 * /quality-delivery/getBatches-delivery-testing:
 *   get:
 *     summary: Get batches in Delivery Testing for a specific CWS
 *     tags: [Quality Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit for pagination
 *     responses:
 *       200:
 *         description: Successfully retrieved batches in delivery testing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: cws Batches in delivery testing retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     batches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 3
 *                           batchNo:
 *                             type: string
 *                             example: "25NZH1205"
 *                           transferId:
 *                             type: integer
 *                             example: 48
 *                           baggingOffId:
 *                             type: integer
 *                             example: 24
 *                           processingId:
 *                             type: integer
 *                             example: 60
 *                           cwsId:
 *                             type: integer
 *                             example: 33
 *                           status:
 *                             type: string
 *                             example: "TESTING"
 *                           gradeKey:
 *                             type: string
 *                             example: "N2"
 *                           cwsMoisture:
 *                             type: number
 *                             example: 12
 *                           labMoisture:
 *                             type: number
 *                             example: 0
 *                           screen:
 *                             type: object
 *                             additionalProperties:
 *                               type: string
 *                             example: {
 *                               "13": "",
 *                               "14": "",
 *                               "15": "",
 *                               "16": "",
 *                               "B/12": ""
 *                             }
 *                           defect:
 *                             type: number
 *                             example: 0
 *                           ppScore:
 *                             type: number
 *                             example: 0
 *                           sampleStorageId:
 *                             type: integer
 *                             example: 2
 *                           notes:
 *                             type: string
 *                             example: ""
 *                           category:
 *                             type: string
 *                             example: "C2"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-05-13T22:09:06.367Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-05-13T22:09:06.367Z"
 *                           sampleStorage:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 2
 *                               name:
 *                                 type: string
 *                                 example: "C1"
 *                               description:
 *                                 type: string
 *                                 example: "No description"
 *                           transfer:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 48
 *                               batchNo:
 *                                 type: string
 *                                 example: "25NZH1205"
 *                               gradeDetails:
 *                                 type: object
 *                                 example: {
 *                                   "N2": {
 *                                     "numberOfBags": 34,
 *                                     "cupProfile": "C1",
 *                                     "moistureContent": 12
 *                                   }
 *                                 }
 *                               truckNumber:
 *                                 type: string
 *                                 example: "RI022B"
 *                               driverName:
 *                                 type: string
 *                                 example: "yves"
 *                               driverPhone:
 *                                 type: string
 *                                 example: "322"
 *                           baggingOff:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 24
 *                               batchNo:
 *                                 type: string
 *                                 example: "25NZH1205-2"
 *                               date:
 *                                 type: string
 *                                 format: date
 *                                 example: "2025-05-13"
 *                               outputKgs:
 *                                 type: object
 *                                 additionalProperties:
 *                                   type: number
 *                                 example: {
 *                                   "N1": 100,
 *                                   "N2": 123
 *                                 }
 *                               totalOutputKgs:
 *                                 type: number
 *                                 example: 223
 *                               processingType:
 *                                 type: string
 *                                 example: "NATURAL"
 *                           processing:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 60
 *                               batchNo:
 *                                 type: string
 *                                 example: "25NZH1205-2"
 *                               processingType:
 *                                 type: string
 *                                 example: "NATURAL"
 *                               grade:
 *                                 type: string
 *                                 example: "A"
 *                               status:
 *                                 type: string
 *                                 example: "COMPLETED"
 *                           cws:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 33
 *                               name:
 *                                 type: string
 *                                 example: "Nzahaha"
 *                               code:
 *                                 type: string
 *                                 example: "NZH"
 *                               location:
 *                                 type: string
 *                                 example: "Rusizi"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 2
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/getBatches-delivery-testing/', protectedRoute, getAllBatchesInDeliveryTesting);

/**
 * @swagger
 * /quality-delivery/get-all-grouped-trucks:
 *   get:
 *     summary: Get all unique trucks that have delivered batches
 *     tags: [Quality Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unique truck deliveries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 trucks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       truckNumber:
 *                         type: string
 *                         example: "RAA001A"
 *                       driverName:
 *                         type: string
 *                         example: "John Doe"
 *                       driverPhone:
 *                         type: string
 *                         example: "0788001122"
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Internal server error
 */
router.get('/get-all-grouped-trucks', protectedRoute, getAllTrucksInDeliveryTesting);
/**
 * @swagger
 * /quality-delivery/getBatches-by-truck/{truckNumber}/{transferDate}:
 *   get:
 *     summary: Get batches in Delivery Testing by truck number and transfer date
 *     description: Retrieves batches filtered by truck number and transfer date in YYYY-MM-DD HH:MM format
 *     tags: [Quality Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: truckNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: RAA001A
 *         description: The truck number to filter batches by
 *       - in: path
 *         name: transferDate
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$'
 *           example: '2025-05-15 20:07'
 *         description: Transfer Date to filter batches by in YYYY-MM-DD HH:MM format
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Successfully retrieved batches grouped by batchNo, processingId, and baggingOffId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Batches in delivery testing by truck RAA001A retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     batches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           batchNo:
 *                             type: string
 *                             example: "25NZH1205"
 *                           baggingOff:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 24
 *                               batchNo:
 *                                 type: string
 *                                 example: "25NZH1205-2"
 *                               date:
 *                                 type: string
 *                                 format: date
 *                                 example: "2025-05-13"
 *                               outputKgs:
 *                                 type: object
 *                                 example: { "N1": 120, "N2": 140 }
 *                               totalOutputKgs:
 *                                 type: number
 *                                 example: 260
 *                               processingType:
 *                                 type: string
 *                                 example: "NATURAL"
 *                           processing:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 60
 *                               batchNo:
 *                                 type: string
 *                                 example: "25NZH1205-2"
 *                               processingType:
 *                                 type: string
 *                                 example: "NATURAL"
 *                               grade:
 *                                 type: string
 *                                 example: "A"
 *                               status:
 *                                 type: string
 *                                 example: "COMPLETED"
 *                           cws:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 33
 *                               name:
 *                                 type: string
 *                                 example: "Nzahaha"
 *                               code:
 *                                 type: string
 *                                 example: "NZH"
 *                               location:
 *                                 type: string
 *                                 example: "Rusizi"
 *                           N2:
 *                             type: object
 *                             description: Grade key (can be N2, A1, etc.)
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 102
 *                               qualityId:
 *                                 type: integer
 *                                 example: 55
 *                               transferId:
 *                                 type: integer
 *                                 example: 48
 *                               processingId:
 *                                 type: integer
 *                                 example: 60
 *                               transfer:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 48
 *                                   outputKgs:
 *                                     type: number
 *                                     example: 1000
 *                                   truckNumber:
 *                                     type: string
 *                                     example: "RAA001A"
 *                                   driverName:
 *                                     type: string
 *                                     example: "John Doe"
 *                                   driverPhone:
 *                                     type: string
 *                                     example: "0788001122"
 *                               cwsMoisture:
 *                                 type: number
 *                                 example: 12.5
 *                               labMoisture:
 *                                 type: number
 *                                 example: 10.5
 *                               screen:
 *                                 type: object
 *                                 example: {
 *                                   "13": "",
 *                                   "14": "",
 *                                   "15": "",
 *                                   "16": "",
 *                                   "B/12": ""
 *                                 }
 *                               defect:
 *                                 type: number
 *                                 example: 0
 *                               ppScore:
 *                                 type: number
 *                                 example: 86
 *                               category:
 *                                 type: string
 *                                 example: "C2"
 *                               notes:
 *                                 type: string
 *                                 example: "Some note"
 *                               sampleStorage:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 2
 *                                   name:
 *                                     type: string
 *                                     example: "Cup Profile 1"
 *                                   description:
 *                                     type: string
 *                                     example: "Sample shelf"
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2025-05-13T22:09:06.367Z"
 *                               updatedAt:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2025-05-13T22:09:06.367Z"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 5
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 1
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/getBatches-by-truck/:truckNumber/:transferDate/:transportGroupId', protectedRoute, getBatchesByTruck);
/**
 * @swagger
 * /quality-delivery/send-delivery-test-result:
 *   put:
 *     summary: Send delivery test results for multiple batches (partial or full updates)
 *     tags: [Quality Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryKgs, batches]
 *             properties:
 *               categoryKgs:
 *                 type: object
 *                 description: Weight in kilograms per category
 *                 required: ["c2", "c1", "s86", "s87", "s88", "-"]
 *                 properties:
 *                   "c2":
 *                     type: number
 *                     example: 0
 *                   "c1":
 *                     type: number
 *                     example: 0
 *                   "s86":
 *                     type: number
 *                     example: 0
 *                   "s87":
 *                     type: number
 *                     example: 0
 *                   "s88":
 *                     type: number
 *                     example: 0
 *                   "-":
 *                     type: number
 *                     example: 0
 *               batches:
 *                 type: array
 *                 description: List of batch test results to update
 *                 items:
 *                   type: object
 *                   required: [id, batchNo, transferId]
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: ID of the qualityDelivery record
 *                       example: 2
 *                     batchNo:
 *                       type: string
 *                       description: Batch number of the quality record
 *                       example: "25NZH1205"
 *                     transferId:
 *                       type: integer
 *                       description: Related transfer record ID
 *                       example: 46
 *                     labMoisture:
 *                       type: number
 *                       description: Lab moisture percentage
 *                       example: 3.0
 *                     screen:
 *                       type: object
 *                       description: Screen results; only non-empty values will be used to update existing screen data
 *                       additionalProperties:
 *                         type: number
 *                       example: {
 *                         "13": 0.14,
 *                         "14": 0.15,
 *                         "15": 0.17,
 *                         "16": 0.18,
 *                         "B/12": 0.13
 *                       }
 *                     defect:
 *                       type: number
 *                       description: Defect percentage
 *                       example: 24.3
 *                     ppScore:
 *                       type: number
 *                       description: Pre-processing score
 *                       example: 89.2
 *                     sampleStorageId:
 *                       type: integer
 *                       description: Sample storage location ID
 *                       example: 3
 *                     notes:
 *                       type: string
 *                       description: Optional notes for this batch
 *                       example: "is Nice"
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
 */
router.put('/send-delivery-test-result/', protectedRoute, sendDeliveryTestResult);
/**
 * @swagger
 * /quality-delivery/testing-delivery-report:
 *   get:
 *     summary: Get all batches in Delivery Testing report
 *     tags: [Quality Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all batches in delivery testing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Delivery testing report retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 3
 *                     batches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           batchNo:
 *                             type: string
 *                             example: "25NZH1205-2"
 *                           sample:
 *                             type: object
 *                             properties:
 *                               outputKgs:
 *                                 type: object
 *                                 additionalProperties:
 *                                   type: number
 *                                 example: {
 *                                   "N1": 100,
 *                                   "N2": 123
 *                                 }
 *                               totalOutputKgs:
 *                                 type: number
 *                                 example: 223
 *                               N1:
 *                                 type: object
 *                                 properties:
 *                                   cwsMoisture:
 *                                     type: number
 *                                     example: 12
 *                                   labMoisture:
 *                                     type: number
 *                                     example: 12.5
 *                                   screen:
 *                                     type: object
 *                                     properties:
 *                                       "16+":
 *                                         type: string
 *                                         example: "15"
 *                                       "15":
 *                                         type: string
 *                                         example: "25"
 *                                       "14":
 *                                         type: string
 *                                         example: "40"
 *                                       "13":
 *                                         type: string
 *                                         example: "15"
 *                                       "B/12":
 *                                         type: string
 *                                         example: "5"
 *                                   "AVG15+":
 *                                     type: number
 *                                     example: 40
 *                                   "AVG13/14":
 *                                     type: number
 *                                     example: 55
 *                                   defect:
 *                                     type: number
 *                                     example: 2
 *                                   "AVGLG":
 *                                     type: number
 *                                     example: 17
 *                                   ppScore:
 *                                     type: number
 *                                     example: 85
 *                                   category:
 *                                     type: string
 *                                     example: "C1"
 *                               N2:
 *                                 type: object
 *                                 properties:
 *                                   # Similar structure as N1
 *                           delivery:
 *                             type: object
 *                             properties:
 *                               outputKgs:
 *                                 type: object
 *                                 additionalProperties:
 *                                   type: number
 *                                 example: {
 *                                   "N1": 100,
 *                                   "N2": 123
 *                                 }
 *                               totalOutputKgs:
 *                                 type: number
 *                                 example: 223
 *                               N1:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: integer
 *                                     example: 3
 *                                   cwsMoisture:
 *                                     type: number
 *                                     example: 12
 *                                   labMoisture:
 *                                     type: number
 *                                     example: 12.5
 *                                   screen:
 *                                     type: object
 *                                     properties:
 *                                       "16+":
 *                                         type: string
 *                                         example: "15"
 *                                       "15":
 *                                         type: string
 *                                         example: "25"
 *                                       "14":
 *                                         type: string
 *                                         example: "40"
 *                                       "13":
 *                                         type: string
 *                                         example: "15"
 *                                       "B/12":
 *                                         type: string
 *                                         example: "5"
 *                                   "AVG15+":
 *                                     type: number
 *                                     example: 40
 *                                   "AVG13/14":
 *                                     type: number
 *                                     example: 55
 *                                   defect:
 *                                     type: number
 *                                     example: 2
 *                                   "AVGLG":
 *                                     type: number
 *                                     example: 17
 *                                   ppScore:
 *                                     type: number
 *                                     example: 85
 *                                   category:
 *                                     type: string
 *                                     example: "C1"
 *                                   sampleStorage:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: integer
 *                                         example: 2
 *                                       name:
 *                                         type: string
 *                                         example: "C1"
 *                                       description:
 *                                         type: string
 *                                         example: "No description"
 *                                   transfer:
 *                                     type: object
 *                                     properties:
 *                                       id:
 *                                         type: integer
 *                                         example: 48
 *                                       truckNumber:
 *                                         type: string
 *                                         example: "RI022B"
 *                                       driverName:
 *                                         type: string
 *                                         example: "yves"
 *                                       driverPhone:
 *                                         type: string
 *                                         example: "322"
 *                                   createdAt:
 *                                     type: string
 *                                     format: date-time
 *                                     example: "2025-05-13T22:09:06.367Z"
 *                                   updatedAt:
 *                                     type: string
 *                                     format: date-time
 *                                     example: "2025-05-13T22:09:06.367Z"
 *                               N2:
 *                                 type: object
 *                                 properties:
 *                                   # Similar structure as N1
 *                           cws:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 33
 *                               name:
 *                                 type: string
 *                                 example: "Nzahaha"
 *                               code:
 *                                 type: string
 *                                 example: "NZH"
 *                               location:
 *                                 type: string
 *                                 example: "Rusizi"
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
router.get('/testing-delivery-report/', protectedRoute, DeliveryReportController);
/**
 * @swagger
 * /quality-delivery/save-all-high-grade:
 *   post:
 *     summary: Automatically save all HIGH gradeGroup batches to qualityDelivery
 *     tags: [Quality Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Result of the auto-save operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 created:
 *                   type: integer
 *                 createdQualities:
 *                   type: array
 *                   items:
 *                     type: object
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                 message:
 *                   type: string
 */
router.post('/save-all-high-grade', protectedRoute, SaveAllHighGradeToqualityDelivery);
/**
 * @swagger
 * /quality-delivery/create-missing-records:
 *   post:
 *     summary: Create missing quality delivery records for high-grade transfers
 *     description: |
 *       Finds all high-grade transfers that don't have corresponding quality delivery records 
 *       and automatically creates them. This function:
 *       - Queries for HIGH gradeGroup transfers missing in qualityDelivery table
 *       - Creates quality delivery records for each grade key in the transfer's gradeDetails
 *       - Validates that quality samples exist before creating records
 *       - Returns detailed information about created records and any errors
 *     tags: [Quality Delivery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully processed missing transfers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalFound:
 *                   type: integer
 *                   description: Number of missing transfers found
 *                   example: 5
 *                 totalProcessed:
 *                   type: integer
 *                   description: Number of quality delivery records created
 *                   example: 15
 *                 created:
 *                   type: array
 *                   description: List of created quality delivery records
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       transferId:
 *                         type: integer
 *                       batchNo:
 *                         type: string
 *                       gradeKey:
 *                         type: string
 *                       category:
 *                         type: string
 *                       cwsMoisture:
 *                         type: number
 *                 errors:
 *                   type: array
 *                   description: List of errors encountered during processing
 *                   items:
 *                     type: object
 *                     properties:
 *                       transferId:
 *                         type: integer
 *                       batchNo:
 *                         type: string
 *                       gradeKey:
 *                         type: string
 *                       error:
 *                         type: string
 *                 message:
 *                   type: string
 *                   example: "Found 5 missing transfers. Successfully created 15 quality delivery records"
 *       403:
 *         description: Forbidden - insufficient permissions
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
 *                   example: "Access denied: You do not have permission to perform this request"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Failed to create missing quality delivery records: Database connection error"
 */
router.post('/create-missing-records', protectedRoute, createMissingQualityDelivery);
/**
 * @swagger
 * /quality/batches-from-csv:
 *   get:
 *     summary: Get processed batches from batches.csv in API-ready format
 *     tags: [Quality Sample]
 *     description: Reads batches.csv, groups and formats the data for API use, and returns the result.
 *     responses:
 *       200:
 *         description: Processed batches in API-ready format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 batches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       batchNo:
 *                         type: string
 *                       cwsMoisture1:
 *                         type: object
 *                       labMoisture:
 *                         type: object
 *                       screen:
 *                         type: object
 *                       defect:
 *                         type: object
 *                       ppScore:
 *                         type: object
 *                       notes:
 *                         type: object
 *                       sampleStorageId_0:
 *                         type: integer
 *                       sampleStorageId_1:
 *                         type: integer
 */
// router.get('/batches-from-csv', async (req, res) => {
//     try {
//         const data = await getBatchesFromCsvFile();
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to process batches.csv', details: error.message });
//     }
// });


export default router;