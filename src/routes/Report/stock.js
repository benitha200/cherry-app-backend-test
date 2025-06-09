import express from 'express'
import { getStockReport } from '../../controller/report/stock.js';
import { protectedRoute } from '../../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /stock/report:
 *   get:
 *     summary: Get comprehensive stock report
 *     description: Retrieves a detailed stock report including cherry purchases, parchment output, transported amounts, and in-store inventory
 *     tags: [Report]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved stock report
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Stock report fetched successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totals:
 *                       type: object
 *                       properties:
 *                         totCherryPurchase:
 *                           type: number
 *                           description: Total cherry purchases across all CWS in kilograms
 *                           example: 15750.5
 *                         totalParchmentOutput:
 *                           type: number
 *                           description: Total parchment output across all CWS in kilograms
 *                           example: 3150.75
 *                         totalTransportedKgs:
 *                           type: number
 *                           description: Total transported parchment across all CWS in kilograms
 *                           example: 2500.25
 *                         parchmentInstore:
 *                           type: number
 *                           description: Total remaining parchment in store across all CWS (output - transported)
 *                           example: 650.5
 *                     byCws:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cwsId:
 *                             type: integer
 *                             description: CWS identifier
 *                             example: 1
 *                           cwsName:
 *                             type: string
 *                             description: CWS name
 *                             example: "Musasa CWS"
 *                           cwsCode:
 *                             type: string
 *                             description: CWS code
 *                             example: "MSH"
 *                           cherryPurchase:
 *                             type: number
 *                             description: Cherry purchases for this CWS in kilograms
 *                             example: 5250.25
 *                           parchmentOutput:
 *                             type: number
 *                             description: Parchment output for this CWS in kilograms
 *                             example: 1050.5
 *                           transportedKgs:
 *                             type: number
 *                             description: Transported parchment for this CWS in kilograms
 *                             example: 800.25
 *                           parchmentInstore:
 *                             type: number
 *                             description: Remaining parchment in store for this CWS
 *                             example: 250.25
 *                       description: Stock metrics broken down by individual CWS
 *       401:
 *         description: Unauthorized access - Authentication token required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access
 *       403:
 *         description: Access denied - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: No stock report data found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: No stock report found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch stock report
 *                 message:
 *                   type: string
 *                   example: Database connection failed
 */
router.get('/report', protectedRoute, getStockReport);

export default router;