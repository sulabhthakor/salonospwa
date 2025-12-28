
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { BusinessStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getStats() {
        const totalUsers = await this.prisma.user.count();
        const totalSalons = await this.prisma.business.count();
        const pendingSalons = await this.prisma.business.count({
            where: { status: 'PENDING' }
        });
        const totalBookings = await this.prisma.appointment.count();

        return {
            totalUsers,
            totalSalons,
            pendingSalons,
            totalBookings
        };
    }

    async getSalons() {
        return this.prisma.business.findMany({
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                _count: {
                    select: { locations: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateSalonStatus(id: string, status: BusinessStatus) {
        return this.prisma.business.update({
            where: { id },
            data: { status }
        });
    }

    async getUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                businessId: true
            }
        });
    }
}
