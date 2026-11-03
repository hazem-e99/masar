import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { brand } from '../../config/brand';
import { getZonedParts } from '../voting/voting-time.util';
import { User, UserDocument } from '../users/user.schema';
import { Bus, BusDocument } from '../buses/bus.schema';
import { Trip, TripDocument } from '../trips/trip.schema';
import { TripBooking, TripBookingDocument } from '../trip-booking/trip-booking.schema';
import { Payment, PaymentDocument } from '../payment/payment.schema';
import { Notification, NotificationDocument } from '../notifications/notification.schema';
import { SubscriptionPlan, SubscriptionPlanDocument } from '../subscription-plan/subscription-plan.schema';
import { StudentSubscription, StudentSubscriptionDocument } from '../student-subscription/student-subscription.schema';
import { TripRoute, TripRouteDocument } from '../routes/route.schema';
import { Attendance, AttendanceDocument } from '../attendance/attendance.schema';
import { VotingSurvey, VotingSurveyDocument, VoteResponse, VoteResponseDocument } from '../voting/voting.schema';
import { BusLocation, BusLocationDocument } from '../bus-tracking/bus-location.schema';
import { Department, DepartmentDocument } from '../department/department.schema';
import { PreferredArea, PreferredAreaDocument } from '../preferred-area/preferred-area.schema';
import { YearOfStudy, YearOfStudyDocument } from '../year-of-study/year-of-study.schema';
import { Setting, SettingDocument } from '../settings/setting.schema';
import { demoObjectId } from './demo-id.util';
import { DEMO_PATHS } from './demo-routes.data';
import { DEMO_ACCOUNTS, DEMO_PASSWORD, IDS, SEEDED_NUMERIC_IDS } from './demo-seed.data';

const AREAS = ['North Station', 'East Station', 'West Station'];
const YEARS = ['FirstYear', 'SecondYear', 'ThirdYear', 'FourthYear'];

interface TripSpec {
  day: number;
  departure: string;
  arrival: string;
  status: 'Completed' | 'InProgress' | 'Scheduled';
  path: number;
}

const TRIP_SPECS: TripSpec[] = [
  { day: -3, departure: '07:30', arrival: '08:20', status: 'Completed', path: 0 },
  { day: -2, departure: '07:30', arrival: '08:20', status: 'Completed', path: 1 },
  { day: -2, departure: '14:00', arrival: '14:50', status: 'Completed', path: 2 },
  { day: -1, departure: '07:30', arrival: '08:20', status: 'Completed', path: 0 },
  { day: -1, departure: '13:00', arrival: '13:50', status: 'Completed', path: 1 },
  { day: -1, departure: '16:00', arrival: '16:50', status: 'Completed', path: 2 },
  { day: 0, departure: '06:00', arrival: '22:30', status: 'InProgress', path: 1 },
  { day: 0, departure: '06:30', arrival: '22:30', status: 'InProgress', path: 0 },
  { day: 0, departure: '07:00', arrival: '22:30', status: 'InProgress', path: 2 },
  { day: 0, departure: '15:00', arrival: '16:00', status: 'Scheduled', path: 0 },
  { day: 1, departure: '07:30', arrival: '08:20', status: 'Scheduled', path: 0 },
  { day: 1, departure: '13:00', arrival: '13:50', status: 'Scheduled', path: 1 },
  { day: 1, departure: '16:00', arrival: '16:50', status: 'Scheduled', path: 2 },
  { day: 2, departure: '07:30', arrival: '08:20', status: 'Scheduled', path: 1 },
  { day: 2, departure: '14:00', arrival: '14:50', status: 'Scheduled', path: 2 },
  { day: 3, departure: '07:30', arrival: '08:20', status: 'Scheduled', path: 0 },
  { day: 3, departure: '13:00', arrival: '13:50', status: 'Scheduled', path: 2 },
  { day: 4, departure: '07:30', arrival: '08:20', status: 'Scheduled', path: 1 },
];

