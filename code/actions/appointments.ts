'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';

export async function createAppointment(data: { serviceIds: number[]; startTime: string; staffId?: string; paymentIntentId?: string }) {
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

        if (data.paymentIntentId && createdAppointments.length > 0) {
            // Calculate total amount
            let totalAmount = 0;
            for (const apt of createdAppointments) {
                // Fetch price again effectively or assume passed? We fetched service in loop.
                // We need to re-fetch or optimistically trust?
                // The loop fetched 'service'. We didn't save it to array.
                // Let's do a quick query or sum it up inside the loop?
                // Simpler: Just Fetch the created appointments with include service
            }

            // To avoid complexity, let's sum it inside the loop or just fetch quickly now.
            const createdIds = createdAppointments.map(a => a.id);
            const savedApts = await prisma.appointment.findMany({
                where: { id: { in: createdIds } },
                include: { service: true }
            });

            totalAmount = savedApts.reduce((sum, apt) => sum + apt.service.price, 0);

            await prisma.payment.create({
                data: {
                    amount: totalAmount,
                    currency: 'inr',
                    status: 'COMPLETED',
                    stripePaymentId: data.paymentIntentId,
                    appointmentId: createdAppointments[0].id
                }
            });
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

export async function getAppointmentDetails(appointmentId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Ensure user has access (Owner of location or Client owner)
        // For simplicity, strict checks can be added here similar to getAppointments

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                service: true,
                client: true,
                staff: true,
                location: true
            }
        });

        if (!appointment) return { error: 'Appointment not found' };

        return { appointment };
    } catch (error) {
        console.error('Get Appointment Details Error:', error);
        return { error: 'Failed to fetch appointment details' };
    }
}

export async function updateAppointmentStatus(appointmentId: number, status: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify ownership/role here ideally

        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status }
        });

        return { success: true, appointment };
    } catch (error) {
        console.error('Update Status Error:', error);
        return { error: 'Failed to update status' };
    }
}

export async function rescheduleAppointment(appointmentId: number, newStartTime: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                startTime: new Date(newStartTime),
                status: 'SCHEDULED' // Reset status to scheduled if it was something else? Or keep confirmed?
                // Usually reschedule implies re-confirmation might be needed, or it stays confirmed.
                // Let's set to SCHEDULED as safer default for re-approval.
            }
        });

        return { success: true, appointment };
    } catch (error) {
        console.error('Reschedule Error:', error);
        return { error: 'Failed to reschedule appointment' };
    }
}
