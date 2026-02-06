import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SeedService } from './database/seed/seed.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  const seedService = app.get(SeedService);
  await seedService.run();

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors();

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Validation pipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global interceptor - transform responses to snake_case
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Automotores API')
    .setDescription('API for vehicle management')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
