import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

const ALL_ROLES = ['Admin', 'MovementManager', 'Conductor', 'Driver', 'Student'] as const;
const STAFF_WRITERS = ['Admin', 'MovementManager'] as const;

@Controller('api/Trip')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @Roles(...ALL_ROLES)
  async getAll() {
    return this.tripsService.getAll();
  }

  @Get('my-trips')
  @Roles('Driver', 'Conductor')
  async getMyTrips(@CurrentUser('numericId') userId: number) {
    return this.tripsService.getMyTrips(userId);
  }

  @Get('upcoming')
  @Roles(...STAFF_WRITERS)
  async getUpcoming() {
    return this.tripsService.getUpcoming();
  }

  @Get('completed')
  @Roles(...STAFF_WRITERS)
  async getCompleted() {
    return this.tripsService.getCompleted();
  }

  @Get('search')
  @Roles(...STAFF_WRITERS)
  async search(@Query('q') query: string) {
    return this.tripsService.search(query || '');
  }

  @Get('by-date/:date')
  @Roles(...STAFF_WRITERS)
  async getByDate(@Param('date') date: string) {
    return this.tripsService.getByDate(date);
  }

  @Get('by-driver/:driverId')
  @Roles(...STAFF_WRITERS)
  async getByDriver(@Param('driverId') driverId: string) {
    return this.tripsService.getByDriver(parseInt(driverId));
  }

  @Get('by-bus/:busId')
  @Roles(...STAFF_WRITERS)
  async getByBus(@Param('busId') busId: string) {
    return this.tripsService.getByBus(parseInt(busId));
  }

  @Get('status/:status')
  @Roles(...STAFF_WRITERS)
  async getByStatus(@Param('status') status: string) {
    return this.tripsService.getByStatus(status);
  }

  @Get(':id')
  @Roles(...ALL_ROLES)
  async getById(@Param('id') id: string) {
    return this.tripsService.getById(parseInt(id));
  }

  @Post()
  @Roles(...STAFF_WRITERS)
  async create(@Body() tripData: any) {
    return this.tripsService.create(tripData);
  }

  @Post('renew/:id')
  @Roles(...STAFF_WRITERS)
  @HttpCode(200)
  async renew(@Param('id') id: string) {
    return this.tripsService.renew(parseInt(id));
  }

  @Put(':id')
  @Roles(...STAFF_WRITERS)
  async update(@Param('id') id: string, @Body() tripData: any) {
    return this.tripsService.update(parseInt(id), tripData);
  }

  @Put(':id/status')
  @Roles(...STAFF_WRITERS)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.tripsService.updateStatus(parseInt(id), body.status);
  }

  @Put(':id/driver')
  @Roles(...STAFF_WRITERS)
  async assignDriver(@Param('id') id: string, @Body() body: { driverId: number }) {
    return this.tripsService.assignDriver(parseInt(id), body.driverId);
  }

  @Put(':id/bus')
  @Roles(...STAFF_WRITERS)
  async assignBus(@Param('id') id: string, @Body() body: { busId: number }) {
    return this.tripsService.assignBus(parseInt(id), body.busId);
  }

  @Put(':id/conductor')
  @Roles(...STAFF_WRITERS)
  async assignConductor(@Param('id') id: string, @Body() body: { conductorId: number }) {
    return this.tripsService.assignConductor(parseInt(id), body.conductorId);
  }

  @Delete(':id')
  @Roles(...STAFF_WRITERS)
  async delete(@Param('id') id: string) {
    return this.tripsService.delete(parseInt(id));
  }
}
