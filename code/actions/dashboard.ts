'use server'

import { prisma } from '@/lib/prisma';
import { getSession } from './auth';
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns';

export async function getDashboardStats() {
    try {
        const session = await getSession();
        if (!session) return { error: 'Unauthorized' };

        // 1. Get User's Business
        const user = await prisma.user.findUnique({
            where: { id: session.sub },
            include: { business: true }
        });

        if (!user?.business) return { error: 'Business not found' };

        const businessId = user.business.id;

        // 2. Fetch Basic Counts
        const [totalClients, activeServices, appointmentsChange] = await Promise.all([
            // Clients
            prisma.client.count({
                where: {
                    location: { businessId }
                }
            }),

            // Services (via Location usually, simplified assumption here or join needed)
            // Ideally we query services linked to business locations. 
            // For now, let's assume we find locations first.
            prisma.service.count({
                where: {
                    location: { businessId }
                }
            }),

            // Scheduled Appointments (Today)
            prisma.appointment.count({
                where: {
                    service: { location: { businessId } },
                    startTime: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            })
        ]);

        // 3. Calculate Revenue (Last 6 Months)
        // Group prices by month. Since Prisma grouping can be tricky with dates, 
        // we'll fetch completed appointments for the last 6 months and aggregate in JS.
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

        const completedAppointments = await prisma.appointment.findMany({
            where: {
                service: { location: { businessId } },
                // Assuming we have a status field based on analysis, but if not we take all past appointments?
                // Schema analysis said status exists.
                startTime: { gte: sixMonthsAgo },
                status: { not: 'CANCELLED' } // Include SCHEDULED as projected, or only COMPLETED? Let's use all non-cancelled for "Projected Revenue"
            },
            include: {
                service: {
                    select: { price: true }
                }
            }
        });

        const monthlyRevenue = new Map<string, number>();

        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const key = format(date, 'MMM');
            monthlyRevenue.set(key, 0);
        }

        // Aggregate
        let totalRevenue = 0;
        completedAppointments.forEach(apt => {
            const month = format(new Date(apt.startTime), 'MMM');
            const price = apt.service.price;
            totalRevenue += price;

            if (monthlyRevenue.has(month)) {
                monthlyRevenue.set(month, monthlyRevenue.get(month)! + price);
            }
        });

        const chartData = Array.from(monthlyRevenue.entries()).map(([name, total]) => ({
            name,
            total
        }));

        // 4. Get Recent Upcoming Appointments (Limit 5)
        const recentAppointments = await prisma.appointment.findMany({
            where: {
                service: { location: { businessId } },
                startTime: { gte: new Date() },
                status: { not: 'CANCELLED' }
            },
            take: 5,
            orderBy: { startTime: 'asc' },
            include: {
                client: { select: { name: true, email: true } },
                service: { select: { name: true, duration: true, price: true } },
                staff: { select: { name: true } }
            }
        });

        return {
            stats: {
                totalClients,
                activeServices,
                todayAppointments: appointmentsChange,
                totalRevenue,
                chartData,
                recentAppointments
            }
        };

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return { error: 'Failed to load dashboard stats' };
    }
}
