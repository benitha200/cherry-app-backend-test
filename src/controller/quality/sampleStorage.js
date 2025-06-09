import {
    createSampleStorage,
    getSampleStorageById,
    getAllSampleStorages,
    updateSampleStorage,
    deleteSampleStorage
} from '../../services/quality/sampleStorage.js';

export const createSampleStorageController = async (req, res) => {
    try {
        const data = req.body;
        const sampleStorage = await createSampleStorage(data);
        res.status(201).json(sampleStorage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getSampleStorageByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const sampleStorage = await getSampleStorageById(id);
        if (!sampleStorage) {
            return res.status(404).json({ error: 'Sample storage not found' });
        }
        res.json(sampleStorage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllSampleStoragesController = async (req, res) => {
    try {
        const sampleStorages = await getAllSampleStorages();
        res.json(sampleStorages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateSampleStorageController = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedSampleStorage = await updateSampleStorage(id, data);
        if (!updatedSampleStorage) {
            return res.status(404).json({ error: 'Sample storage not found' });
        }
        res.json(updatedSampleStorage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteSampleStorageController = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deleteSampleStorage(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Sample storage not found' });
        }
        res.json({ message: 'Sample storage deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};