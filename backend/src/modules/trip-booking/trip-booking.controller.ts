import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, HttpCode } from '@nestjs/common';
import { TripBookingService } from './trip-booking.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/TripBooking')
export class TripBookingController {
  constructor(private readonly bookingService: TripBookingService) {}

  @Post()
  @Roles('Admin', 'Student')
  async create(@Body() dto: any, @CurrentUser() user: any) {
    return this.bookingService.create(dto, user);
  }

  @Post('search')
  @Roles('Admin', 'MovementManager')
  @HttpCode(200)
  async search(@Body() searchDto: any) {
    return this.bookingService.search(searchDto);
  }

  @Get('by-trip/:tripId')
  @Roles('Admin', 'MovementManager', 'Conductor')
  async getByTrip(@Param('tripId') tripId: string) {
    return this.bookingService.getByTrip(parseInt(tripId));
  }

  @Get('by-student/:studentId')
  @Roles('Admin', 'MovementManager', 'Student')
  async getByStudent(@Param('studentId') studentId: string, @CurrentUser() user: any) {
    return this.bookingService.getByStudent(parseInt(studentId), user);
  }

  @Get('by-date/:date')
  @Roles('Admin', 'MovementManager')
  async getByDate(@Param('date') date: string) {
    return this.bookingService.getByDate(date);
  }

  @Get('check-eligibility')
  @Roles('Admin', 'Student')
  async checkEligibility(
    @Query('tripId') tripId: string,
    @Query('studentId') studentId: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingService.checkEligibility(parseInt(tripId), parseInt(studentId), user);
  }

  @Get('has-booked/:tripId')
  @Roles('Admin', 'Student')
  async hasBooked(
    @Param('tripId') tripId: string,
    @CurrentUser('numericId') userId: number,
  ) {
    return this.bookingService.hasBooked(parseInt(tripId), userId);
  }

  @Get(':id')
  @Roles('Admin', 'Student')
  async getById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingService.getById(parseInt(id), user);
  }

  @Put('update-trip-pickup/:id')
  @Roles('Admin')
  async updatePickupLocation(@Param('id') id: string, @Body() dto: any) {
    return this.bookingService.updatePickupLocation(parseInt(id), dto);
  }

  @Patch(':bookId/cancel')
  @Roles('Admin')
  async cancel(@Param('bookId') bookId: string) {
    return this.bookingService.cancel(parseInt(bookId));
  }

  @Delete(':id')
  @Roles('Admin')
  async delete(@Param('id') id: string) {
    return this.bookingService.delete(parseInt(id));
  }
}