@Injectable()
export class DemoSeedService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Bus.name) private readonly buses: Model<BusDocument>,
    @InjectModel(Trip.name) private readonly trips: Model<TripDocument>,
    @InjectModel(TripBooking.name) private readonly bookings: Model<TripBookingDocument>,
    @InjectModel(Payment.name) private readonly payments: Model<PaymentDocument>,
    @InjectModel(Notification.name) private readonly notifications: Model<NotificationDocument>,
    @InjectModel(SubscriptionPlan.name) private readonly plans: Model<SubscriptionPlanDocument>,
    @InjectModel(StudentSubscription.name) private readonly subscriptions: Model<StudentSubscriptionDocument>,
    @InjectModel(TripRoute.name) private readonly routes: Model<TripRouteDocument>,
    @InjectModel(Attendance.name) private readonly attendance: Model<AttendanceDocument>,
    @InjectModel(VotingSurvey.name) private readonly surveys: Model<VotingSurveyDocument>,
    @InjectModel(VoteResponse.name) private readonly votes: Model<VoteResponseDocument>,
    @InjectModel(BusLocation.name) private readonly locations: Model<BusLocationDocument>,
    @InjectModel(Department.name) private readonly departments: Model<DepartmentDocument>,
    @InjectModel(PreferredArea.name) private readonly areas: Model<PreferredAreaDocument>,
    @InjectModel(YearOfStudy.name) private readonly years: Model<YearOfStudyDocument>,
    @InjectModel(Setting.name) private readonly settings: Model<SettingDocument>,
  ) {}

  async reseed(): Promise<void> {
    const password = await bcrypt.hash(DEMO_PASSWORD, 10);
    const dateKey = (dayOffset: number) => {
      const shifted = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
      return getZonedParts(shifted).dateKey;
    };

    await Promise.all([
      this.buses.deleteMany({}),
      this.trips.deleteMany({}),
      this.bookings.deleteMany({}),
      this.payments.deleteMany({}),
      this.notifications.deleteMany({}),
      this.plans.deleteMany({}),
      this.subscriptions.deleteMany({}),
      this.routes.deleteMany({}),
      this.attendance.deleteMany({}),
      this.surveys.deleteMany({}),
      this.votes.deleteMany({}),
      this.locations.deleteMany({}),
      this.departments.deleteMany({}),
      this.areas.deleteMany({}),
      this.years.deleteMany({}),
      this.settings.deleteMany({}),
      this.users.deleteMany({ numericId: { $nin: [...SEEDED_NUMERIC_IDS] } }),
    ]);

    await Promise.all(
      DEMO_ACCOUNTS.map((account) =>
        this.users.updateOne(
          { _id: demoObjectId(account.id) },
          {
            $set: {
              firstName: account.firstName,
              lastName: account.lastName,
              email: account.email,
              password,
              role: account.role,
              phoneNumber: account.phoneNumber,
              nationalId: `200000000000${String(account.id).slice(-2)}`,
              status: 'Active',
              profilePictureUrl: account.avatar,
              isEmailVerified: true,
              resetAttempts: 0,
              numericId: account.id,
              department: account.department,
              preferredArea: account.preferredArea,
              yearOfStudy: account.yearOfStudy,
              studentAcademicNumber: account.role === 'Student' ? `S-${account.id}` : undefined,
              licenseNumber: account.licenseNumber,
              experience: account.role === 'Driver' ? 6 : undefined,
              assignedBusId: account.assignedBusId,
            },
          },
          { upsert: true },
        ),
      ),
    );

    const named = (id: number, extra: Record<string, unknown>): Record<string, unknown> => ({
      _id: demoObjectId(id),
      numericId: id,
      ...extra,
    });

    await this.departments.insertMany(
      brand.departments.map((name, index) => named(IDS.departments[index], { name, isActive: true })),
    );
    await this.areas.insertMany(AREAS.map((name, index) => named(IDS.areas[index], { name, isActive: true })));
    await this.years.insertMany(YEARS.map((name, index) => named(IDS.years[index], { name, isActive: true })));

    await this.routes.insertMany(
      DEMO_PATHS.map((path, index) =>
        named(IDS.routes[index], {
          name: path.name,
          startLocation: path.from,
          endLocation: path.to,
          distance: 12 + index * 3,
          estimatedTime: '50 min',
          stopLocations: [path.from, 'University Gate'],
        }),
      ),
    );

    await this.buses.insertMany(
      IDS.buses.map((id, index) =>
        named(id, {
          busNumber: `MAS-0${index + 1}`,
          speed: 0,
          capacity: 30,
          status: 'Active',
          fuelLevel: 80 - index * 10,
          location: {
            lat: DEMO_PATHS[index].points[0].latitude,
            lng: DEMO_PATHS[index].points[0].longitude,
          },
        }),
      ),
    );

    await this.plans.insertMany([
      named(IDS.plan, {
        name: 'Term pass',
        description: 'Fictional term pass for the demo',
        price: 1500,
        maxNumberOfRides: 40,
        durationInDays: 120,
        isActive: true,
      }),
    ]);

    const now = new Date();
    const inNinetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    await this.subscriptions.insertMany([
      named(IDS.subscriptions[0], {
        studentId: IDS.student,
        subscriptionPlanId: IDS.plan,
        startDate: now,
        endDate: inNinetyDays,
        isActive: true,
        status: 'Active',
        paymentMethod: 'Online',
        cancellationStatus: 'None',
      }),
      named(IDS.subscriptions[1], {
        studentId: IDS.student2,
        subscriptionPlanId: IDS.plan,
        startDate: now,
        endDate: inNinetyDays,
        isActive: false,
        status: 'PendingPayment',
        paymentMethod: 'Online',
        cancellationStatus: 'None',
      }),
      named(IDS.subscriptions[2], {
        studentId: IDS.student3,
        subscriptionPlanId: IDS.plan,
        startDate: now,
        endDate: inNinetyDays,
        isActive: true,
        status: 'Active',
        paymentMethod: 'Offline',
        cancellationStatus: 'Pending',
        cancellationReason: 'Moving to another area next term',
        cancellationRequestedAt: now,
      }),
    ]);

    await this.payments.insertMany([
      named(IDS.payments[0], {
        studentId: IDS.student,
        subscriptionPlanId: IDS.plan,
        amount: 1500,
        paymentMethod: 'Online',
        paymentChannel: 'instapay',
        paymentReferenceCode: 'DEMO-1001',
        status: 'Accepted',
        reviewedAt: now,
        adminReviewedById: IDS.admin,
      }),
      named(IDS.payments[1], {
        studentId: IDS.student2,
        subscriptionPlanId: IDS.plan,
        amount: 1500,
        paymentMethod: 'Online',
        paymentChannel: 'vodafone',
        paymentReferenceCode: 'DEMO-1002',
        status: 'Pending',
      }),
      named(IDS.payments[2], {
        studentId: IDS.student3,
        subscriptionPlanId: IDS.plan,
        amount: 1500,
        paymentMethod: 'Offline',
        paymentChannel: 'cash',
        status: 'Accepted',
        reviewedAt: now,
        adminReviewedById: IDS.admin,
      }),
    ]);

    const tripDocs = TRIP_SPECS.map((spec, index) => {
      const path = DEMO_PATHS[spec.path];
      return named(IDS.trips[index], {
        busId: IDS.buses[spec.path],
        driverId: IDS.driver,
        conductorId: IDS.conductor,
        startLocation: path.from,
        endLocation: path.to,
        tripDate: dateKey(spec.day),
        departureTimeOnly: spec.departure,
        arrivalTimeOnly: spec.arrival,
        status: spec.status,
        stopLocations: [
          { address: path.from, arrivalTimeOnly: spec.departure, departureTimeOnly: spec.departure },
          { address: path.to, arrivalTimeOnly: spec.arrival, departureTimeOnly: spec.arrival },
        ],
        bookedSeats: 0,
      });
    });

    const bookingPlan = [
      { id: IDS.bookings[0], tripIndex: 10, studentId: IDS.student, subscriptionId: IDS.subscriptions[0] },
      { id: IDS.bookings[1], tripIndex: 11, studentId: IDS.student, subscriptionId: IDS.subscriptions[0] },
      { id: IDS.bookings[2], tripIndex: 3, studentId: IDS.student, subscriptionId: IDS.subscriptions[0] },
      { id: IDS.bookings[3], tripIndex: 4, studentId: IDS.student2, subscriptionId: IDS.subscriptions[1] },
      { id: IDS.bookings[4], tripIndex: 12, studentId: IDS.student2, subscriptionId: IDS.subscriptions[1] },
      { id: IDS.bookings[5], tripIndex: 5, studentId: IDS.student3, subscriptionId: IDS.subscriptions[2] },
    ];
    for (const booking of bookingPlan) {
      const trip = tripDocs[booking.tripIndex];
      trip.bookedSeats = Number(trip.bookedSeats) + 1;
    }
    await this.trips.insertMany(tripDocs);
    await this.bookings.insertMany(
      bookingPlan.map((booking) =>
        named(booking.id, {
          tripId: IDS.trips[booking.tripIndex],
          studentId: booking.studentId,
          pickupStopLocationId: 1,
          userSubscriptionId: booking.subscriptionId,
          status: 'Confirmed',
          bookingDate: now,
        }),
      ),
    );

    await this.attendance.insertMany([
      named(IDS.attendance[0], { tripId: IDS.trips[3], studentId: IDS.student, status: 'Present', markedAt: now }),
      named(IDS.attendance[1], { tripId: IDS.trips[4], studentId: IDS.student2, status: 'Absent', markedAt: now, notes: 'Demo absence' }),
      named(IDS.attendance[2], { tripId: IDS.trips[5], studentId: IDS.student3, status: 'Present', markedAt: now }),
      named(IDS.attendance[3], { tripId: IDS.trips[2], studentId: IDS.student, status: 'Late', markedAt: now }),
    ]);

    const surveyTitles = [
      'Morning departure time',
      'Bus comfort this week',
      'Preferred pickup area',
      'Friday service',
    ];
    await this.surveys.insertMany(
      IDS.surveys.map((id, index) =>
        named(id, {
          title: surveyTitles[index],
          description: 'Fictional survey so several visitors can vote without sharing one ballot.',
          createdByUserId: IDS.admin,
          createdByName: 'Nadia Farouk',
          questions: [
            {
              questionText: 'How was the last ride?',
              questionType: 'rating',
              options: ['1', '2', '3', '4', '5'],
              isRequired: true,
            },
          ],
          isRecurringDaily: true,
          dailyOpenTime: '00:00',
          dailyCloseTime: '23:59',
          windowSemantics: 'open',
          eligiblePlanIds: [],
          isActive: true,
          startDate: dateKey(-1),
          endDate: dateKey(30),
        }),
      ),
    );

    const notes = [
      ['Welcome', 'This is a fictional demo. It resets every 6 hours.'],
      ['Your bus', 'Start tracking to move MAS-02 along the east line.'],
      ['Today', 'Three lines are on the road. Attendance is ready for the completed trips.'],
      ['Fleet', 'Buses, routes, and trips can be edited. Seeded records cannot be deleted.'],
      ['Your pass', 'The term pass on this account is fictional.'],
      ['Payment waiting', 'An admin still needs to review your demo payment.'],
      ['Cancellation', 'Your cancellation request is waiting for an admin.'],
    ] as const;
    await this.notifications.insertMany(
      DEMO_ACCOUNTS.map((account, index) =>
        named(IDS.notifications[index], {
          userId: account.id,
          title: notes[index][0],
          message: notes[index][1],
          type: 'Announcement',
          sentAt: now,
          isRead: false,
          isDeleted: false,
        }),
      ),
    );

    await this.locations.insertMany(
      IDS.buses.map((busId, index) => ({
        busId,
        latitude: DEMO_PATHS[index].points[0].latitude,
        longitude: DEMO_PATHS[index].points[0].longitude,
        speed: 0,
        driverId: String(IDS.driver),
        isTracking: busId !== IDS.buses[1],
        timestamp: now,
      })),
    );

    await this.settings.insertMany([
      {
        systemName: brand.nameEn,
        logo: '/logo.png',
        primaryColor: '#0f766e',
        secondaryColor: '#d97706',
        maintenanceMode: false,
      },
    ]);
  }
}
