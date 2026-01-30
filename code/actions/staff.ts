'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function getStaffMembers() {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Ensure user is an Owner
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!user?.business) return { error: 'Business not found' };

        const staff = await prisma.user.findMany({
            where: {
                businessId: user.business.id,
                role: 'STAFF'
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                staffSkills: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return { staff };
    } catch (error) {
        console.error('Get Staff Error:', error);
        return { error: 'Failed to fetch staff' };
    }
}

export async function createStaffMember(data: { name: string; email: string; password: string }) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const owner = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!owner?.business) return { error: 'Only business owners can add staff' };

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        });

        if (existingUser) {
            return { error: 'User with this email already exists' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Get first location (default)
        const location = await prisma.location.findFirst({
            where: { businessId: owner.business.id }
        });

        const newStaff = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'STAFF',
                businessId: owner.business.id,
                locationId: location?.id
            }
        });

        revalidatePath('/dashboard/staff');
        return { success: true, staff: newStaff };
    } catch (error) {
        console.error('Create Staff Error:', error);
        return { error: 'Failed to create staff member' };
    }
}

export async function deleteStaffMember(id: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const owner = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!owner?.business) return { error: 'Unauthorized' };

        const staff = await prisma.user.findFirst({
            where: {
                id: id,
                businessId: owner.business.id
            }
        });

        if (!staff) return { error: 'Staff member not found' };

        // Ideally check for appointments first to avoid foreign key violation
        // For now, we attempt delete and catch error if constraint fails
        try {
            await prisma.user.delete({ where: { id } });
        } catch (e) {
            // Fallback: Just remove from business and set to CLIENT
            await prisma.user.update({
                where: { id },
                data: {
                    businessId: null,
                    role: 'CLIENT'
                }
            });
        }

        revalidatePath('/dashboard/staff');
        return { success: true };
    } catch (error) {
        console.error('Delete Staff Error:', error);
        return { error: 'Failed to remove staff member' };
    }
}

export async function getBookingStaff() {
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: { in: ['STAFF', 'OWNER'] },
                businessId: { not: null } // Ensure they are attached to a business
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
        return { staff };
    } catch (error) {
        console.error('Get Booking Staff Error:', error);
        return { staff: [] };
    }
}

export async function updateStaffMember(id: string, data: { name: string; email: string; skillIds?: number[] }) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const owner = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!owner?.business) return { error: 'Unauthorized' };

        const staff = await prisma.user.findFirst({
            where: {
                id: id,
                businessId: owner.business.id
            }
        });

        if (!staff) return { error: 'Staff member not found' };

        await prisma.$transaction(async (tx) => {
            // Update User details
            await tx.user.update({
                where: { id },
                data: {
                    name: data.name,
                    email: data.email
                }
            });

            // Update Skills if provided
            if (data.skillIds) {
                // Delete existing skills
                await tx.staffSkill.deleteMany({
                    where: { staffId: id }
                });

                // Add new skills
                if (data.skillIds.length > 0) {
                    await tx.staffSkill.createMany({
                        data: data.skillIds.map(skillId => ({
                            staffId: id,
                            skillId: skillId
                        }))
                    });
                }
            }
        });

        revalidatePath('/dashboard/staff');
        return { success: true };
    } catch (error) {
        console.error('Update Staff Error:', error);
        return { error: 'Failed to update staff member' };
    }
}

export async function resetStaffPassword(id: string, password: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const owner = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!owner?.business) return { error: 'Unauthorized' };

        const staff = await prisma.user.findFirst({
            where: {
                id: id,
                businessId: owner.business.id
            }
        });

        if (!staff) return { error: 'Staff member not found' };

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Reset Password Error:', error);
        return { error: 'Failed to reset password' };
    }
}
