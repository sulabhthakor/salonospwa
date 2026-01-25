'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';

export async function getClients() {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Logic from clients.service.ts: findAllForOwner

        // 1. Find User Business
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        const business = user?.business;
        if (!business) return { clients: [] };

        // 2. Find Clients linked to business locations
        // Clients are linked to Location in schema
        const clients = await prisma.client.findMany({
            where: {
                location: {
                    businessId: business.id
                }
            },
            include: {
                _count: {
                    select: { appointments: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return { clients };
    } catch (error) {
        console.error('Get Clients Error:', error);
        return { error: 'Failed to fetch clients' };
    }
}

export async function getClientDetails(clientId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        const business = user?.business;
        if (!business) return { error: 'Business not found' };

        const client = await prisma.client.findFirst({
            where: {
                id: clientId,
                location: {
                    businessId: business.id
                }
            },
            include: {
                appointments: {
                    include: { service: true, staff: true },
                    orderBy: { startTime: 'desc' }
                }
            }
        });

        if (!client) return { error: 'Client not found' };

        return { client };

    } catch (error) {
        console.error('Get Client Details Error:', error);
        return { error: 'Failed to fetch client details' };
    }
}
