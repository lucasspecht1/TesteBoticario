import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './env';
import { configureApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.listen(env.PORT);
}
void bootstrap();
