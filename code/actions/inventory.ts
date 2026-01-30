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
