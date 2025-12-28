import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { BusinessService } from '../business/business.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
    constructor(
        private prisma: PrismaService,
        private businessService: BusinessService
    ) { }

    async create(userId: string, data: CreateServiceDto) {
        // 1. Find User's Business
        const business = await this.businessService.findOneByOwner(userId);
        if (!business || business.locations.length === 0) {
            throw new NotFoundException('You must create a business profile first.');
        }

        // 2. Use the first location (Main Location)
        const locationId = business.locations[0].id;

        // 3. Create Service linked to that Location
        return this.prisma.service.create({
            data: {
                name: data.name,
                category: data.category || "General",
                duration: data.duration,
                price: data.price,
                locationId: locationId
            },
        });
    }

    async findAll(userId: string) {
        const business = await this.businessService.findOneByOwner(userId);
        if (!business || business.locations.length === 0) return [];

        // Find services for all locations of this business
        const locationIds = business.locations.map(loc => loc.id);

        return this.prisma.service.findMany({
            where: { locationId: { in: locationIds } },
        });
    }

    async findAllPublic() {
        return this.prisma.service.findMany();
    }

    async update(id: number, userId: string, data: UpdateServiceDto) {
        // Verify ownership (the service belongs to a location owned by the user)
        const service = await this.prisma.service.findFirst({
            where: {
                id,
                location: {
                    business: {
                        ownerId: userId
                    }
                }
            }
        });

        if (!service) {
            throw new NotFoundException('Service not found or access denied');
        }

        return this.prisma.service.update({
            where: { id },
            data
        });
    }

    async remove(id: number, userId: string) {
        const service = await this.prisma.service.findFirst({
            where: {
                id,
                location: {
                    business: {
                        ownerId: userId
                    }
                }
            }
        });

        if (!service) {
            throw new NotFoundException('Service not found or access denied');
        }

        return this.prisma.service.delete({
            where: { id }
        });
    }
}
