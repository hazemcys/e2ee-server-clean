import { Module } from '@nestjs/common';
import { DatabaseEncryptionService } from './encryption.service.js';

@Module({
  providers: [DatabaseEncryptionService],
  exports: [DatabaseEncryptionService],
})
export class DatabaseModule {}
