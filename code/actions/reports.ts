"use server";

import { getSession } from "@/actions/auth";
import { prisma } from "@/lib/prisma";

export async function getAnalytics() {
    const session = await getSession();
    if (!session || !session.sub) return { success: false, error: "Unauthorized" };

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            select: { role: true, locationId: true, businessId: true }
        });

        // For SUPER_ADMIN or ADMIN, show platform-wide analytics
        const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

        // Resolve Location ID for non-admin users
        let targetLocationId = user?.locationId;
        if (!isAdmin) {
            if (!targetLocationId && user?.businessId) {
                const firstLoc = await prisma.location.findFirst({
                    where: { businessId: user.businessId }
                });
                if (firstLoc) targetLocationId = firstLoc.id;
            }

            if (!targetLocationId) return { success: false, error: "No location context" };
        }

        // Build query filter - admins see all, others see only their location
        const appointmentFilter: any = {
            status: 'COMPLETED'
        };
        if (!isAdmin && targetLocationId) {
            appointmentFilter.locationId = targetLocationId;
        }

        // 1. Fetch completed appointments
        const appointments = await prisma.appointment.findMany({
            where: appointmentFilter,
            include: { service: true },
            orderBy: { startTime: 'asc' }
        });

        // Group by Date for Chart (Last 30 days)
        const revenueMap: Record<string, number> = {};
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            revenueMap[dateStr] = 0;
        }

        appointments.forEach(app => {
            const dateStr = app.startTime.toISOString().split('T')[0];
            if (revenueMap[dateStr] !== undefined) {
                revenueMap[dateStr] += app.service.price;
            }
        });

        const revenueChartData = Object.entries(revenueMap).map(([date, amount]) => ({
            date,
            amount
        }));

        // 2. Top Services
        const serviceCounts: Record<string, number> = {};
        appointments.forEach(app => {
            serviceCounts[app.service.name] = (serviceCounts[app.service.name] || 0) + 1;
        });
        const topServices = Object.entries(serviceCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            success: true,
            data: {
                revenueChartData,
                topServices,
                totalRevenue: appointments.reduce((sum, app) => sum + app.service.price, 0),
                totalAppointments: appointments.length
            }
        };

    } catch (error) {
        console.error("Analytics Error:", error);
        return { success: false, error: "Failed to fetch analytics" };
    }
}
