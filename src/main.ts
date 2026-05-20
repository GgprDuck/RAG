import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './rag/shared/nest/filters/all-exeption.filter';
import helmet from 'helmet';
import { randomUUID } from 'crypto';

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

  const server = app.getHttpServer();

  server.setTimeout(30_000);
  server.keepAliveTimeout = 15_000;
  server.headersTimeout = 20_000;

  app.use((req: any, res: any, next: () => void) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', requestId);
    req.requestId = requestId;
    next();
  });

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

  app.getHttpAdapter().get('/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok' });
  });

  await app.listen(3000);
  Logger.log('RAG demo running on http://localhost:3000', 'Bootstrap');
  Logger.log('Swagger UI: http://localhost:3000/api', 'Bootstrap');
}

bootstrap();