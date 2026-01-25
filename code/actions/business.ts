'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';

export async function createBusiness(data: { name: string; address: string; phone: string }) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const userId = session.sub;

        // 1. Check if user already has a business
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { business: true } });
        if (user?.business) {
            return { error: 'User already owns a business' };
        }

        // 2. Transaction: Create Business -> Link User
        const business = await prisma.$transaction(async (tx) => {
            const newBusiness = await tx.business.create({
                data: {
                    name: data.name,
                    ownerId: userId,
                    status: 'PENDING',
                    locations: {
                        create: {
                            name: 'Main Location',
                            // address: data.address, // If schema supports address on location
                            // phone: data.phone,
                        }
                    }
                },
                include: { locations: true }
            });

            await tx.user.update({
                where: { id: userId },
                data: {
                    businessId: newBusiness.id,
                    role: 'OWNER'
                }
            });

            return newBusiness;
        });

        return { success: true, business };
    } catch (error) {
        console.error('Create Business Error:', error);
        return { error: 'Failed to create business' };
    }
}

export async function getMyBusiness() {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    const user = await prisma.user.findUnique({
        where: { id: session.sub },
        include: {
            business: {
                include: { locations: true }
            }
        }
    });

    return { business: user?.business || null };
}

export async function getAllBusinesses() {
    // Public directory
    const businesses = await prisma.business.findMany({
        where: { status: 'APPROVED' },
        include: { locations: true }
    });
    return { businesses };
}
