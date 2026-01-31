'use server'

import { prisma } from '@/lib/prisma';

export async function getSalons({ query }: { query?: string } = {}) {
    try {
        const locations = await prisma.location.findMany({
            where: query ? {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { business: { name: { contains: query, mode: 'insensitive' } } }
                ]
            } : {},
            include: {
                business: true,
                _count: {
                    select: { services: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { success: true, data: locations };
    } catch (error) {
        console.error('Error fetching salons:', error);
        return { success: false, error: 'Failed to fetch salons' };
    }
}

export async function getSalonById(id: number) {
    try {
        const location = await prisma.location.findUnique({
            where: { id },
            include: {
                business: true,
                services: true,
                tenantUsers: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    }
                }
            }
        });

        if (!location) {
            return { success: false, error: 'Salon not found' };
        }

        return { success: true, data: location };
    } catch (error) {
        console.error('Error fetching salon details:', error);
        return { success: false, error: 'Failed to fetch salon details' };
    }
}
