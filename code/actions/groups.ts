'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';
import { RoomType } from '@prisma/client';

// ===== GROUP BOOKING =====

export async function createGroupBooking(data: {
    serviceId: number;
    startTime: Date;
    clientIds: number[];
    staffIds?: string[];
    roomId?: number;
    roomType?: RoomType;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const service = await prisma.service.findUnique({
            where: { id: data.serviceId }
        });

        if (!service) {
            return { error: 'Service not found' };
        }

        const clientCount = data.clientIds.length;

        if (clientCount < 2) {
            return { error: 'Group booking requires at least 2 clients' };
        }

        // Check if we need a couple room or multiple rooms
        let rooms: { id: number }[] = [];

        if (service.requiresRoom) {
            // Try to find a couple room first
            const coupleRoom = await prisma.room.findFirst({
                where: {
                    locationId: service.locationId,
                    isActive: true,
                    type: 'COUPLE',
                    capacity: { gte: clientCount }
                }
            });

            if (coupleRoom) {
                // Check availability
                const endTime = new Date(data.startTime.getTime() + service.duration * 60000);
                const conflict = await prisma.roomBooking.findFirst({
                    where: {
                        roomId: coupleRoom.id,
                        OR: [
                            {
                                startTime: { lte: data.startTime },
                                endTime: { gt: data.startTime }
                            },
                            {
                                startTime: { lt: endTime },
                                endTime: { gte: endTime }
                            }
                        ]
                    }
                });

                if (!conflict) {
                    rooms = [{ id: coupleRoom.id }];
                }
            }

            // If no couple room, find multiple individual rooms
            if (rooms.length === 0) {
                const roomTypes = service.roomTypes.length > 0
                    ? service.roomTypes
                    : [data.roomType || 'GENERAL' as RoomType];

                const availableRooms = await prisma.room.findMany({
                    where: {
                        locationId: service.locationId,
                        isActive: true,
                        type: { in: roomTypes }
                    }
                });

                const endTime = new Date(data.startTime.getTime() + service.duration * 60000);

                for (const room of availableRooms) {
                    if (rooms.length >= clientCount) break;

                    const conflict = await prisma.roomBooking.findFirst({
                        where: {
                            roomId: room.id,
                            OR: [
                                {
                                    startTime: { lte: data.startTime },
                                    endTime: { gt: data.startTime }
                                },
                                {
                                    startTime: { lt: endTime },
                                    endTime: { gte: endTime }
                                }
                            ]
                        }
                    });

                    if (!conflict) {
                        rooms.push({ id: room.id });
                    }
                }

                if (rooms.length < clientCount) {
                    return { error: `Not enough rooms available. Need ${clientCount}, found ${rooms.length}` };
                }
            }
        }

        // Get staff members
        let staffIds = data.staffIds || [];

        if (staffIds.length < clientCount) {
            // Find available staff
            const availableStaff = await prisma.user.findMany({
                where: {
                    role: { in: ['STAFF', 'OWNER'] },
                    isActive: true,
                    business: {
                        locations: {
                            some: { id: service.locationId }
                        }
                    }
                },
                select: { id: true }
            });

            // Check staff availability
            const endTime = new Date(data.startTime.getTime() + service.duration * 60000);

            for (const staff of availableStaff) {
                if (staffIds.length >= clientCount) break;
                if (staffIds.includes(staff.id)) continue;

                const conflict = await prisma.appointment.findFirst({
                    where: {
                        staffId: staff.id,
                        status: { not: 'CANCELLED' },
                        OR: [
                            {
                                startTime: { lte: data.startTime },
                                // endTime approximation: startTime + duration
                            }
                        ]
                    }
                });

                if (!conflict) {
                    staffIds.push(staff.id);
                }
            }

            if (staffIds.length < clientCount) {
                return { error: `Not enough staff available. Need ${clientCount}, found ${staffIds.length}` };
            }
        }

        // Create booking group and appointments
        const bookingGroup = await prisma.bookingGroup.create({
            data: {
                name: `Group Booking - ${service.name}`
            }
        });

        const appointments = [];
        const endTime = new Date(data.startTime.getTime() + service.duration * 60000);

        for (let i = 0; i < clientCount; i++) {
            const appointment = await prisma.appointment.create({
                data: {
                    locationId: service.locationId,
                    serviceId: service.id,
                    staffId: staffIds[i],
                    clientId: data.clientIds[i],
                    startTime: data.startTime,
                    duration: service.duration,
                    status: 'SCHEDULED',
                    bookingGroupId: bookingGroup.id
                }
            });

            // Create room booking if applicable
            if (rooms.length > 0) {
                const roomId = rooms.length === 1 ? rooms[0].id : rooms[i].id;
                await prisma.roomBooking.create({
                    data: {
                        roomId,
                        appointmentId: appointment.id,
                        startTime: data.startTime,
                        endTime
                    }
                });
            }

            appointments.push(appointment);
        }

        revalidatePath('/dashboard/appointments');
        return { success: true, bookingGroup, appointments };
    } catch (error) {
        console.error('Create Group Booking Error:', error);
        return { error: 'Failed to create group booking' };
    }
}

