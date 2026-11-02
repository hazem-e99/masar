import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TripBooking, TripBookingDocument } from './trip-booking.schema';
import { Trip, TripDocument } from '../trips/trip.schema';
import { User, UserDocument } from '../users/user.schema';
import { Bus, BusDocument } from '../buses/bus.schema';
import { createApiResponse, ApiResponse } from '../../common/interfaces/api-response.interface';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCodes } from '../../common/exceptions/error-codes';
import { pick } from '../../common/utils/pick';

const BOOKING_FIELDS = ['tripId', 'studentId', 'pickupStopLocationId', 'userSubscriptionId'] as const;

@Injectable()
export class TripBookingService {
  constructor(
    @InjectModel(TripBooking.name) private bookingModel: Model<TripBookingDocument>,
    @InjectModel(Trip.name) private tripModel: Model<TripDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Bus.name) private busModel: Model<BusDocument>,
  ) {}

  private getNumericId(doc: any): number {
    return parseInt((doc._id as any).toString().slice(-8), 16) % 100000;
  }

  private async toViewModel(booking: TripBookingDocument): Promise<any> {
    const id = this.getNumericId(booking);
    const student = await this.findEntityByNumericId(this.userModel, booking.studentId);
    const trip = await this.findEntityByNumericId(this.tripModel, booking.tripId);

    return {
      id,
      tripId: booking.tripId,
      studentId: booking.studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : null,
      studentEmail: student?.email || null,
      pickupStopLocationId: booking.pickupStopLocationId,
      pickupStopName: null,
      userSubscriptionId: booking.userSubscriptionId,
      status: booking.status,
      bookingDate: booking.bookingDate?.toISOString() || null,
      cancellationDate: booking.cancellationDate?.toISOString() || null,
      tripDate: trip?.tripDate || null,
      departureTime: trip?.departureTimeOnly || null,
      arrivalTime: trip?.arrivalTimeOnly || null,
    };
  }

  private async findEntityByNumericId(model: Model<any>, numericId: number): Promise<any> {
    return model.findOne({ numericId }).exec();
  }

  async create(dto: any, actor?: { role?: string; numericId?: number }): Promise<ApiResponse<boolean>> {
    const fields = pick(dto, BOOKING_FIELDS);
    const studentId = this.isStudent(actor) ? Number(actor?.numericId) : Number(fields.studentId);
    const tripId = Number(fields.tripId);
    const trip = await this.findEntityByNumericId(this.tripModel, tripId);
    if (!trip) {
      throw new NotFoundException('The selected trip could not be found.');
    }

    const duplicate = await this.bookingModel.findOne({
      tripId,
      studentId,
      status: { $ne: 'Cancelled' },
    }).exec();
    if (duplicate) {
      throw new AppException(409, ErrorCodes.DUPLICATE_RESOURCE, 'You already have a booking for this trip.');
    }

    const bus = await this.findEntityByNumericId(this.busModel, trip.busId);
    const capacity = Number(bus?.capacity || 0);
    const reserved = capacity > 0
      ? await this.tripModel.findOneAndUpdate(
          { _id: trip._id, bookedSeats: { $lt: capacity } },
          { $inc: { bookedSeats: 1 } },
          { new: true },
        ).exec()
      : null;
    if (!reserved) {
      throw new AppException(409, ErrorCodes.CONFLICT, 'This trip is full.');
    }

    try {
      await this.bookingModel.create({
        tripId,
        studentId,
        pickupStopLocationId: Number(fields.pickupStopLocationId),
        userSubscriptionId: Number(fields.userSubscriptionId ?? 0),
        status: 'Confirmed',
      });
    } catch (error) {
      await this.releaseSeat(trip._id);
      throw error;
    }
    return createApiResponse(true, 'Booking created successfully');
  }

  async getById(id: number, actor?: { role?: string; numericId?: number }): Promise<ApiResponse<any>> {
    const booking = await this.findByNumericId(id);
    if (!booking) throw new NotFoundException('Booking not found');
    this.assertOwnStudent(actor, booking.studentId);
    const vm = await this.toViewModel(booking);
    return createApiResponse(vm);
  }

  async delete(id: number): Promise<ApiResponse<boolean>> {
    const booking = await this.findByNumericId(id);
    if (!booking) throw new NotFoundException('Booking not found');
    await this.bookingModel.findByIdAndDelete(booking._id);
    return createApiResponse(true, 'Booking deleted');
  }

  async cancel(bookId: number): Promise<ApiResponse<boolean>> {
    const booking = await this.findByNumericId(bookId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'Cancelled') {
      return createApiResponse(true, 'Booking cancelled');
    }
    await this.bookingModel.findByIdAndUpdate(booking._id, {
      status: 'Cancelled',
      cancellationDate: new Date(),
    });
    const trip = await this.findEntityByNumericId(this.tripModel, booking.tripId);
    if (trip) await this.releaseSeat(trip._id);
    return createApiResponse(true, 'Booking cancelled');
  }

  async updatePickupLocation(id: number, dto: any): Promise<ApiResponse<boolean>> {
    const booking = await this.findByNumericId(id);
    if (!booking) throw new NotFoundException('Booking not found');
    const fields = pick(dto, ['pickupStopLocationId']);
    await this.bookingModel.findByIdAndUpdate(booking._id, {
      pickupStopLocationId: fields.pickupStopLocationId,
    });
    return createApiResponse(true, 'Pickup location updated');
  }

  async search(searchDto: any): Promise<ApiResponse<any[]>> {
    const query: any = {};
    if (searchDto.tripId) query.tripId = searchDto.tripId;
    if (searchDto.studentId) query.studentId = searchDto.studentId;
    if (searchDto.status) query.status = searchDto.status;
    if (searchDto.tripDate) {
      const trip = await this.tripModel.find({ tripDate: searchDto.tripDate }).exec();
      const tripIds = trip.map((t) => this.getNumericId(t));
      query.tripId = { $in: tripIds };
    }

    const bookings = await this.bookingModel.find(query).exec();
    const viewModels = await Promise.all(bookings.map((b) => this.toViewModel(b)));
    return createApiResponse(viewModels, null, true, viewModels.length);
  }

  async getByTrip(tripId: number): Promise<ApiResponse<any[]>> {
    const bookings = await this.bookingModel.find({ tripId }).exec();
    const viewModels = await Promise.all(bookings.map((b) => this.toViewModel(b)));
    return createApiResponse(viewModels, null, true, viewModels.length);
  }

  async getByStudent(studentId: number, actor?: { role?: string; numericId?: number }): Promise<ApiResponse<any[]>> {
    this.assertOwnStudent(actor, studentId);
    const bookings = await this.bookingModel.find({ studentId }).exec();
    const viewModels = await Promise.all(bookings.map((b) => this.toViewModel(b)));
    return createApiResponse(viewModels, null, true, viewModels.length);
  }

  async getByDate(date: string): Promise<ApiResponse<any[]>> {
    const trips = await this.tripModel.find({ tripDate: date }).exec();
    const tripIds = trips.map((t) => this.getNumericId(t));
    const bookings = await this.bookingModel.find({ tripId: { $in: tripIds } }).exec();
    const viewModels = await Promise.all(bookings.map((b) => this.toViewModel(b)));
    return createApiResponse(viewModels, null, true, viewModels.length);
  }

  async checkEligibility(tripId: number, studentId: number, actor?: { role?: string; numericId?: number }): Promise<ApiResponse<boolean>> {
    this.assertOwnStudent(actor, studentId);
    const existing = await this.bookingModel.findOne({
      tripId,
      studentId,
      status: { $ne: 'Cancelled' },
    }).exec();
    return createApiResponse(!existing, existing ? 'Already booked' : 'Eligible');
  }

  async hasBooked(tripId: number, userId: number): Promise<ApiResponse<boolean>> {
    const existing = await this.bookingModel.findOne({
      tripId,
      studentId: userId,
      status: { $ne: 'Cancelled' },
    }).exec();
    return createApiResponse(!!existing);
  }

  private async releaseSeat(tripObjectId: unknown): Promise<void> {
    await this.tripModel.findOneAndUpdate(
      { _id: tripObjectId, bookedSeats: { $gt: 0 } },
      { $inc: { bookedSeats: -1 } },
    ).exec();
  }

  private isStudent(actor?: { role?: string }): boolean {
    return String(actor?.role || '').trim().toLowerCase() === 'student';
  }

  private assertOwnStudent(actor: { role?: string; numericId?: number } | undefined, studentId: number) {
    if (this.isStudent(actor) && Number(actor?.numericId) !== Number(studentId)) {
      throw new ForbiddenException('You can only access your own bookings');
    }
  }

  private async findByNumericId(numericId: number): Promise<TripBookingDocument | null> {
    return this.bookingModel.findOne({ numericId }).exec();
  }
}
