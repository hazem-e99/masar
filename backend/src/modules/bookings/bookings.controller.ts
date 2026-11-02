import { BadRequestException, Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TripBooking, TripBookingDocument } from '../trip-booking/trip-booking.schema';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { pick } from '../../common/utils/pick';

const BOOKING_STATUSES = ['Confirmed', 'Cancelled', 'NoShow', 'Completed'];

@Controller('api/Bookings')
export class BookingsController {
  constructor(
    @InjectModel(TripBooking.name) private bookingModel: Model<TripBookingDocument>,
  ) {}

  private getNumericId(doc: any): number {
    return parseInt((doc._id as any).toString().slice(-8), 16) % 100000;
  }

  @Get()
  @Roles('Admin', 'MovementManager', 'Conductor', 'Student')
  async getAll(
    @Query('studentId') studentId: string | undefined,
    @Query('tripId') tripId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const filter: any = {};
    if (String(user?.role || '').toLowerCase() === 'student') {
      filter.studentId = Number(user.numericId);
    } else if (studentId) {
      filter.studentId = parseInt(studentId);
    }
    if (tripId) filter.tripId = parseInt(tripId);
    const bookings = await this.bookingModel.find(filter).exec();
    return bookings.map((b) => ({
      id: this.getNumericId(b),
      tripId: b.tripId,
      studentId: b.studentId,
      pickupStopLocationId: b.pickupStopLocationId,
      status: b.status,
      bookingDate: b.bookingDate,
    }));
  }

  @Get(':id')
  @Roles('Admin', 'MovementManager', 'Conductor')
  async getById(@Param('id') id: string) {
    const numId = parseInt(id);
    return this.bookingModel.findOne({ numericId: numId }).exec();
  }

  @Post()
  @Roles('Admin')
  async create(@Body() dto: any) {
    const fields = pick(dto, ['tripId', 'studentId', 'pickupStopLocationId', 'userSubscriptionId', 'status', 'bookingDate']);
    const booking = await this.bookingModel.create(fields);
    return { id: this.getNumericId(booking), ...fields };
  }

  @Patch(':id')
  @Roles('Admin', 'Conductor')
  async update(@Param('id') id: string, @Body() dto: any) {
    const numId = parseInt(id);
    const status = pick(dto, ['status']).status;
    if (!BOOKING_STATUSES.includes(String(status))) {
      throw new BadRequestException('Status must be Confirmed, Cancelled, NoShow, or Completed.');
    }
    const booking = await this.bookingModel.findOneAndUpdate(
      { numericId: numId },
      { $set: { status } },
      { new: true }
    ).exec();
    if (!booking) return { success: false, message: 'Not found' };
    return { success: true };
  }

  @Delete(':id')
  @Roles('Admin')
  async delete(@Param('id') id: string) {
    const numId = parseInt(id);
    const booking = await this.bookingModel.findOneAndDelete({ numericId: numId }).exec();
    if (!booking) return { success: false, message: 'Not found' };
    return { success: true };
  }
}
