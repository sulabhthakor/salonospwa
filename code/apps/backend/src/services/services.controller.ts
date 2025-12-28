import { Controller, Get, Post, Body, UseGuards, Request, Patch, Delete, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';

@Controller('services')
@UseGuards(AuthGuard('jwt'))
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    @Post()
    create(@Request() req, @Body() createServiceDto: any) {
        return this.servicesService.create(req.user.id, createServiceDto);
    }

    @Get()
    findAll(@Request() req) {
        return this.servicesService.findAll(req.user.id);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateServiceDto: any) {
        return this.servicesService.update(+id, req.user.id, updateServiceDto);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.servicesService.remove(+id, req.user.id);
    }
}