export async function getGroupBooking(bookingGroupId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const bookingGroup = await prisma.bookingGroup.findUnique({
            where: { id: bookingGroupId },
            include: {
                appointments: {
                    include: {
                        service: true,
                        client: true,
                        staff: true,
                        roomBookings: {
                            include: { room: true }
                        }
                    }
                }
            }
        });

        if (!bookingGroup) {
            return { error: 'Booking group not found' };
        }

        return { bookingGroup };
    } catch (error) {
        console.error('Get Group Booking Error:', error);
        return { error: 'Failed to fetch group booking' };
    }
}

export async function cancelGroupBooking(bookingGroupId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Cancel all appointments in the group
        await prisma.appointment.updateMany({
            where: { bookingGroupId },
            data: { status: 'CANCELLED' }
        });

        // Delete room bookings
        const appointments = await prisma.appointment.findMany({
            where: { bookingGroupId },
            select: { id: true }
        });

        const appointmentIds = appointments.map(a => a.id);

        await prisma.roomBooking.deleteMany({
            where: { appointmentId: { in: appointmentIds } }
        });

        revalidatePath('/dashboard/appointments');
        return { success: true };
    } catch (error) {
        console.error('Cancel Group Booking Error:', error);
        return { error: 'Failed to cancel group booking' };
    }
}

// ===== HELPER: Check group availability =====

export async function checkGroupAvailability(data: {
    serviceId: number;
    startTime: Date;
    groupSize: number;
}) {
    try {
        const service = await prisma.service.findUnique({
            where: { id: data.serviceId }
        });

        if (!service) {
            return { available: false, reason: 'Service not found' };
        }

        const endTime = new Date(data.startTime.getTime() + service.duration * 60000);

        // Check room availability
        let roomsAvailable = data.groupSize;

        if (service.requiresRoom) {
            // Check for couple room
            const coupleRoom = await prisma.room.findFirst({
                where: {
                    locationId: service.locationId,
                    isActive: true,
                    type: 'COUPLE',
                    capacity: { gte: data.groupSize }
                }
            });

            if (coupleRoom) {
                const conflict = await prisma.roomBooking.findFirst({
                    where: {
                        roomId: coupleRoom.id,
                        OR: [
                            { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
                            { startTime: { lt: endTime }, endTime: { gte: endTime } }
                        ]
                    }
                });

                if (!conflict) {
                    roomsAvailable = data.groupSize;
                } else {
                    roomsAvailable = 0;
                }
            }

            // Check individual rooms
            if (roomsAvailable === 0) {
                const rooms = await prisma.room.findMany({
                    where: {
                        locationId: service.locationId,
                        isActive: true,
                        type: { in: service.roomTypes.length > 0 ? service.roomTypes : ['GENERAL'] }
                    }
                });

                roomsAvailable = 0;
                for (const room of rooms) {
                    const conflict = await prisma.roomBooking.findFirst({
                        where: {
                            roomId: room.id,
                            OR: [
                                { startTime: { lte: data.startTime }, endTime: { gt: data.startTime } },
                                { startTime: { lt: endTime }, endTime: { gte: endTime } }
                            ]
                        }
                    });
                    if (!conflict) roomsAvailable++;
                }
            }

            if (roomsAvailable < data.groupSize) {
                return { available: false, reason: `Only ${roomsAvailable} rooms available` };
            }
        }

        // Check staff availability
        const availableStaff = await prisma.user.findMany({
            where: {
                role: { in: ['STAFF', 'OWNER'] },
                isActive: true,
                business: {
                    locations: { some: { id: service.locationId } }
                }
            }
        });

        // For each staff, check if they have conflicting appointments
        let staffAvailable = 0;
        for (const staff of availableStaff) {
            const conflict = await prisma.appointment.findFirst({
                where: {
                    staffId: staff.id,
                    status: { not: 'CANCELLED' },
                    startTime: { lt: endTime },
                    // This is approximate - we'd need to check startTime + duration
                }
            });
            if (!conflict) staffAvailable++;
        }

        if (staffAvailable < data.groupSize) {
            return { available: false, reason: `Only ${staffAvailable} staff available` };
        }

        return { available: true };
    } catch (error) {
        console.error('Check Group Availability Error:', error);
        return { available: false, reason: 'Error checking availability' };
    }
}
