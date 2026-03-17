import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './rag/shared/nest/filters/all-exeption.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

  if (process.env.NODE_ENV === 'production' && allowedOrigins.length === 0) {
    throw new Error(
      'ALLOWED_ORIGINS must be set in production environment. ' +
        'Example: ALLOWED_ORIGINS=https://your-frontend.com,https://staging.your-frontend.com',
    );
  }

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development'
        ? true
        : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RAG Demo API')
      .setDescription('Demo API for Retrieval-Augmented Generation')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(3000);
  console.log('RAG demo running on http://localhost:3000');
  console.log('Swagger UI: http://localhost:3000/api');
}

bootstrap();