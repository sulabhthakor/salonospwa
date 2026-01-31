"use server";

import { getSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getInventory() {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        // Get user's business/location
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            select: { locationId: true, businessId: true }
        });

        if (!user?.locationId) {
            // If user is Owner/Admin but not linked to a specific location, 
            // we might need to fetch products for ALL locations of the business?
            // For MVP, assuming context is single location or first location
            if (user?.businessId) {
                const firstLoc = await prisma.location.findFirst({
                    where: { businessId: user.businessId }
                });
                if (firstLoc) {
                    const products = await prisma.product.findMany({
                        where: { locationId: firstLoc.id },
                        orderBy: { name: 'asc' }
                    });
                    return { success: true, data: products };
                }
            }
            return { success: false, error: "No location found" };
        }

        const products = await prisma.product.findMany({
            where: { locationId: user.locationId },
            orderBy: { name: 'asc' }
        });

        return { success: true, data: products };
    } catch (error) {
        console.error("Get Inventory Error:", error);
        return { success: false, error: "Failed to fetch inventory" };
    }
}

export async function createProduct(data: { name: string; price: number; stock: number; sku?: string }) {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            select: { locationId: true, businessId: true }
        });

        let targetLocationId = user?.locationId;

        // Fallback for Business Owner without direct location link
        if (!targetLocationId && user?.businessId) {
            const firstLoc = await prisma.location.findFirst({
                where: { businessId: user.businessId }
            });
            if (firstLoc) targetLocationId = firstLoc.id;
        }

        if (!targetLocationId) return { success: false, error: "No location context" };

        await prisma.product.create({
            data: {
                name: data.name,
                price: data.price,
                stock: data.stock,
                sku: data.sku,
                locationId: targetLocationId
            }
        });

        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        console.error("Create Product Error:", error);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateStock(id: number, stock: number) {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        await prisma.product.update({
            where: { id },
            data: { stock }
        });
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update stock" };
    }
}

export async function deleteProduct(id: number) {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        await prisma.product.delete({
            where: { id }
        });
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete product" };
    }
}

// ===== SERVICE INVENTORY USAGE =====

export async function setServiceInventoryUsage(serviceId: number, usages: { productId: number; quantity: number }[]) {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
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
            return { success: false, error: "Service not found or access denied" };
        }

        // Delete existing usages
        await prisma.serviceInventoryUsage.deleteMany({
            where: { serviceId }
        });

        // Create new usages
        if (usages.length > 0) {
            await prisma.serviceInventoryUsage.createMany({
                data: usages.map(u => ({
                    serviceId,
                    productId: u.productId,
                    quantity: u.quantity
                }))
            });
        }

        revalidatePath('/dashboard/services');
        return { success: true };
    } catch (error) {
        console.error("Set Service Inventory Usage Error:", error);
        return { success: false, error: "Failed to set inventory usage" };
    }
}

export async function getServiceInventoryUsage(serviceId: number) {
    try {
        const usages = await prisma.serviceInventoryUsage.findMany({
            where: { serviceId },
            include: { product: true }
        });

        return { success: true, usages };
    } catch (error) {
        console.error("Get Service Inventory Usage Error:", error);
        return { success: false, error: "Failed to fetch inventory usage" };
    }
}

// ===== STOCK DEDUCTION ON SERVICE COMPLETION =====

export async function deductInventoryForAppointment(appointmentId: number) {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                service: {
                    include: {
                        inventoryUsage: {
                            include: { product: true }
                        }
                    }
                },
                appointmentAddOns: {
                    include: {
                        addOn: {
                            include: { product: true }
                        }
                    }
                }
            }
        });

        if (!appointment) {
            return { success: false, error: "Appointment not found" };
        }

        const deductions: { productId: number; quantity: number; productName: string }[] = [];
        const lowStockAlerts: { productId: number; productName: string; stock: number }[] = [];

        // Deduct service inventory usage
        for (const usage of appointment.service.inventoryUsage) {
            await prisma.product.update({
                where: { id: usage.productId },
                data: { stock: { decrement: usage.quantity } }
            });

            deductions.push({
                productId: usage.productId,
                quantity: usage.quantity,
                productName: usage.product.name
            });

            // Check low stock
            const updatedProduct = await prisma.product.findUnique({
                where: { id: usage.productId }
            });

            if (updatedProduct && updatedProduct.stock <= updatedProduct.lowStockThreshold) {
                lowStockAlerts.push({
                    productId: updatedProduct.id,
                    productName: updatedProduct.name,
                    stock: updatedProduct.stock
                });
            }
        }

        // Deduct add-on inventory usage
        for (const appAddOn of appointment.appointmentAddOns) {
            if (appAddOn.addOn.productId && appAddOn.addOn.productQty) {
                const qty = appAddOn.addOn.productQty * appAddOn.quantity;

                await prisma.product.update({
                    where: { id: appAddOn.addOn.productId },
                    data: { stock: { decrement: qty } }
                });

                deductions.push({
                    productId: appAddOn.addOn.productId,
                    quantity: qty,
                    productName: appAddOn.addOn.product?.name || 'Unknown'
                });

                // Check low stock
                const updatedProduct = await prisma.product.findUnique({
                    where: { id: appAddOn.addOn.productId }
                });

                if (updatedProduct && updatedProduct.stock <= updatedProduct.lowStockThreshold) {
                    lowStockAlerts.push({
                        productId: updatedProduct.id,
                        productName: updatedProduct.name,
                        stock: updatedProduct.stock
                    });
                }
            }
        }

        revalidatePath('/admin/inventory');
        return {
            success: true,
            deductions,
            lowStockAlerts: lowStockAlerts.length > 0 ? lowStockAlerts : undefined
        };
    } catch (error) {
        console.error("Deduct Inventory Error:", error);
        return { success: false, error: "Failed to deduct inventory" };
    }
}

// ===== LOW STOCK ALERTS =====

export async function getLowStockProducts(locationId?: number) {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        let targetLocationId = locationId;

        if (!targetLocationId) {
            const user = await prisma.user.findUnique({
                where: { id: session.sub },
                include: { business: { include: { locations: true } } }
            });

            if (!user?.business?.locations?.[0]) {
                return { success: true, products: [] };
            }

            targetLocationId = user.business.locations[0].id;
        }

        // Find products where stock is at or below threshold
        const lowStockProducts = await prisma.product.findMany({
            where: {
                locationId: targetLocationId,
                stock: { lte: prisma.product.fields.lowStockThreshold }
            },
            orderBy: { stock: 'asc' }
        });

        // Workaround: Prisma doesn't support comparing two fields directly
        // So we fetch all and filter
        const allProducts = await prisma.product.findMany({
            where: { locationId: targetLocationId }
        });

        const filtered = allProducts.filter(p => p.stock <= p.lowStockThreshold);

        return { success: true, products: filtered };
    } catch (error) {
        console.error("Get Low Stock Products Error:", error);
        return { success: false, error: "Failed to fetch low stock products" };
    }
}

export async function updateLowStockThreshold(productId: number, threshold: number) {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        await prisma.product.update({
            where: { id: productId },
            data: { lowStockThreshold: threshold }
        });

        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        console.error("Update Threshold Error:", error);
        return { success: false, error: "Failed to update threshold" };
    }
}

