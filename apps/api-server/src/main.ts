import { AppModule } from '@/app.module';
import { NestFactory } from '@nestjs/core';
import { SentryService } from '@ntegral/nestjs-sentry';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(SentryService.SentryServiceInstance());
  await app.listen(parseInt(process.env.PORT || '3000'));
}
bootstrap();
