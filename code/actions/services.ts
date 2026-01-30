'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { getMyBusiness } from './business';

export async function createService(data: { name: string; category?: string; duration: number; price: number; skillIds?: number[] }) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // 1. Find User's Business
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: { include: { locations: true } } }
        });

        const business = user?.business;
        if (!business || business.locations.length === 0) {
            return { error: 'You must create a business profile first.' };
        }

        // 2. Use the first location
        const locationId = business.locations[0].id;

        // 3. Create Service with Skill Requirements
        const service = await prisma.service.create({
            data: {
                name: data.name,
                category: data.category || "General",
                duration: data.duration,
                price: data.price,
                locationId: locationId,
                skillRequirements: {
                    create: data.skillIds?.map(skillId => ({
                        skillId: skillId
                    })) || []
                }
            },
            include: { skillRequirements: true }
        });

        return { success: true, service };
    } catch (error) {
        console.error('Create Service Error:', error);
        return { error: 'Failed to create service' };
    }
}

export async function updateService(id: number, data: { name?: string; category?: string; duration?: number; price?: number; skillIds?: number[] }) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify ownership
        const service = await prisma.service.findFirst({
            where: {
                id,
                location: {
                    business: {
                        ownerId: session.sub
                    }
                }
            }
        });

        if (!service) {
            return { error: 'Service not found or access denied' };
        }

        // Prepare update data
        const { skillIds, ...updateData } = data;

        // Transaction for update
        const updatedService = await prisma.$transaction(async (tx) => {
            // Update basic fields
            const svc = await tx.service.update({
                where: { id },
                data: updateData
            });

            // If skillIds provided, update relations
            if (skillIds) {
                // Delete existing
                await tx.serviceSkillRequirement.deleteMany({
                    where: { serviceId: id }
                });

                // Create new
                if (skillIds.length > 0) {
                    await tx.serviceSkillRequirement.createMany({
                        data: skillIds.map(sid => ({
                            serviceId: id,
                            skillId: sid
                        }))
                    });
                }
            }

            return svc;
        });

        return { success: true, service: updatedService };
    } catch (error) {
        console.error('Update Service Error:', error);
        return { error: 'Failed to update service' };
    }
}

export async function deleteService(id: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify ownership
        const service = await prisma.service.findFirst({
            where: {
                id,
                location: {
                    business: {
                        ownerId: session.sub
                    }
                }
            }
        });

        if (!service) {
            return { error: 'Service not found or access denied' };
        }

        await prisma.service.delete({
            where: { id }
        });

        return { success: true };
    } catch (error) {
        console.error('Delete Service Error:', error);
        return { error: 'Failed to delete service' };
    }
}

export async function getServices(businessId?: string) {
    // If businessId provided, fetch for that business (public view)
    // If not, fetch for current user's business (owner view)

    if (businessId) {
        const locations = await prisma.location.findMany({ where: { businessId }, select: { id: true } });
        const locationIds = locations.map(l => l.id);
        const services = await prisma.service.findMany({
            where: { locationId: { in: locationIds } }
        });
        return { services };
    }

    const session = await getSession();
    if (session) {
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: { include: { locations: true } } }
        });

        const business = user?.business;
        if (!business) return { services: [] };

        const locationIds = business.locations.map(l => l.id);
        const services = await prisma.service.findMany({
            where: { locationId: { in: locationIds } }
        });
        return { services };
    }

    return { services: [] };
}

export async function getPublicServices() {
    try {
        const services = await prisma.service.findMany();
        return { services };
    } catch (error) {
        console.error('Get Public Services Error:', error);
        return { services: [] };
    }
}
export async function getSkills() {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Get user's business location
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: { include: { locations: true } } }
        });

        const business = user?.business;
        if (!business || business.locations.length === 0) return { skills: [] };

        const locationId = business.locations[0].id;

        const skills = await prisma.skill.findMany({
            where: { locationId }
        });

        return { skills };
    } catch (error) {
        console.error('Get Skills Error:', error);
        return { error: 'Failed to fetch skills' };
    }
}
