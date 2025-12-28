import { Controller, Get, Post, Body, UseGuards, Request, Patch, Delete, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Request() req, @Body() createServiceDto: CreateServiceDto) {
        return this.servicesService.create(req.user.id, createServiceDto);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    findAll(@Request() req) {
        return this.servicesService.findAll(req.user.id);
    }

    @Get('public')
    findAllPublic() {
        return this.servicesService.findAllPublic();
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    update(@Request() req, @Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
        return this.servicesService.update(+id, req.user.id, updateServiceDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    remove(@Request() req, @Param('id') id: string) {
        return this.servicesService.remove(+id, req.user.id);
    }
}
