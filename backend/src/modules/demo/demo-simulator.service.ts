import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Connection, Model } from 'mongoose';
import { BusTrackingGateway } from '../bus-tracking/bus-tracking.gateway';
import { BusTrackingService } from '../bus-tracking/bus-tracking.service';
import { Trip, TripDocument } from '../trips/trip.schema';
import { getZonedParts } from '../voting/voting-time.util';
import { DEMO_PATHS, DRIVER_PATH_INDEX } from './demo-routes.data';
import { IDS } from './demo-seed.data';

const TICK_MS = 5000;

@Injectable()
export class DemoSimulatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DemoSimulatorService.name);
  private timer: NodeJS.Timeout | null = null;
  private step = 0;
  private driverBusId: number | null = null;
  private driverNumericId: number | null = null;

  constructor(
    private readonly tracking: BusTrackingService,
    private readonly gateway: BusTrackingGateway,
    @InjectModel(Trip.name) private readonly trips: Model<TripDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.catchUp(true);
    }, TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async follow(busId: number, driverNumericId: number): Promise<void> {
    this.driverBusId = busId;
    this.driverNumericId = driverNumericId;
    await this.meta().updateOne(
      { _id: 'simulator' as never },
      { $set: { driverBusId: busId, driverNumericId } },
      { upsert: true },
    );
  }

  async stop(): Promise<void> {
    this.driverBusId = null;
    this.driverNumericId = null;
    await this.meta().updateOne(
      { _id: 'simulator' as never },
      { $set: { driverBusId: null, driverNumericId: null } },
      { upsert: true },
    );
  }

  /**
   * Move the buses one step when 5 seconds have passed.
   * The step is stored in Mongo so a new Vercel instance continues the route.
   * Pass true to stay still unless this instance has a tracking socket.
   */
  async catchUp(requireViewer = false): Promise<void> {
    if (requireViewer && !this.socketsOpen()) return;
    const claimed = await this.claimStep();
    if (!claimed) return;
    this.step = claimed.step;
    this.driverBusId = claimed.driverBusId;
    this.driverNumericId = claimed.driverNumericId;
    try {
      await Promise.all(
        IDS.buses.map((busId, index) => {
          const driverBus = busId === this.driverBusId;
          if (index === DRIVER_PATH_INDEX && !driverBus) return Promise.resolve();
          const driverNumericId = driverBus ? this.driverNumericId : IDS.driver;
          if (driverNumericId === null) return Promise.resolve();
          return this.move(busId, index, driverNumericId);
        }),
      );
    } catch (error) {
      this.logger.warn(`Demo bus move failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async rollLiveTrips(): Promise<void> {
    const today = getZonedParts(new Date()).dateKey;
    await this.trips.updateMany(
      { numericId: { $in: IDS.trips }, status: 'InProgress', tripDate: { $ne: today } },
      { $set: { tripDate: today } },
    );
  }

  private meta() {
    return this.connection.collection('demo_meta');
  }

  private async claimStep(): Promise<{ step: number; driverBusId: number | null; driverNumericId: number | null } | null> {
    const cutoff = new Date(Date.now() - TICK_MS);
    try {
      const doc = await this.meta().findOneAndUpdate(
        {
          _id: 'simulator' as never,
          $or: [{ lastTickAt: { $lte: cutoff } }, { lastTickAt: { $exists: false } }],
        },
        { $set: { lastTickAt: new Date() }, $inc: { step: 1 } },
        { upsert: true, returnDocument: 'after' },
      );
      const row = doc as { step?: number; driverBusId?: number | null; driverNumericId?: number | null } | null;
      if (!row) return null;
      return {
        step: Number(row.step ?? 1),
        driverBusId: row.driverBusId ?? null,
        driverNumericId: row.driverNumericId ?? null,
      };
    } catch (error) {
      const code = (error as { code?: number })?.code;
      if (code === 11000) return null;
      throw error;
    }
  }

  private async move(busId: number, pathIndex: number, driverNumericId: number): Promise<void> {
    const path = DEMO_PATHS[pathIndex];
    const point = path.points[this.step % path.points.length];
    const driverId = String(driverNumericId);
    await this.tracking.updateLocation(
      { busId, latitude: point.latitude, longitude: point.longitude, speed: 8 },
      driverId,
    );
    try {
      this.gateway.emitLocationUpdate({
        busId,
        latitude: point.latitude,
        longitude: point.longitude,
        speed: 8,
        driverId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // This instance may have no socket. The map also reads the saved location.
    }
  }

  private socketsOpen(): boolean {
    const server = this.gateway.server as { engine?: { clientsCount?: number } } | undefined;
    return (server?.engine?.clientsCount ?? 0) > 0;
  }
}
