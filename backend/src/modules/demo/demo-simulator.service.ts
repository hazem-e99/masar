import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { BusTrackingGateway } from '../bus-tracking/bus-tracking.gateway';
import { BusTrackingService } from '../bus-tracking/bus-tracking.service';
import { Trip, TripDocument } from '../trips/trip.schema';
import { getZonedParts } from '../voting/voting-time.util';
import { DEMO_PATHS, DRIVER_PATH_INDEX } from './demo-routes.data';
import { IDS } from './demo-seed.data';

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
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.tick();
    }, 5000);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  follow(busId: number, driverNumericId: number): void {
    this.driverBusId = busId;
    this.driverNumericId = driverNumericId;
  }

  stop(): void {
    this.driverBusId = null;
    this.driverNumericId = null;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async rollLiveTrips(): Promise<void> {
    const today = getZonedParts(new Date()).dateKey;
    await this.trips.updateMany(
      { numericId: { $in: IDS.trips }, status: 'InProgress', tripDate: { $ne: today } },
      { $set: { tripDate: today } },
    );
  }

  private async tick(): Promise<void> {
    if (!this.socketsOpen()) return;
    this.step += 1;
    try {
      await Promise.all(
        IDS.buses.map((busId, index) => {
          const driverBus = busId === this.driverBusId;
          if (index === DRIVER_PATH_INDEX && !driverBus) return Promise.resolve();
          if (driverBus && this.driverNumericId === null) return Promise.resolve();
          return this.move(busId, index, driverBus ? this.driverNumericId! : IDS.driver);
        }),
      );
    } catch (error) {
      this.logger.warn(`Demo bus move failed: ${error instanceof Error ? error.message : error}`);
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
    this.gateway.emitLocationUpdate({
      busId,
      latitude: point.latitude,
      longitude: point.longitude,
      speed: 8,
      driverId,
      timestamp: new Date().toISOString(),
    });
  }

  private socketsOpen(): boolean {
    const server = this.gateway.server as { engine?: { clientsCount?: number } } | undefined;
    return (server?.engine?.clientsCount ?? 0) > 0;
  }
}
