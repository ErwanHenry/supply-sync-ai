import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('SupplySync AI API')
    .setDescription('B2B Inventory Truth Engine - Real-time ERP synchronization with AI-powered anomaly detection')
    .setVersion('1.0.0')
    .setContact(
      'SupplySync Team',
      'https://supplysync.ai',
      'support@supplysync.ai'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('inventory', 'Inventory management operations')
    .addTag('sync', 'ERP synchronization endpoints')
    .addTag('erp', 'ERP connector management')
    .addTag('anomaly', 'Anomaly detection and alerts')
    .addTag('webhooks', 'ERP webhook handlers')
    .addTag('health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3001', 'Development')
    .addServer('https://api.supplysync.ai', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SupplySync AI API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║        SupplySync AI Backend Server              ║
  ║        Running on http://localhost:${port}         ║
  ║        API Docs: http://localhost:${port}/api/docs ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
}

bootstrap();
