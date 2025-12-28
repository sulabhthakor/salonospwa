import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BusinessService } from '../business/business.service';

@Injectable()
export class ClientsService {
    constructor(
        private prisma: PrismaService,
        private businessService: BusinessService
    ) { }

    async findAllForOwner(userId: string) {
        const business = await this.businessService.findOneByOwner(userId);
        if (!business) return [];

        // Find all Clients who have visited any location of this business
        // Schema: Client -> Location -> Business
        // In our schema, Clients are scoped to a Location.
        // So we fetch all locations, then all clients in those locations.

        // Simpler: Find many Clients where location.business.ownerId = userId
        // But ownerId is on Business.
        return this.prisma.client.findMany({
            where: {
                location: {
                    businessId: business.id
                }
            },
            include: {
                _count: {
                    select: { appointments: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async findOne(userId: string, clientId: number) {
        const business = await this.businessService.findOneByOwner(userId);
        if (!business) throw new NotFoundException('Business not found');

        const client = await this.prisma.client.findFirst({
            where: {
                id: clientId,
                location: {
                    businessId: business.id
                }
            },
            include: {
                appointments: {
                    include: { service: true, staff: true },
                    orderBy: { startTime: 'desc' }
                }
            }
        });

        if (!client) throw new NotFoundException('Client not found');
        return client;
    }
}
