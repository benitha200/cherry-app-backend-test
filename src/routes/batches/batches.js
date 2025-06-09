import { Router } from 'express';
import { authenticateToken, protectedRoute } from '../../middleware/auth.js';
import { getGradeABatchesController, getHighGradeTransfersController } from '../../controller/batches/batches.js';

const router = Router();

/**
 * @swagger
 * /batches/sample/gradeA/{cwsId}:
 *   get:
 *     summary: Get COMPLETED BaggingOffs of High grade (A) batches for a specific CWS manager
 *     description: Returns a paginated list of COMPLETED Bagged off Grade A batches for a specific Coffee Washing Station (CWS).
 *     tags:
 *       - Processing
 *     security:
 *       - bearerAuth: []  # Requires JWT token in Authorization header
 *     parameters:
 *       - in: path
 *         name: cwsId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the Coffee Washing Station (CWS).
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of records per page.
 *     responses:
 *       200:
 *         description: A paginated list of Grade A batches.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of Grade A batches.
 *                 batches:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       batchNo:
 *                         type: string
 *                       processingId:
 *                         type: integer
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       outputKgs:
 *                         type: object
 *                         additionalProperties:
 *                           type: number
 *                       totalOutputKgs:
 *                         type: number
 *                       processingType:
 *                         type: string
 *                       status:
 *                         type: string
 *                       notes:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                       processing:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           batchNo:
 *                             type: string
 *                           processingType:
 *                             type: string
 *                           totalKgs:
 *                             type: number
 *                           grade:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           status:
 *                             type: string
 *                           notes:
 *                             type: string
 *                             nullable: true
 *                           cwsId:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *       400:
 *         description: Bad request. Possible issues include invalid parameters or missing required fields.
 *       401:
 *         description: Unauthorized. The user is not authenticated.
 *       403:
 *         description: Forbidden. The user does not have access to the requested CWS.
 */
router.get('/sample/gradeA/:cwsId', protectedRoute, getGradeABatchesController);
/**
 * @swagger
 * /batches/delivery/high-grade/{cwsId}:
 *   get:
 *     summary: Get COMPLETED High Grade Transfers for a specific CWS manager
 *     description: Returns a paginated list of COMPLETED High Grade transfer batches associated with a specific Coffee Washing Station (CWS).
 *     tags:
 *       - Transfers
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
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page.
 *     responses:
 *       200:
 *         description: A paginated list of completed high grade transfer batches.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       403:
 *         description: Forbidden. The user does not have access to this CWS.
 *       500:
 *         description: Server error.
 */
router.get('/delivery/high-grade/:cwsId', protectedRoute, getHighGradeTransfersController);


export default router;