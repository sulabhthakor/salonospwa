'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';

// ===== SKILL CRUD =====

export async function createSkill(data: {
    name: string;
    category?: string;
    description?: string;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: { include: { locations: true } } }
        });

        const business = user?.business;
        if (!business || business.locations.length === 0) {
            return { error: 'You must have a business with a location first.' };
        }

        const locationId = business.locations[0].id;

        const skill = await prisma.skill.create({
            data: {
                name: data.name,
                category: data.category,
                description: data.description,
                locationId
            }
        });

        revalidatePath('/dashboard/skills');
        return { success: true, skill };
    } catch (error) {
        console.error('Create Skill Error:', error);
        return { error: 'Failed to create skill' };
    }
}

export async function updateSkill(id: number, data: {
    name?: string;
    category?: string;
    description?: string;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const skill = await prisma.skill.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!skill) {
            return { error: 'Skill not found or access denied' };
        }

        const updatedSkill = await prisma.skill.update({
            where: { id },
            data
        });

        revalidatePath('/dashboard/skills');
        return { success: true, skill: updatedSkill };
    } catch (error) {
        console.error('Update Skill Error:', error);
        return { error: 'Failed to update skill' };
    }
}

export async function deleteSkill(id: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const skill = await prisma.skill.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!skill) {
            return { error: 'Skill not found or access denied' };
        }

        // Delete related records first
        await prisma.staffSkill.deleteMany({ where: { skillId: id } });
        await prisma.serviceSkillRequirement.deleteMany({ where: { skillId: id } });
        await prisma.skill.delete({ where: { id } });

        revalidatePath('/dashboard/skills');
        return { success: true };
    } catch (error) {
        console.error('Delete Skill Error:', error);
        return { error: 'Failed to delete skill' };
    }
}

export async function getSkills(locationId?: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        let targetLocationId = locationId;

        if (!targetLocationId) {
            const user = await prisma.user.findUnique({
                where: { id: session.sub },
                include: { business: { include: { locations: true } } }
            });

            if (!user?.business?.locations?.[0]) {
                return { skills: [] };
            }

            targetLocationId = user.business.locations[0].id;
        }

        const skills = await prisma.skill.findMany({
            where: { locationId: targetLocationId },
            include: {
                staffSkills: {
                    include: { staff: { select: { id: true, name: true } } }
                },
                serviceRequirements: {
                    include: { service: { select: { id: true, name: true } } }
                }
            },
            orderBy: { name: 'asc' }
        });

        return { skills };
    } catch (error) {
        console.error('Get Skills Error:', error);
        return { error: 'Failed to fetch skills' };
    }
}

// ===== STAFF SKILL ASSIGNMENT =====

export async function assignSkillToStaff(data: {
    staffId: string;
    skillId: number;
    certificationUrl?: string;
    issuedAt?: Date;
    expiresAt?: Date;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify the staff member belongs to the owner's business
        const staff = await prisma.user.findFirst({
            where: {
                id: data.staffId,
                business: { ownerId: session.sub }
            }
        });

        if (!staff) {
            return { error: 'Staff member not found or access denied' };
        }

        const staffSkill = await prisma.staffSkill.upsert({
            where: {
                staffId_skillId: {
                    staffId: data.staffId,
                    skillId: data.skillId
                }
            },
            update: {
                certificationUrl: data.certificationUrl,
                issuedAt: data.issuedAt,
                expiresAt: data.expiresAt
            },
            create: {
                staffId: data.staffId,
                skillId: data.skillId,
                certificationUrl: data.certificationUrl,
                issuedAt: data.issuedAt,
                expiresAt: data.expiresAt
            }
        });

        revalidatePath('/dashboard/staff');
        return { success: true, staffSkill };
    } catch (error) {
        console.error('Assign Skill Error:', error);
        return { error: 'Failed to assign skill' };
    }
}

export async function removeSkillFromStaff(staffId: string, skillId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        await prisma.staffSkill.delete({
            where: {
                staffId_skillId: { staffId, skillId }
            }
        });

        revalidatePath('/dashboard/staff');
        return { success: true };
    } catch (error) {
        console.error('Remove Skill Error:', error);
        return { error: 'Failed to remove skill' };
    }
}

export async function getStaffSkills(staffId: string) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const staffSkills = await prisma.staffSkill.findMany({
            where: { staffId },
            include: {
                skill: true
            }
        });

        return { staffSkills };
    } catch (error) {
        console.error('Get Staff Skills Error:', error);
        return { error: 'Failed to fetch staff skills' };
    }
}

// ===== SERVICE SKILL REQUIREMENTS =====

export async function setServiceSkillRequirements(serviceId: number, skillIds: number[]) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Verify service ownership
        const service = await prisma.service.findFirst({
            where: {
                id: serviceId,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!service) {
            return { error: 'Service not found or access denied' };
        }

        // Delete existing requirements and create new ones
        await prisma.serviceSkillRequirement.deleteMany({
            where: { serviceId }
        });

        if (skillIds.length > 0) {
            await prisma.serviceSkillRequirement.createMany({
                data: skillIds.map(skillId => ({
                    serviceId,
                    skillId
                }))
            });
        }

        revalidatePath('/dashboard/services');
        return { success: true };
    } catch (error) {
        console.error('Set Service Requirements Error:', error);
        return { error: 'Failed to set skill requirements' };
    }
}

// ===== ELIGIBLE STAFF LOOKUP =====

export async function getEligibleStaffForServices(serviceIds: number[]) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // Get all required skills for the services
        const requirements = await prisma.serviceSkillRequirement.findMany({
            where: { serviceId: { in: serviceIds } },
            select: { skillId: true }
        });

        const requiredSkillIds = [...new Set(requirements.map(r => r.skillId))];

        // If no skills required, return all staff
        if (requiredSkillIds.length === 0) {
            const user = await prisma.user.findUnique({
                where: { id: session.sub },
                include: { business: true }
            });

            if (!user?.business) return { staff: [] };

            const allStaff = await prisma.user.findMany({
                where: {
                    businessId: user.business.id,
                    role: { in: ['STAFF', 'OWNER'] },
                    isActive: true
                },
                select: { id: true, name: true, email: true }
            });

            return { staff: allStaff };
        }

        // Find staff with ALL required skills (not expired)
        const now = new Date();

        const staffWithSkills = await prisma.user.findMany({
            where: {
                role: { in: ['STAFF', 'OWNER'] },
                isActive: true,
                staffSkills: {
                    some: {
                        skillId: { in: requiredSkillIds },
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: now } }
                        ]
                    }
                }
            },
            include: {
                staffSkills: {
                    where: {
                        skillId: { in: requiredSkillIds },
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: now } }
                        ]
                    }
                }
            }
        });

        // Filter to only staff who have ALL required skills
        const eligibleStaff = staffWithSkills.filter(staff => {
            const staffSkillIds = staff.staffSkills.map(ss => ss.skillId);
            return requiredSkillIds.every(reqId => staffSkillIds.includes(reqId));
        });

        return {
            staff: eligibleStaff.map(s => ({
                id: s.id,
                name: s.name,
                email: s.email
            }))
        };
    } catch (error) {
        console.error('Get Eligible Staff Error:', error);
        return { error: 'Failed to fetch eligible staff' };
    }
}
