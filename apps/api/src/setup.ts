import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

/** Configuração compartilhada entre main.ts e os testes e2e. */
export function configureApp(app: INestApplication): void {
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API — Wi-Fi de visitantes')
    .setDescription('Ingestão de conexões e métricas do painel da loja.')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'ingest')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
}
