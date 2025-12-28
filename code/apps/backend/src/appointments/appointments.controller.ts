import { Controller, Get, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma.service';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
    constructor(
        private readonly appointmentsService: AppointmentsService,
        private readonly prisma: PrismaService
    ) { }

    @Post()
    async create(@Request() req, @Body() body: any) {
        const userId = req.user.id;

        // Handle single or multiple services
        const serviceIds = body.serviceIds || (body.serviceId ? [body.serviceId] : []);
        if (serviceIds.length === 0) throw new BadRequestException('At least one Service ID is required');

        // Verify first service to get location and create client
        const firstService = await this.prisma.service.findUnique({ where: { id: serviceIds[0] } });
        if (!firstService) throw new BadRequestException('Invalid Service');

        let client = await this.prisma.client.findFirst({
            where: {
                email: req.user.email,
                locationId: firstService.locationId
            }
        });

        if (!client) {
            client = await this.prisma.client.create({
                data: {
                    name: req.user.name || 'Unknown',
                    email: req.user.email,
                    locationId: firstService.locationId
                }
            });
        }

        return this.appointmentsService.create(client.id, { ...body, serviceIds });
    }

    @Get()
    findAll(@Request() req) {
        return this.appointmentsService.findAllForUser(req.user.id, req.user.role, req.user.email);
    }
}
