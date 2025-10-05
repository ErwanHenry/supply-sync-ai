import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SyncModule } from './modules/sync/sync.module';
import { ERPModule } from './modules/erp/erp.module';
import { AnomalyModule } from './modules/anomaly/anomaly.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { QueueModule } from './common/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    InventoryModule,
    SyncModule,
    ERPModule,
    AnomalyModule,
  ],
})
export class AppModule {}
