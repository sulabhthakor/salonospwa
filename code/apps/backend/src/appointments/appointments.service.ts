import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) { }

    async create(clientId: number, data: { serviceIds: number[]; startTime: string; staffId?: string }) {
        const createdAppointments = [];
        let currentStartTime = new Date(data.startTime);

        for (const serviceId of data.serviceIds) {
            // 1. Get Service details
            const service = await this.prisma.service.findUnique({
                where: { id: serviceId }
            });
            if (!service) throw new NotFoundException(`Service ${serviceId} not found`);

            // 2. Determine Staff (Re-evaluate for each service if needed, but usually same staff or optimized)
            // For MVP: Auto-assign same staff or owner for all for consistency
            // Logic: If data.staffId provided, use it. Else find owner of location.
            let staffId = data.staffId;
            if (!staffId) {
                const location = await this.prisma.location.findUnique({
                    where: { id: service.locationId },
                    include: { business: true }
                });
                if (!location) throw new NotFoundException('Location not found');

                // Find the Business and its Owner directly
                const business = await this.prisma.business.findUnique({
                    where: { id: location.businessId },
                    include: { owner: true }
                });

                if (!business || !business.owner) throw new NotFoundException('Business Owner not found');
                staffId = business.owner.id;
            }

            // 3. Create Appointment
            const appointment = await this.prisma.appointment.create({
                data: {
                    startTime: currentStartTime,
                    duration: service.duration,
                    status: 'SCHEDULED',
                    service: { connect: { id: service.id } },
                    staff: { connect: { id: staffId } },
                    client: { connect: { id: clientId } },
                    location: { connect: { id: service.locationId } }
                }
            });

            createdAppointments.push(appointment);

            // Update start time for next service
            // Add duration (minutes) to current time
            currentStartTime = new Date(currentStartTime.getTime() + service.duration * 60000);
        }

        return createdAppointments;
    }

    async findAllForUser(userId: string, role: string, email?: string) {
        if (role === 'OWNER') {
            const business = await this.prisma.business.findFirst({
                where: { ownerId: userId }
            });

            if (!business) return []; // Should not happen for Owner

            // Find all locations for this business
            const locations = await this.prisma.location.findMany({
                where: { businessId: business.id },
                select: { id: true }
            });
            const locationIds = locations.map(l => l.id);

            return this.prisma.appointment.findMany({
                where: {
                    locationId: { in: locationIds }
                },
                include: { service: true, client: true },
                orderBy: { startTime: 'desc' }
            })
        } else if (role === 'CLIENT') {
            if (!email) return [];

            // Find all Client profiles with this email
            const clients = await this.prisma.client.findMany({
                where: { email: email },
                select: { id: true }
            });

            const clientIds = clients.map(c => c.id);

            return this.prisma.appointment.findMany({
                where: {
                    clientId: { in: clientIds }
                },
                include: { service: true, client: true, location: true }, // Include location for context
                orderBy: { startTime: 'desc' }
            });
        }

        return [];
    }
}
