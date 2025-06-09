import { Router } from 'express';
import {
    createSampleStorageController,
    getSampleStorageByIdController,
    getAllSampleStoragesController,
    updateSampleStorageController,
    deleteSampleStorageController,
} from '../../controller/quality/sampleStorage.js';
import { protectedRoute, authorizeAdmin } from '../../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: SampleStorage
 *   description: API for managing sample storage
 */

/**
 * @swagger
 * /sample-storage/create:
 *   post:
 *     summary: Create a new sample storage
 *     tags: [SampleStorage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Sample storage created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/create', protectedRoute, authorizeAdmin, createSampleStorageController);

/**
 * @swagger
 * /sample-storage/getOne/{id}:
 *   get:
 *     summary: Get a sample storage by ID
 *     tags: [SampleStorage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the sample storage
 *     responses:
 *       200:
 *         description: Sample storage retrieved successfully
 *       404:
 *         description: Sample storage not found
 *       401:
 *         description: Unauthorized
 */
router.get('/getOne/:id', protectedRoute, getSampleStorageByIdController);

/**
 * @swagger
 * /sample-storage/getAll:
 *   get:
 *     summary: Get all sample storages
 *     tags: [SampleStorage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sample storages
 *       401:
 *         description: Unauthorized
 */
router.get('/getAll', protectedRoute, getAllSampleStoragesController);

/**
 * @swagger
 * /sample-storage/update/{id}:
 *   put:
 *     summary: Update a sample storage by ID
 *     tags: [SampleStorage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the sample storage
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sample storage updated successfully
 *       404:
 *         description: Sample storage not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.put('/update/:id', protectedRoute, authorizeAdmin, updateSampleStorageController);

/**
 * @swagger
 * /sample-storage/delete/{id}:
 *   delete:
 *     summary: Delete a sample storage by ID
 *     tags: [SampleStorage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the sample storage
 *     responses:
 *       200:
 *         description: Sample storage deleted successfully
 *       404:
 *         description: Sample storage not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/delete/:id', protectedRoute, authorizeAdmin, deleteSampleStorageController);

export default router;