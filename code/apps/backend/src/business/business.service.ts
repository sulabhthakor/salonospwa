import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Business, Prisma, Role } from '@prisma/client';

@Injectable()
export class BusinessService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: { name: string; address: string; phone: string }) {
        // 1. Check if user already has a business
        const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { business: true } });
        if (user?.business) {
            throw new BadRequestException('User already owns a business');
        }

        // 2. Create Business and Default Location in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            const business = await tx.business.create({
                data: {
                    name: data.name,
                    ownerId: userId,
                    status: 'PENDING',
                    locations: {
                        create: {
                            name: 'Main Location',
                        }
                    }
                },
                include: { locations: true }
            });

            // 3. Link User to Business and make OWNER
            await tx.user.update({
                where: { id: userId },
                data: {
                    businessId: business.id,
                    role: Role.OWNER
                }
            });

            return business;
        });

        return result;
    }

    async findOneByOwner(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                business: {
                    include: { locations: true }
                }
            }
        });
        return user?.business || null;
    }

    async update(ownerId: string, data: any) {
        // ... (existing update logic)
        // For simplicity, reusing prisma update
        const business = await this.findOneByOwner(ownerId);
        if (!business) throw new Error("Business not found");

        return this.prisma.business.update({
            where: { id: business.id },
            data
        });
    }

    async findAllApproved() {
        return this.prisma.business.findMany({
            where: { status: 'APPROVED' },
            include: {
                locations: true
            }
        });
    }
}
