import { Controller, Get, Post, Put, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from './business.service';

@Controller('business')
export class BusinessController {
    constructor(private readonly businessService: BusinessService) { }

    @Get()
    findAll() {
        return this.businessService.findAllApproved();
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    create(@Request() req, @Body() createBusinessDto: any) {
        // DTO validation skipped for brevity
        return this.businessService.create(req.user.id, createBusinessDto);
    }

    @Get('mine')
    @UseGuards(AuthGuard('jwt'))
    findMine(@Request() req) {
        return this.businessService.findOneByOwner(req.user.id);
    }

    @Put('mine')
    @UseGuards(AuthGuard('jwt'))
    update(@Request() req, @Body() updateBusinessDto: any) {
        return this.businessService.update(req.user.id, updateBusinessDto);
    }
}
