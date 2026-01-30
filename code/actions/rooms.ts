'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';
import { RoomType } from '@prisma/client';

// ===== ROOM CRUD =====

export async function createRoom(data: {
    name: string;
    type: RoomType;
    capacity?: number;
    description?: string | null;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Get user's business/location
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: { include: { locations: true } } }
        });

        const business = user?.business;
        if (!business || business.locations.length === 0) {
            return { error: 'You must have a business with a location first.' };
        }

        const locationId = business.locations[0].id;

        const room = await prisma.room.create({
            data: {
                name: data.name,
                type: data.type,
                capacity: data.capacity || 1,
                description: data.description,
                locationId
            }
        });

        revalidatePath('/dashboard/rooms');
        return { success: true, room };
    } catch (error) {
        console.error('Create Room Error:', error);
        return { error: 'Failed to create room' };
    }
}

export async function updateRoom(id: number, data: {
    name?: string;
    type?: RoomType;
    capacity?: number;
    description?: string | null;
    isActive?: boolean;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify ownership
        const room = await prisma.room.findFirst({
            where: {
                id,
                location: {
                    business: {
                        ownerId: session.sub
                    }
                }
            }
        });

        if (!room) {
            return { error: 'Room not found or access denied' };
        }

        const updatedRoom = await prisma.room.update({
            where: { id },
            data
        });

        revalidatePath('/dashboard/rooms');
        return { success: true, room: updatedRoom };
    } catch (error) {
        console.error('Update Room Error:', error);
        return { error: 'Failed to update room' };
    }
}

export async function deleteRoom(id: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify ownership
        const room = await prisma.room.findFirst({
            where: {
                id,
                location: {
                    business: {
                        ownerId: session.sub
                    }
                }
            }
        });

        if (!room) {
            return { error: 'Room not found or access denied' };
        }

        // Check for existing bookings
        const hasBookings = await prisma.roomBooking.findFirst({
            where: { roomId: id }
        });

        if (hasBookings) {
            // Soft delete - just deactivate
            await prisma.room.update({
                where: { id },
                data: { isActive: false }
            });
        } else {
            await prisma.room.delete({ where: { id } });
        }

        revalidatePath('/dashboard/rooms');
        return { success: true };
    } catch (error) {
        console.error('Delete Room Error:', error);
        return { error: 'Failed to delete room' };
    }
}

export async function getRooms(locationId?: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Get user's location if not provided
        let targetLocationId = locationId;

        if (!targetLocationId) {
            const user = await prisma.user.findUnique({
                where: { id: session.sub },
                include: { business: { include: { locations: true } } }
            });

            const business = user?.business;
            if (!business || business.locations.length === 0) {
                return { rooms: [] };
            }

            targetLocationId = business.locations[0].id;
        }

        const rooms = await prisma.room.findMany({
            where: {
                locationId: targetLocationId,
                isActive: true
            },
            orderBy: { name: 'asc' }
        });

        return { rooms };
    } catch (error) {
        console.error('Get Rooms Error:', error);
        return { error: 'Failed to fetch rooms' };
    }
}

// ===== ROOM AVAILABILITY =====

export async function checkRoomAvailability(data: {
    roomTypes: RoomType[];
    startTime: Date;
    endTime: Date;
    locationId?: number;
    excludeAppointmentId?: number;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        let targetLocationId = data.locationId;

        if (!targetLocationId) {
            const user = await prisma.user.findUnique({
                where: { id: session.sub },
                include: { business: { include: { locations: true } } }
            });

            if (!user?.business?.locations?.[0]) {
                return { error: 'No location found' };
            }

            targetLocationId = user.business.locations[0].id;
        }

        // Get all active rooms of the required types
        const rooms = await prisma.room.findMany({
            where: {
                locationId: targetLocationId,
                isActive: true,
                type: { in: data.roomTypes }
            }
        });

        // Find available rooms (no conflicting bookings)
        const availableRooms = [];

        for (const room of rooms) {
            const conflictingBooking = await prisma.roomBooking.findFirst({
                where: {
                    roomId: room.id,
                    appointmentId: data.excludeAppointmentId
                        ? { not: data.excludeAppointmentId }
                        : undefined,
                    OR: [
                        {
                            // New booking starts during existing booking
                            startTime: { lte: data.startTime },
                            endTime: { gt: data.startTime }
                        },
                        {
                            // New booking ends during existing booking
                            startTime: { lt: data.endTime },
                            endTime: { gte: data.endTime }
                        },
                        {
                            // New booking contains existing booking
                            startTime: { gte: data.startTime },
                            endTime: { lte: data.endTime }
                        }
                    ]
                }
            });

            if (!conflictingBooking) {
                availableRooms.push(room);
            }
        }

        return {
            available: availableRooms.length > 0,
            rooms: availableRooms
        };
    } catch (error) {
        console.error('Check Room Availability Error:', error);
        return { error: 'Failed to check room availability' };
    }
}

export async function getRoomSchedule(data: {
    roomId: number;
    date: Date;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Get start and end of the day
        const startOfDay = new Date(data.date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(data.date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await prisma.roomBooking.findMany({
            where: {
                roomId: data.roomId,
                startTime: { gte: startOfDay },
                endTime: { lte: endOfDay }
            },
            include: {
                appointment: {
                    include: {
                        service: true,
                        client: true,
                        staff: true
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        return { bookings };
    } catch (error) {
        console.error('Get Room Schedule Error:', error);
        return { error: 'Failed to fetch room schedule' };
    }
}

// ===== ROOM BOOKING =====

export async function createRoomBooking(data: {
    roomId: number;
    appointmentId: number;
    startTime: Date;
    endTime: Date;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify the room is available
        const room = await prisma.room.findUnique({
            where: { id: data.roomId }
        });

        if (!room) {
            return { error: 'Room not found' };
        }

        // Check for conflicts
        const conflict = await prisma.roomBooking.findFirst({
            where: {
                roomId: data.roomId,
                OR: [
                    {
                        startTime: { lte: data.startTime },
                        endTime: { gt: data.startTime }
                    },
                    {
                        startTime: { lt: data.endTime },
                        endTime: { gte: data.endTime }
                    },
                    {
                        startTime: { gte: data.startTime },
                        endTime: { lte: data.endTime }
                    }
                ]
            }
        });

        if (conflict) {
            return { error: 'Room is not available at this time' };
        }

        const booking = await prisma.roomBooking.create({
            data: {
                roomId: data.roomId,
                appointmentId: data.appointmentId,
                startTime: data.startTime,
                endTime: data.endTime
            }
        });

        return { success: true, booking };
    } catch (error) {
        console.error('Create Room Booking Error:', error);
        return { error: 'Failed to book room' };
    }
}
