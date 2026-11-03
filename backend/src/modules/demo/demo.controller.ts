import { Controller, Get, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { User, UserDocument } from '../users/user.schema';
import { BusTrackingService } from '../bus-tracking/bus-tracking.service';
import { TripsService } from '../trips/trips.service';
import { DemoResetService } from './demo-reset.service';
import { DemoSimulatorService } from './demo-simulator.service';
import { RESET_INTERVAL_MS } from './demo-id.util';

@Controller('api/Demo')
export class DemoController {
  constructor(
    private readonly simulator: DemoSimulatorService,
    private readonly reset: DemoResetService,
    private readonly trips: TripsService,
    private readonly tracking: BusTrackingService,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('status')
  async status() {
    await this.housekeeping();
    return {
      demo: true,
      resetEveryHours: RESET_INTERVAL_MS / (60 * 60 * 1000),
      serverTime: new Date().toISOString(),
    };
  }

  @Public()
  @SkipThrottle()
  @Get('tick')
  async tick() {
    await this.housekeeping();
    await this.simulator.catchUp();
    return this.tracking.getAllLocations();
  }

  private async housekeeping(): Promise<void> {
    await Promise.allSettled([
      this.reset.resetIfDue(),
      this.trips.handleTripStatusCron(),
      this.simulator.rollLiveTrips(),
    ]);
  }

  @Post('tracking/start')
  @Roles('Driver')
  async start(@CurrentUser('userId') userId: string, @CurrentUser('numericId') numericId: number) {
    const user = await this.users.findById(userId).select('assignedBusId').lean();
    const busId = user?.assignedBusId;
    if (!busId) {
      throw new AppException(403, ErrorCodes.PERMISSION_DENIED, 'No bus is assigned to this driver.');
    }
    this.simulator.follow(busId, numericId);
    return { busId, tracking: true };
  }

  @Post('tracking/stop')
  @Roles('Driver')
  async stop() {
    await this.simulator.stop();
    return { tracking: false };
  }
}
