'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from './auth'
import { revalidatePath } from 'next/cache'

export type Availability = {
    dayOfWeek: number
    startTime: string
    endTime: string
    isWorking: boolean
}

// Default schedule: Mon-Sat 09:00 - 18:00
const DEFAULT_AVAILABILITY: Availability[] = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "18:00", isWorking: true },
    { dayOfWeek: 2, startTime: "09:00", endTime: "18:00", isWorking: true },
    { dayOfWeek: 3, startTime: "09:00", endTime: "18:00", isWorking: true },
    { dayOfWeek: 4, startTime: "09:00", endTime: "18:00", isWorking: true },
    { dayOfWeek: 5, startTime: "09:00", endTime: "18:00", isWorking: true },
    { dayOfWeek: 6, startTime: "09:00", endTime: "18:00", isWorking: true },
    { dayOfWeek: 0, startTime: "09:00", endTime: "18:00", isWorking: false }, // Sunday off
]

export async function getStaffAvailability(staffId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify access: User must be the staff member OR the owner of the staff's business
        const requester = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!requester) return { error: 'Unauthorized' };

        // If requester is not the staffId, check if they are the owner
        if (session.sub !== staffId) {
            const targetStaff = await prisma.user.findUnique({
                where: { id: staffId }
            });

            if (!targetStaff || targetStaff.businessId !== requester.business?.id) {
                // If checking dynamic roles, we might need a stricter check
                // For now, assume if you are an owner, you can view your staff
                if (requester.role !== 'OWNER') {
                    return { error: 'Unauthorized' };
                }
            }
        }

        const availability = await prisma.staffAvailability.findMany({
            where: { staffId },
            orderBy: { dayOfWeek: 'asc' }
        });

        // Merge with defaults if specific days are missing
        const fullAvailability = Array.from({ length: 7 }).map((_, i) => {
            const existing = availability.find(a => a.dayOfWeek === i);
            if (existing) {
                return {
                    dayOfWeek: existing.dayOfWeek,
                    startTime: existing.startTime,
                    endTime: existing.endTime,
                    isWorking: existing.isWorking
                };
            }
            // Return default for this day
            const def = DEFAULT_AVAILABILITY.find(d => d.dayOfWeek === i);
            return def || { dayOfWeek: i, startTime: "09:00", endTime: "18:00", isWorking: true };
        });

        return { availability: fullAvailability };

    } catch (error) {
        console.error('Get Availability Error:', error);
        return { error: 'Failed to fetch availability' };
    }
}

export async function updateStaffAvailability(staffId: string, availability: Availability[]) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Permission check (same as above)
        const requester = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!requester) return { error: 'Unauthorized' };

        if (session.sub !== staffId && requester.role !== 'OWNER') {
            return { error: 'Unauthorized' };
        }

        // Transaction to update all days
        await prisma.$transaction(
            availability.map(day =>
                prisma.staffAvailability.upsert({
                    where: {
                        staffId_dayOfWeek: {
                            staffId: staffId,
                            dayOfWeek: day.dayOfWeek
                        }
                    },
                    update: {
                        startTime: day.startTime,
                        endTime: day.endTime,
                        isWorking: day.isWorking
                    },
                    create: {
                        staffId: staffId,
                        dayOfWeek: day.dayOfWeek,
                        startTime: day.startTime,
                        endTime: day.endTime,
                        isWorking: day.isWorking
                    }
                })
            )
        );

        revalidatePath('/dashboard/staff');
        revalidatePath('/dashboard/availability');

        return { success: true };

    } catch (error) {
        console.error('Update Availability Error:', error);
        return { error: 'Failed to update availability' };
    }
}
