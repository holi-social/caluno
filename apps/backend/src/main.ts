// Import this first!
import './instrument';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();
  const onSignal = (signal: NodeJS.Signals) => {
    logger.log({ signal }, 'shutdown signal received');
  };
  process.once('SIGTERM', onSignal);
  process.once('SIGINT', onSignal);
  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
