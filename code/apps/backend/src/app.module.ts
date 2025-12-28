import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { ServicesModule } from './services/services.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ClientsModule } from './clients/clients.module';
import { AdminModule } from './admin/admin.module';

@Module({
    imports: [
        PrismaModule,
        UsersModule,
        AuthModule,
        BusinessModule,
        ServicesModule,
        AppointmentsModule,
        ClientsModule,
        AdminModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
