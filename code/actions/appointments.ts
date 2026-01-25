'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';

export async function createAppointment(data: { serviceIds: number[]; startTime: string; staffId?: string }) {
    try {
        const session = await getSession();
        if (!session) {
            return { error: 'Unauthorized' };
        }

        const { email, name } = session;
        if (!email) return { error: 'User email is required' };

        // Logic adapted from appointments.service.ts
        const createdAppointments = [];
        let currentStartTime = new Date(data.startTime);

        // Validation: Verify all services exist and belong to the same location?
        // Ideally yes. For now, we take the location from the first service.

        if (data.serviceIds.length === 0) return { error: 'No services selected' };

        const firstServiceId = data.serviceIds[0];
        const firstService = await prisma.service.findUnique({ where: { id: firstServiceId } });
        if (!firstService) return { error: 'Service not found' };

        const locationId = firstService.locationId;

        // Find or Create Client for this Location
        let client = await prisma.client.findFirst({
            where: {
                email: email,
                locationId: locationId
            }
        });

        if (!client) {
            client = await prisma.client.create({
                data: {
                    name: name || 'Valued Client',
                    email: email,
                    locationId: locationId
                }
            });
        }

        for (const serviceId of data.serviceIds) {
            // 1. Get Service details
            const service = await prisma.service.findUnique({
                where: { id: serviceId }
            });

            if (!service) {
                return { error: `Service ${serviceId} not found` };
            }

            // 2. Determine Staff
            let staffId = data.staffId;
            if (!staffId) {
                const location = await prisma.location.findUnique({
                    where: { id: service.locationId },
                    include: { business: true }
                });
                if (!location) return { error: 'Location not found' };

                const business = await prisma.business.findUnique({
                    where: { id: location.businessId },
                    include: { owner: true }
                });

                if (!business || !business.owner) return { error: 'Business Owner not found' };
                staffId = business.owner.id;
            }

            // 3. Create Appointment
            const appointment = await prisma.appointment.create({
                data: {
                    startTime: currentStartTime,
                    duration: service.duration,
                    status: 'SCHEDULED',
                    service: { connect: { id: service.id } },
                    staff: { connect: { id: staffId } },
                    client: { connect: { id: client.id } },
                    location: { connect: { id: service.locationId } }
                }
            });

            createdAppointments.push(appointment);

            // Update start time for next service
            currentStartTime = new Date(currentStartTime.getTime() + service.duration * 60000);
        }

        return { success: true, appointments: createdAppointments };

    } catch (error) {
        console.error('Create Appointment Error:', error);
        return { error: 'Failed to create appointment' };
    }
}

export async function getAppointments() {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const { role, sub, email } = session;

        if (role === 'OWNER') {
            const business = await prisma.business.findFirst({
                where: { ownerId: sub }
            });

            if (!business) return { appointments: [] };

            const locations = await prisma.location.findMany({
                where: { businessId: business.id },
                select: { id: true }
            });
            const locationIds = locations.map(l => l.id);

            const appointments = await prisma.appointment.findMany({
                where: {
                    locationId: { in: locationIds }
                },
                include: { service: true, client: true },
                orderBy: { startTime: 'desc' }
            });
            return { appointments };
        } else if (role === 'CLIENT') {
            // Check if there is a 'Client' record for this user email
            // The old logic looked up "Client" table by email
            const clients = await prisma.client.findMany({
                where: { email: email },
                select: { id: true }
            });
            const clientIds = clients.map(c => c.id);

            // Also include appointments where clientId matches user ID directly (if using unified table)
            // But schema likely separates User vs Client.

            const appointments = await prisma.appointment.findMany({
                where: {
                    clientId: { in: clientIds }
                },
                include: { service: true, client: true, location: true },
                orderBy: { startTime: 'desc' }
            });
            return { appointments };
        }

        return { appointments: [] };
    } catch (error) {
        console.error('Get Appointments Error:', error);
        return { error: 'Failed to fetch appointments' };
    }
}
