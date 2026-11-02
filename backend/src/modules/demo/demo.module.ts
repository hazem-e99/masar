import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';
import { Bus, BusSchema } from '../buses/bus.schema';
import { Trip, TripSchema } from '../trips/trip.schema';
import { TripBooking, TripBookingSchema } from '../trip-booking/trip-booking.schema';
import { Payment, PaymentSchema } from '../payment/payment.schema';
import { Notification, NotificationSchema } from '../notifications/notification.schema';
import { SubscriptionPlan, SubscriptionPlanSchema } from '../subscription-plan/subscription-plan.schema';
import { StudentSubscription, StudentSubscriptionSchema } from '../student-subscription/student-subscription.schema';
import { TripRoute, TripRouteSchema } from '../routes/route.schema';
import { Attendance, AttendanceSchema } from '../attendance/attendance.schema';
import { VotingSurvey, VotingSurveySchema, VoteResponse, VoteResponseSchema } from '../voting/voting.schema';
import { BusLocation, BusLocationSchema } from '../bus-tracking/bus-location.schema';
import { Department, DepartmentSchema } from '../department/department.schema';
import { PreferredArea, PreferredAreaSchema } from '../preferred-area/preferred-area.schema';
import { YearOfStudy, YearOfStudySchema } from '../year-of-study/year-of-study.schema';
import { Setting, SettingSchema } from '../settings/setting.schema';
import { BusTrackingModule } from '../bus-tracking/bus-tracking.module';
import { DemoController } from './demo.controller';
import { DemoPolicyInterceptor } from './demo-policy.interceptor';
import { DemoResetService } from './demo-reset.service';
import { DemoSeedService } from './demo-seed.service';
import { DemoSimulatorService } from './demo-simulator.service';

@Module({
  imports: [
    BusTrackingModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Bus.name, schema: BusSchema },
      { name: Trip.name, schema: TripSchema },
      { name: TripBooking.name, schema: TripBookingSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: SubscriptionPlan.name, schema: SubscriptionPlanSchema },
      { name: StudentSubscription.name, schema: StudentSubscriptionSchema },
      { name: TripRoute.name, schema: TripRouteSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: VotingSurvey.name, schema: VotingSurveySchema },
      { name: VoteResponse.name, schema: VoteResponseSchema },
      { name: BusLocation.name, schema: BusLocationSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: PreferredArea.name, schema: PreferredAreaSchema },
      { name: YearOfStudy.name, schema: YearOfStudySchema },
      { name: Setting.name, schema: SettingSchema },
    ]),
  ],
  controllers: [DemoController],
  providers: [
    DemoSeedService,
    DemoResetService,
    DemoSimulatorService,
    { provide: APP_INTERCEPTOR, useClass: DemoPolicyInterceptor },
  ],
})
export class DemoModule {}
