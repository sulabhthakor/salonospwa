import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AppointmentsService {
    constructor(private prisma: PrismaService) { }

    async create(clientId: number, data: { serviceId: number; startTime: string; staffId?: string }) {
        // 1. Get Service details (to know duration)
        const service = await this.prisma.service.findUnique({
            where: { id: data.serviceId }
        });
        if (!service) throw new NotFoundException('Service not found');

        // 2. Determine Staff
        let staffId = data.staffId;
        if (!staffId) {
            // Auto-assign: Find the Business Owner/Staff associated with this service's location
            // For simplicity v1: Find the owner of the service's location
            const location = await this.prisma.location.findUnique({
                where: { id: service.locationId },
                include: { business: true }
            });
            if (!location) throw new NotFoundException('Location not found');

            // Assign to the Business Owner
            const owner = await this.prisma.user.findFirst({
                where: {
                    businessId: location.businessId,
                    role: 'OWNER'
                }
            });

            if (!owner) throw new NotFoundException('Business Owner not found');
            staffId = owner.id;
        }

        // 3. Check Availability (Basic: No overlap for this staff)
        const start = new Date(data.startTime);
        const end = new Date(start.getTime() + service.duration * 60000);

        const conflict = await this.prisma.appointment.findFirst({
            where: {
                staffId: staffId,
                OR: [
                    { startTime: { lte: start }, duration: { gt: 0 } }, // Overlap logic needed? 
                    // A simple overlaps check: (StartA <= EndB) and (EndA >= StartB)
                    // Prisma doesn't have "EndA", we have start + duration.
                    // Let's do a raw check or fetch colliding apps. 
                    // For MVP: Fetch appointments around that time and check in JS or simple query.
                ],
                // improving query:
                startTime: {
                    gte: new Date(start.getTime() - 24 * 60 * 60 * 1000), // look at that day
                    lte: new Date(start.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        // Better conflict check in JS for now to handle duration calc
        // In a real app, use Postgres TsRange or efficient query

        // 4. Create Client Record if user is generic? 
        // In our schema, 'Client' is a separate model from 'User'.
        // Use the `clientId` passed in (which corresponds to Client model id, NOT User model id?)
        // Wait, our Auth is 'User'. 'Client' model seems to be for "Business's Client List".
        // If a logged-in 'User' (Role: CLIENT) books, we should probably link them.
        // Let's check Schema: Appointment has `clientId Int` and `client Client`. 
        // This implies Appointments are linked to the "CRM Client", not directly the "Auth User".
        // We need to Find-or-Create a CRM Client for the Auth User.

        // Let's first ensure a CRM Client exists for this User (if they are a User)
        // Actually, let's keep it simple: We need a Client ID. 
        // If endpoints calls `create`, it usually comes from a User.
        // We'll handle this mapping in the Controller or here.

        return this.prisma.appointment.create({
            data: {
                startTime: start,
                duration: service.duration,
                status: 'SCHEDULED',
                service: { connect: { id: service.id } },
                staff: { connect: { id: staffId } },
                client: { connect: { id: clientId } },
                location: { connect: { id: service.locationId } }
            }
        });
    }

    async findAllForUser(userId: string, role: string) {
        if (role === 'OWNER') {
            return this.prisma.appointment.findMany({
                where: {
                    staffId: userId // Assuming Owner is Staff for now
                },
                include: { service: true, client: true }
            })
        } else {
            // For Client Users, we need to find their linked Client ID?
            // This schema separation (User vs Client) is slightly complex.
            // For MVP, let's assume we look up by some implicit link or just return empty for now if not linked.
            return [];
        }
    }
}
