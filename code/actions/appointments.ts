'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';

export async function createAppointment(data: { serviceIds: number[]; addOnIds?: number[][]; startTime: string; staffId?: string; paymentIntentId?: string }) {
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

        for (const [index, serviceId] of data.serviceIds.entries()) {
            // 1. Get Service details
            const service = await prisma.service.findUnique({
                where: { id: serviceId }
            });

            if (!service) return { error: `Service ${serviceId} not found` };

            // 1b. Get Add-Ons details to calculate duration bonus
            const serviceAddOnIds = data.addOnIds?.[index] || [];
            let durationBonus = 0;
            if (serviceAddOnIds.length > 0) {
                const addOns = await prisma.addOn.findMany({
                    where: { id: { in: serviceAddOnIds } }
                });
                durationBonus = addOns.reduce((sum, a) => sum + a.durationChange, 0);
            }

            const totalDuration = service.duration + durationBonus;

            const apptStart = currentStartTime;
            const apptEnd = new Date(apptStart.getTime() + totalDuration * 60000);

            const bufferBefore = service.bufferBefore || 0;
            const bufferAfter = service.bufferAfter || 0;

            // Effective Resource Usage Time (Blocked Time)
            const resourceStart = new Date(apptStart.getTime() - bufferBefore * 60000);
            const resourceEnd = new Date(apptEnd.getTime() + bufferAfter * 60000);

            // 2. Determine and Validate Staff
            // Check for conflicts in the resource usage window
            const conflicts = await prisma.appointment.findMany({
                where: {
                    locationId: service.locationId,
                    startTime: { lt: resourceEnd, gte: new Date(resourceStart.getTime() - 24 * 60 * 60 * 1000) },
                    status: { not: 'CANCELLED' }
                },
                include: { service: true }
            });

            // Filter overlapping appointments considering THEIR buffers too
            const busyStaffIds = new Set(conflicts.filter(a => {
                const aBufferBefore = a.service.bufferBefore || 0;
                const aBufferAfter = a.service.bufferAfter || 0;

                const aStart = new Date(a.startTime);
                const aEnd = new Date(aStart.getTime() + a.duration * 60000);

                const aResourceStart = new Date(aStart.getTime() - aBufferBefore * 60000);
                const aResourceEnd = new Date(aEnd.getTime() + aBufferAfter * 60000);

                // Check Overlap with MY resource usage
                return resourceStart < aResourceEnd && aResourceStart < resourceEnd;
            }).map(a => a.staffId));

            let staffId = data.staffId;
            if (staffId) {
                if (busyStaffIds.has(staffId)) {
                    return { error: `Selected staff is not available at this time` };
                }
            } else {
                // Find available staff
                const availableStaff = await prisma.user.findFirst({
                    where: {
                        locationId: service.locationId,
                        id: { notIn: Array.from(busyStaffIds) },
                        role: { in: ['STAFF', 'OWNER'] },
                        isActive: true
                    }
                });

                if (!availableStaff) return { error: 'No staff available at this time' };
                staffId = availableStaff.id;
            }

            // 3. Room Logic
            let roomBookingData = undefined;
            if (service.requiresRoom) {
                const availableRoom = await prisma.room.findFirst({
                    where: {
                        locationId: service.locationId,
                        type: { in: service.roomTypes },
                        isActive: true,
                        bookings: {
                            none: {
                                AND: [
                                    { startTime: { lt: resourceEnd } },
                                    { endTime: { gt: resourceStart } }
                                ]
                            }
                        }
                    }
                });

                if (!availableRoom) return { error: `No ${service.roomTypes.join('/') || 'suitable'} room available` };

                roomBookingData = {
                    create: {
                        roomId: availableRoom.id,
                        startTime: resourceStart,
                        endTime: resourceEnd
                    }
                };
            }

            // 4. Create Appointment
            const appointment = await prisma.appointment.create({
                data: {
                    startTime: apptStart,
                    duration: totalDuration,
                    status: 'SCHEDULED',
                    service: { connect: { id: service.id } },
                    staff: { connect: { id: staffId } },
                    client: { connect: { id: client.id } },
                    location: { connect: { id: service.locationId } },
                    roomBookings: roomBookingData,
                    appointmentAddOns: serviceAddOnIds.length > 0 ? {
                        create: serviceAddOnIds.map(id => ({ addOnId: id, quantity: 1 }))
                    } : undefined
                }
            });

            createdAppointments.push(appointment);

            currentStartTime = apptEnd;
        }

        if (data.paymentIntentId && createdAppointments.length > 0) {
            // Calculate total amount
            let totalAmount = 0;
            // Fetch price from created appointments to be safe
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
            const clients = await prisma.client.findMany({
                where: { email: email },
                select: { id: true }
            });
            const clientIds = clients.map(c => c.id);

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
                status: 'SCHEDULED'
            }
        });

        return { success: true, appointment };
    } catch (error) {
        console.error('Reschedule Error:', error);
        return { error: 'Failed to reschedule appointment' };
    }
}
