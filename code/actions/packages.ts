'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { revalidatePath } from 'next/cache';
import { PackageType } from '@prisma/client';

// ===== PACKAGE CRUD =====

export async function createPackage(data: {
    name: string;
    description?: string;
    type: PackageType;
    totalValue: number;
    price: number;
    expiryDays?: number;
    serviceIds: number[];
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

        const pkg = await prisma.package.create({
            data: {
                name: data.name,
                description: data.description,
                type: data.type,
                totalValue: data.totalValue,
                price: data.price,
                expiryDays: data.expiryDays,
                locationId,
                services: {
                    create: data.serviceIds.map(serviceId => ({
                        serviceId
                    }))
                }
            },
            include: { services: { include: { service: true } } }
        });

        revalidatePath('/dashboard/packages');
        return { success: true, package: pkg };
    } catch (error) {
        console.error('Create Package Error:', error);
        return { error: 'Failed to create package' };
    }
}

export async function updatePackage(id: number, data: {
    name?: string;
    description?: string;
    type?: PackageType;
    totalValue?: number;
    price?: number;
    expiryDays?: number;
    isActive?: boolean;
    serviceIds?: number[];
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const pkg = await prisma.package.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!pkg) {
            return { error: 'Package not found or access denied' };
        }

        // Update service associations if provided
        if (data.serviceIds) {
            await prisma.packageService.deleteMany({ where: { packageId: id } });
            await prisma.packageService.createMany({
                data: data.serviceIds.map(serviceId => ({
                    packageId: id,
                    serviceId
                }))
            });
        }

        const { serviceIds, ...updateData } = data;

        const updatedPkg = await prisma.package.update({
            where: { id },
            data: updateData,
            include: { services: { include: { service: true } } }
        });

        revalidatePath('/dashboard/packages');
        return { success: true, package: updatedPkg };
    } catch (error) {
        console.error('Update Package Error:', error);
        return { error: 'Failed to update package' };
    }
}

export async function deletePackage(id: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const pkg = await prisma.package.findFirst({
            where: {
                id,
                location: {
                    business: { ownerId: session.sub }
                }
            }
        });

        if (!pkg) {
            return { error: 'Package not found or access denied' };
        }

        // Soft delete to preserve purchase history
        await prisma.package.update({
            where: { id },
            data: { isActive: false }
        });

        revalidatePath('/dashboard/packages');
        return { success: true };
    } catch (error) {
        console.error('Delete Package Error:', error);
        return { error: 'Failed to delete package' };
    }
}

export async function getPackages(locationId?: number) {
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
                return { packages: [] };
            }

            targetLocationId = user.business.locations[0].id;
        }

        const packages = await prisma.package.findMany({
            where: {
                locationId: targetLocationId,
                isActive: true
            },
            include: {
                services: { include: { service: true } }
            },
            orderBy: { name: 'asc' }
        });

        return { packages };
    } catch (error) {
        console.error('Get Packages Error:', error);
        return { error: 'Failed to fetch packages' };
    }
}

// ===== CLIENT PACKAGE MANAGEMENT =====

export async function purchasePackage(data: {
    clientId: number;
    packageId: number;
    paymentId?: string;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const pkg = await prisma.package.findUnique({
            where: { id: data.packageId }
        });

        if (!pkg || !pkg.isActive) {
            return { error: 'Package not found or inactive' };
        }

        // Calculate expiry date
        let expiresAt: Date | null = null;
        if (pkg.expiryDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + pkg.expiryDays);
        }

        const clientPackage = await prisma.clientPackage.create({
            data: {
                clientId: data.clientId,
                packageId: data.packageId,
                remainingValue: pkg.totalValue,
                expiresAt
            },
            include: { package: true }
        });

        return { success: true, clientPackage };
    } catch (error) {
        console.error('Purchase Package Error:', error);
        return { error: 'Failed to purchase package' };
    }
}

export async function getClientPackages(clientId: number) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const packages = await prisma.clientPackage.findMany({
            where: { clientId },
            include: {
                package: {
                    include: { services: { include: { service: true } } }
                },
                usages: {
                    include: { appointment: true }
                }
            },
            orderBy: { purchasedAt: 'desc' }
        });

        return { packages };
    } catch (error) {
        console.error('Get Client Packages Error:', error);
        return { error: 'Failed to fetch client packages' };
    }
}

export async function deductPackageUsage(data: {
    clientPackageId: number;
    appointmentId: number;
    valueToDeduct: number;
}) {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        const clientPackage = await prisma.clientPackage.findUnique({
            where: { id: data.clientPackageId }
        });

        if (!clientPackage) {
            return { error: 'Client package not found' };
        }

        // Check expiry
        if (clientPackage.expiresAt && clientPackage.expiresAt < new Date()) {
            return { error: 'Package has expired' };
        }

        // Check remaining value
        if (clientPackage.remainingValue < data.valueToDeduct) {
            return { error: 'Insufficient package balance' };
        }

        // Create usage record and update remaining value
        const [usage] = await prisma.$transaction([
            prisma.packageUsage.create({
                data: {
                    clientPackageId: data.clientPackageId,
                    appointmentId: data.appointmentId,
                    valueUsed: data.valueToDeduct
                }
            }),
            prisma.clientPackage.update({
                where: { id: data.clientPackageId },
                data: {
                    remainingValue: {
                        decrement: data.valueToDeduct
                    }
                }
            })
        ]);

        return { success: true, usage };
    } catch (error) {
        console.error('Deduct Package Usage Error:', error);
        return { error: 'Failed to deduct package usage' };
    }
}

// ===== HELPER: Get available packages for a service =====

export async function getAvailablePackagesForService(clientId: number, serviceId: number) {
    try {
        const now = new Date();

        const availablePackages = await prisma.clientPackage.findMany({
            where: {
                clientId,
                remainingValue: { gt: 0 },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } }
                ],
                package: {
                    isActive: true,
                    services: {
                        some: { serviceId }
                    }
                }
            },
            include: {
                package: {
                    include: { services: { include: { service: true } } }
                }
            }
        });

        return { packages: availablePackages };
    } catch (error) {
        console.error('Get Available Packages Error:', error);
        return { error: 'Failed to fetch available packages' };
    }
}
