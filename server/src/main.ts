import 'reflect-metadata';
import {ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Ensure PrismaService.onModuleDestroy ($disconnect) runs on SIGINT/restart
  // so --watch reloads don't leak DB connections (Neon connection-limit safety).
  app.enableShutdownHooks();

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({whitelist: true, transform: true, forbidNonWhitelisted: false}),
  );

  const origins = (config.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  app.enableCors({origin: origins.length ? origins : true, credentials: true});

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`RealReels API running on http://localhost:${port}/api`);
}

bootstrap();
