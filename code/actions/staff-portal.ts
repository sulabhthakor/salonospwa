"use server";

import { getSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStaffDailySchedule(dateStr: string) {
    const session = await getSession();

    if (!session || !session.sub) {
        return { success: false, error: "Unauthorized" };
    }

    // Parse date (expecting YYYY-MM-DD)
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                staffId: session.sub,
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                client: {
                    select: { name: true, phone: true, email: true }
                },
                service: {
                    select: { name: true, duration: true, price: true }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return { success: true, data: appointments };

    } catch (error) {
        console.error("Error fetching staff schedule:", error);
        return { success: false, error: "Failed to fetch schedule" };
    }
}

export async function updateAppointmentStatus(id: number, status: "COMPLETED" | "CANCELLED") {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        // Verify ownership/permission
        const appointment = await prisma.appointment.findUnique({
            where: { id },
            select: { staffId: true }
        });

        if (!appointment || appointment.staffId !== session.sub) {
            // Check if Admin/Owner? For now, restricted to assigned staff
            // Actually, Owner/Admin should probably be able to edit too, but let's stick to simple
            return { success: false, error: "Unauthorized or not found" };
        }

        await prisma.appointment.update({
            where: { id },
            data: { status }
        });

        revalidatePath('/staff/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error updating appointment:", error);
        return { success: false, error: "Failed to update status" };
    }
}
