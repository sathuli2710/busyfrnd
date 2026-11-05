import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  app.use(
    helmet({
      // the hosted checkout page loads the Cashfree SDK from their CDN
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  app.setGlobalPrefix('api', { exclude: [{ path: 'pay/{*splat}', method: RequestMethod.ALL }] });
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on :${port}`);
}
bootstrap();
