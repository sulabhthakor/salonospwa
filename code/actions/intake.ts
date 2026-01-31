'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';

// ===== INTAKE FORM TEMPLATE CRUD =====

export async function createIntakeFormTemplate(data: {
    name: string;
    fields: object[];
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: { include: { locations: true } } }
        });

        if (!user?.business?.locations?.[0]) {
            return { error: 'You must have a business with a location first.' };
        }

        const template = await prisma.intakeFormTemplate.create({
            data: {
                name: data.name,
                fields: data.fields,
                locationId: user.business.locations[0].id
            }
        });

        revalidatePath('/dashboard/forms');
        return { success: true, template };
    } catch (error) {
        console.error('Create Intake Form Template Error:', error);
        return { error: 'Failed to create intake form template' };
    }
}

export async function updateIntakeFormTemplate(id: number, data: {
    name?: string;
    fields?: object[];
    isActive?: boolean;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const template = await prisma.intakeFormTemplate.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!template) {
            return { error: 'Template not found or access denied' };
        }

        const updatedTemplate = await prisma.intakeFormTemplate.update({
            where: { id },
            data
        });

        revalidatePath('/dashboard/forms');
        return { success: true, template: updatedTemplate };
    } catch (error) {
        console.error('Update Intake Form Template Error:', error);
        return { error: 'Failed to update template' };
    }
}

export async function deleteIntakeFormTemplate(id: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const template = await prisma.intakeFormTemplate.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!template) {
            return { error: 'Template not found or access denied' };
        }

        // Soft delete - just deactivate to preserve responses
        await prisma.intakeFormTemplate.update({
            where: { id },
            data: { isActive: false }
        });

        revalidatePath('/dashboard/forms');
        return { success: true };
    } catch (error) {
        console.error('Delete Intake Form Template Error:', error);
        return { error: 'Failed to delete template' };
    }
}

export async function getIntakeFormTemplates(locationId?: number) {
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
                return { templates: [] };
            }

            targetLocationId = user.business.locations[0].id;
        }

        const templates = await prisma.intakeFormTemplate.findMany({
            where: {
                locationId: targetLocationId,
                isActive: true
            },
            orderBy: { name: 'asc' }
        });

        return { templates };
    } catch (error) {
        console.error('Get Intake Form Templates Error:', error);
        return { error: 'Failed to fetch templates' };
    }
}

// ===== INTAKE RESPONSES =====

export async function submitIntakeResponse(data: {
    templateId: number;
    clientId: number;
    appointmentId?: number;
    responses: Record<string, unknown>;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const response = await prisma.intakeResponse.create({
            data: {
                templateId: data.templateId,
                clientId: data.clientId,
                appointmentId: data.appointmentId,
                responses: data.responses as object
            }
        });

        return { success: true, response };
    } catch (error) {
        console.error('Submit Intake Response Error:', error);
        return { error: 'Failed to submit intake response' };
    }
}

export async function getClientIntakeResponses(clientId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const responses = await prisma.intakeResponse.findMany({
            where: { clientId },
            include: {
                template: true,
                appointment: {
                    include: { service: true }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        return { responses };
    } catch (error) {
        console.error('Get Client Intake Responses Error:', error);
        return { error: 'Failed to fetch intake responses' };
    }
}

export async function getAppointmentIntakeResponses(appointmentId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const responses = await prisma.intakeResponse.findMany({
            where: { appointmentId },
            include: {
                template: true,
                client: true
            },
            orderBy: { submittedAt: 'desc' }
        });

        return { responses };
    } catch (error) {
        console.error('Get Appointment Intake Responses Error:', error);
        return { error: 'Failed to fetch intake responses' };
    }
}

// ===== HELPER: Check if client has submitted intake =====

export async function hasClientSubmittedIntake(clientId: number, templateId?: number) {
    try {
        const existingResponse = await prisma.intakeResponse.findFirst({
            where: {
                clientId,
                templateId: templateId || undefined
            }
        });

        return { hasSubmitted: !!existingResponse };
    } catch (error) {
        console.error('Check Intake Submission Error:', error);
        return { error: 'Failed to check intake submission' };
    }
}
