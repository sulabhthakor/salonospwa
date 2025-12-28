
import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { BusinessStatus } from '@prisma/client';

// TODO: Add Role Guard here later
@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    @Get('salons')
    async getSalons() {
        return this.adminService.getSalons();
    }

    @Patch('salons/:id/status')
    async updateSalonStatus(
        @Param('id') id: string,
        @Body('status') status: BusinessStatus
    ) {
        return this.adminService.updateSalonStatus(id, status);
    }

    @Get('users')
    async getUsers() {
        return this.adminService.getUsers();
    }
}
