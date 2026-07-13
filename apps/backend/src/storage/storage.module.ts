import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { json } from 'express';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { FileService } from './services/file.service';
import { S3StorageService } from './services/s3-storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [StorageController],
  providers: [S3StorageService, FileService],
  exports: [FileService, S3StorageService],
})
export class StorageModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(json({ limit: '1mb' }))
      .forRoutes({ path: 'storage/*path', method: RequestMethod.ALL });
  }
}
