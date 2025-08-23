import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BlobsModule } from './blobs/blobs.module.js';
import { AdminModule } from './admin/admin.module.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, BlobsModule, AdminModule, DatabaseModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
