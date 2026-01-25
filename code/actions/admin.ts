'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';

// Helper to verify Admin Access
async function checkAdmin() {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    // Check role
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        return { error: 'Forbidden' };
    }
    return { success: true, user };
}

export async function getAdminStats() {
    try {
        const auth = await checkAdmin();
        if (auth.error) return auth;

        const totalUsers = await prisma.user.count();
        const totalSalons = await prisma.business.count();
        const pendingSalons = await prisma.business.count({
            where: { status: 'PENDING' }
        });
        const totalBookings = await prisma.appointment.count();

        return {
            stats: {
                totalUsers,
                totalSalons,
                pendingSalons,
                totalBookings
            }
        };
    } catch (error) {
        console.error('Get Admin Stats Error:', error);
        return { error: 'Failed to fetch stats' };
    }
}

export async function getAdminSalons() {
    try {
        const auth = await checkAdmin();
        if (auth.error) return auth;

        const salons = await prisma.business.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: { locations: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { salons };
    } catch (error) {
        console.error('Get Admin Salons Error:', error);
        return { error: 'Failed to fetch salons' };
    }
}

export async function updateSalonStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    try {
        const auth = await checkAdmin();
        if (auth.error) return auth;

        const salon = await prisma.business.update({
            where: { id },
            data: { status }
        });

        return { success: true, salon };
    } catch (error) {
        console.error('Update Salon Status Error:', error);
        return { error: 'Failed to update salon status' };
    }
}

export async function getAdminUsers() {
    try {
        const auth = await checkAdmin();
        if (auth.error) return auth;

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                businessId: true
            }
        });

        return { users };
    } catch (error) {
        console.error('Get Admin Users Error:', error);
        return { error: 'Failed to fetch users' };
    }
}
