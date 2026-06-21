import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Bootstrap: helmet, CORS, versionado de API, pipes globales.
 * Fuente: BackendArchitecture.md §2.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } } }));

  app.enableCors({
    origin: configService.get<boolean>('app.isProduction')
      ? ['https://calinutri.app'] // Solo dominios propios en producción — sin wildcard.
      : true,
    credentials: true,
  });

  // Versionado de API por prefijo URI: /v1/... (API.md "Base URL: https://api.calinutri.app/v1")
  const globalPrefix = configService.get<string>('app.globalPrefix') as string;
  app.setGlobalPrefix(globalPrefix, { exclude: ['health'] });

  app.enableShutdownHooks();

  const port = configService.get<number>('app.port') as number;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 CALI-NUTRI AI API corriendo en :${port}/${globalPrefix}`);
}

bootstrap();
