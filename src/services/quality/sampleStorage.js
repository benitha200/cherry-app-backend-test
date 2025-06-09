import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createSampleStorage = async (data) => {
    return await prisma.sampleStorage.create({
        data,
    });
};

export const getSampleStorageById = async (id) => {
    return await prisma.sampleStorage.findUnique({
        where: { id: parseInt(id) },
    });
};

export const getAllSampleStorages = async () => {
    return await prisma.sampleStorage.findMany();
};

export const updateSampleStorage = async (id, data) => {
    return await prisma.sampleStorage.update({
        where: { id: parseInt(id) },
        data,
    });
};

export const deleteSampleStorage = async (id) => {
    return await prisma.sampleStorage.delete({
        where: { id: parseInt(id) },
    });
};