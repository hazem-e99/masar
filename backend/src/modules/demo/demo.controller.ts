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
import { DemoSimulatorService } from './demo-simulator.service';
import { RESET_INTERVAL_MS } from './demo-id.util';

@Controller('api/Demo')
export class DemoController {
  constructor(
    private readonly simulator: DemoSimulatorService,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('status')
  status() {
    return {
      demo: true,
      resetEveryHours: RESET_INTERVAL_MS / (60 * 60 * 1000),
      serverTime: new Date().toISOString(),
    };
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
  stop() {
    this.simulator.stop();
    return { tracking: false };
  }
}
