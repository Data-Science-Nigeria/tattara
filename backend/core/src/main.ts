import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SeedService } from './database/seeds/seed.service';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  TypeOrmExceptionFilter,
  GlobalExceptionFilter,
} from './common/exceptions';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new TypeOrmExceptionFilter(),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port')!;

  // Run database seeds in development
  if (process.env.NODE_ENV === 'development') {
    const seedService = app.get(SeedService);
    await seedService.runSeeds();
  }

  const config = new DocumentBuilder()
    .setTitle('Tattara DSN AI Data Collection App API')
    .setDescription(
      `### 📋 Overview  
Backend API for the Tattara DSN AI Data Collection App.

### 🚀 Features  
- 🔐 JWT Authentication with RBAC (Roles & Permissions) 
- 👥 User & Program Management
- ⚙️ Workflow Configuration  
- 🤖 AI-assisted Data Collection (🎤 Voice, 👁️ OCR) with ✅ User Confirmation
- 📦 Dual Integration: 🏢 DHIS2 and 🗃️ Generic Database  
- 📡 Offline Sync & 📊 Comprehensive Audit Logging

### Response format
All responses are wrapped in this format:

\`\`\`json
{
  "success": true,
  "timestamp": "2025-09-29T12:34:56.000Z",
  "data": { ...actual response here... }
}
\`\`\`

### 💡 Notes  
- 🔄 All endpoints are versioned under \`/v1\`  
- 🛡️ Use \`Authorization: Bearer <token>\` for secured routes`,
    )
    .setVersion('1.0')
    .setExternalDoc('API Specification', '/api-json')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory, {
    jsonDocumentUrl: '/api-json',
  });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}

bootstrap().catch(error => {
  console.error('Error starting application:', error);
  process.exit(1);
});
