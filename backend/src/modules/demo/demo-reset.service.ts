import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Connection } from 'mongoose';
import { DEMO_DB_NAME, RESET_INTERVAL_MS } from './demo-id.util';
import { DemoSeedService } from './demo-seed.service';

@Injectable()
export class DemoResetService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoResetService.name);
  private running = false;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly seed: DemoSeedService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.resetIfDue();
    } catch (error) {
      this.logger.error('Demo reset failed during boot. The server will still start.', error instanceof Error ? error.stack : error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async hourly(): Promise<void> {
    try {
      await this.resetIfDue();
    } catch (error) {
      this.logger.error('Hourly demo reset failed.', error instanceof Error ? error.stack : error);
    }
  }

  async resetIfDue(): Promise<boolean> {
    if (this.running) return false;
    if (!(await this.confirmDatabase())) return false;
    const claimed = await this.claim();
    if (!claimed.won) return false;
    this.running = true;
    try {
      await this.seed.reseed();
      this.logger.log('Demo data reseeded.');
      return true;
    } catch (error) {
      await this.connection.collection('demo_meta').updateOne(
        { _id: 'sentinel' as never },
        { $set: { lastResetAt: claimed.previous ?? new Date(0) } },
      );
      throw error;
    } finally {
      this.running = false;
    }
  }

  private async confirmDatabase(): Promise<boolean> {
    const name = this.connection.db?.databaseName;
    if (name !== DEMO_DB_NAME) {
      this.logger.error(`Refusing demo reset: database is "${name ?? 'unknown'}", expected ${DEMO_DB_NAME}. Nothing was written.`);
      return false;
    }
    const users = this.connection.collection('users');
    const userCount = await users.countDocuments();
    const sentinel = await this.connection.collection('demo_meta').findOne({ _id: 'sentinel' as never });
    if (userCount > 0 && !sentinel) {
      this.logger.error('Refusing demo reset: users already exist and there is no demo sentinel. Nothing was written.');
      return false;
    }
    return true;
  }

  /** One process wins the reset. A recent claim means the data is still fresh. */
  private async claim(): Promise<{ won: boolean; previous?: Date }> {
    const meta = this.connection.collection('demo_meta');
    const cutoff = new Date(Date.now() - RESET_INTERVAL_MS);
    try {
      const previous = await meta.findOneAndUpdate(
        {
          _id: 'sentinel' as never,
          $or: [{ lastResetAt: { $lte: cutoff } }, { lastResetAt: { $exists: false } }],
        },
        { $set: { lastResetAt: new Date(), databaseName: DEMO_DB_NAME } },
        { upsert: true, returnDocument: 'before' },
      );
      const lastResetAt = (previous as { lastResetAt?: Date } | null)?.lastResetAt;
      return { won: true, previous: lastResetAt };
    } catch (error) {
      const code = (error as { code?: number })?.code;
      if (code === 11000) return { won: false };
      throw error;
    }
  }
}
