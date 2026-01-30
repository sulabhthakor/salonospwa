'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';

// ===== ADD-ON CRUD =====

export async function createAddOn(data: {
    name: string;
    description?: string;
    price: number;
    durationChange?: number;
    productId?: number;
    productQty?: number;
    serviceIds?: number[];
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

        const locationId = user.business.locations[0].id;

        const addOn = await prisma.addOn.create({
            data: {
                name: data.name,
                description: data.description,
                price: data.price,
                durationChange: data.durationChange || 0,
                productId: data.productId,
                productQty: data.productQty,
                locationId,
                applicableServices: data.serviceIds ? {
                    create: data.serviceIds.map(serviceId => ({ serviceId }))
                } : undefined
            },
            include: {
                applicableServices: { include: { service: true } },
                product: true
            }
        });

        revalidatePath('/dashboard/addons');
        return { success: true, addOn };
    } catch (error) {
        console.error('Create Add-On Error:', error);
        return { error: 'Failed to create add-on' };
    }
}

export async function updateAddOn(id: number, data: {
    name?: string;
    description?: string;
    price?: number;
    durationChange?: number;
    productId?: number;
    productQty?: number;
    serviceIds?: number[];
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const addOn = await prisma.addOn.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!addOn) {
            return { error: 'Add-on not found or access denied' };
        }

        // Update service associations if provided
        if (data.serviceIds !== undefined) {
            await prisma.serviceAddOn.deleteMany({ where: { addOnId: id } });
            if (data.serviceIds.length > 0) {
                await prisma.serviceAddOn.createMany({
                    data: data.serviceIds.map(serviceId => ({
                        addOnId: id,
                        serviceId
                    }))
                });
            }
        }

        const { serviceIds, ...updateData } = data;

        const updatedAddOn = await prisma.addOn.update({
            where: { id },
            data: updateData,
            include: {
                applicableServices: { include: { service: true } },
                product: true
            }
        });

        revalidatePath('/dashboard/addons');
        return { success: true, addOn: updatedAddOn };
    } catch (error) {
        console.error('Update Add-On Error:', error);
        return { error: 'Failed to update add-on' };
    }
}

export async function deleteAddOn(id: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const addOn = await prisma.addOn.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!addOn) {
            return { error: 'Add-on not found or access denied' };
        }

        // Delete related records first
        await prisma.serviceAddOn.deleteMany({ where: { addOnId: id } });
        await prisma.appointmentAddOn.deleteMany({ where: { addOnId: id } });
        await prisma.addOn.delete({ where: { id } });

        revalidatePath('/dashboard/addons');
        return { success: true };
    } catch (error) {
        console.error('Delete Add-On Error:', error);
        return { error: 'Failed to delete add-on' };
    }
}

export async function getAddOns(locationId?: number) {
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
                return { addOns: [] };
            }

            targetLocationId = user.business.locations[0].id;
        }

        const addOns = await prisma.addOn.findMany({
            where: { locationId: targetLocationId },
            include: {
                applicableServices: { include: { service: true } },
                product: true
            },
            orderBy: { name: 'asc' }
        });

        return { addOns };
    } catch (error) {
        console.error('Get Add-Ons Error:', error);
        return { error: 'Failed to fetch add-ons' };
    }
}

// ===== SERVICE ADD-ONS =====

export async function getServiceAddOns(serviceIds: number | number[]) {
    try {
        const ids = Array.isArray(serviceIds) ? serviceIds : [serviceIds];

        const addOns = await prisma.addOn.findMany({
            where: {
                applicableServices: {
                    some: { serviceId: { in: ids } }
                }
            },
            include: {
                product: true,
                applicableServices: true
            }
        });

        return { addOns };
    } catch (error) {
        console.error('Get Service Add-Ons Error:', error);
        return { error: 'Failed to fetch service add-ons' };
    }
}

// ===== APPOINTMENT ADD-ONS =====

export async function addAddOnToAppointment(data: {
    appointmentId: number;
    addOnId: number;
    quantity?: number;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const appointmentAddOn = await prisma.appointmentAddOn.upsert({
            where: {
                appointmentId_addOnId: {
                    appointmentId: data.appointmentId,
                    addOnId: data.addOnId
                }
            },
            update: {
                quantity: data.quantity || 1
            },
            create: {
                appointmentId: data.appointmentId,
                addOnId: data.addOnId,
                quantity: data.quantity || 1
            },
            include: { addOn: true }
        });

        return { success: true, appointmentAddOn };
    } catch (error) {
        console.error('Add Add-On to Appointment Error:', error);
        return { error: 'Failed to add add-on to appointment' };
    }
}

export async function removeAddOnFromAppointment(appointmentId: number, addOnId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        await prisma.appointmentAddOn.delete({
            where: {
                appointmentId_addOnId: { appointmentId, addOnId }
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Remove Add-On from Appointment Error:', error);
        return { error: 'Failed to remove add-on from appointment' };
    }
}

export async function getAppointmentAddOns(appointmentId: number) {
    try {
        const addOns = await prisma.appointmentAddOn.findMany({
            where: { appointmentId },
            include: {
                addOn: {
                    include: { product: true }
                }
            }
        });

        return { addOns };
    } catch (error) {
        console.error('Get Appointment Add-Ons Error:', error);
        return { error: 'Failed to fetch appointment add-ons' };
    }
}

// ===== PRICE CALCULATION =====

export async function calculateAppointmentTotal(appointmentId: number) {
    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                service: true,
                appointmentAddOns: {
                    include: { addOn: true }
                },
                client: true
            }
        });

        if (!appointment) {
            return { error: 'Appointment not found' };
        }

        // Base service price
        let total = appointment.service.price;

        // Add add-on prices
        for (const appAddOn of appointment.appointmentAddOns) {
            total += appAddOn.addOn.price * appAddOn.quantity;
        }

        // Check for membership discount
        const activeMembership = await prisma.clientMembership.findFirst({
            where: {
                clientId: appointment.clientId,
                status: 'ACTIVE'
            },
            include: { membership: true }
        });

        let discount = 0;
        if (activeMembership) {
            discount = total * (activeMembership.membership.discountPercent / 100);
        }

        return {
            basePrice: appointment.service.price,
            addOnsTotal: total - appointment.service.price,
            discount,
            total: total - discount
        };
    } catch (error) {
        console.error('Calculate Total Error:', error);
        return { error: 'Failed to calculate total' };
    }
}
