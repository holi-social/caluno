// Import this first!
import './instrument';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
