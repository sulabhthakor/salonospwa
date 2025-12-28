import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Enable CORS
    app.enableCors();
    await app.listen(3001, '0.0.0.0');
    console.log(`Backend is running on: ${await app.getUrl()}`);
}
bootstrap();
