import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }

  /**
   * Enable TimescaleDB hypertable for inventory_snapshots
   */
  async enableTimescaleDB() {
    await this.$executeRaw`
      SELECT create_hypertable(
        'inventory_snapshots',
        'timestamp',
        if_not_exists => TRUE
      );
    `;
    console.log('✅ TimescaleDB hypertable created for inventory_snapshots');
  }
}
