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
        // Find or Create the 'Client' entity for this User to link to the Appointment
        // Since our schema separates Auth User from CRM Client.
        // MVP Strategy: Check if a Client exists with this User's email. If not, create one linked to the target Location? 
        // Wait, Client is linked to a Location.
        // When booking, the user picks a Service -> Service has Location.
        // So we create the Client record at that Location.

        if (!body.serviceId) throw new BadRequestException('Service ID required');

        const service = await this.prisma.service.findUnique({ where: { id: body.serviceId } });
        if (!service) throw new BadRequestException('Invalid Service');

        let client = await this.prisma.client.findFirst({
            where: {
                email: req.user.email,
                locationId: service.locationId
            }
        });

        if (!client) {
            client = await this.prisma.client.create({
                data: {
                    name: req.user.name || 'Unknown',
                    email: req.user.email,
                    locationId: service.locationId
                }
            });
        }

        return this.appointmentsService.create(client.id, body);
    }

    @Get()
    findAll(@Request() req) {
        return this.appointmentsService.findAllForUser(req.user.id, req.user.role);
    }
}
