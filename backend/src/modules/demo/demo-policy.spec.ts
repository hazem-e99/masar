import { AdminSystemController } from '../admin-system/admin-system.controller';
import { AttendanceController } from '../attendance/attendance.controller';
import { AuthenticationController } from '../authentication/authentication.controller';
import { BookingsController } from '../bookings/bookings.controller';
import { BusTrackingController } from '../bus-tracking/bus-tracking.controller';
import { BusesController } from '../buses/buses.controller';
import { DepartmentController } from '../department/department.controller';
import { NotificationsController } from '../notifications/notifications.controller';
import { PaymentController } from '../payment/payment.controller';
import { PreferredAreaController } from '../preferred-area/preferred-area.controller';
import { RoutesController } from '../routes/routes.controller';
import { SettingsController } from '../settings/settings.controller';
import { StudentSubscriptionController } from '../student-subscription/student-subscription.controller';
import { SubscriptionPlanController } from '../subscription-plan/subscription-plan.controller';
import { TripBookingController } from '../trip-booking/trip-booking.controller';
import { TripRoutesController } from '../trip-routes/trip-routes.controller';
import { TripsController } from '../trips/trips.controller';
import { UsersController } from '../users/users.controller';
import { VotingController } from '../voting/voting.controller';
import { YearOfStudyController } from '../year-of-study/year-of-study.controller';
import { DemoController } from './demo.controller';
import { demoObjectId } from './demo-id.util';
import { DEMO_RULES } from './demo-policy';
import { IDS, SEEDED_NUMERIC_IDS } from './demo-seed.data';
import { isSeededIdentifier } from './demo-id.util';

const CONTROLLERS: Record<string, { prototype: object }> = {
  AdminSystemController,
  AttendanceController,
  AuthenticationController,
  BookingsController,
  BusTrackingController,
  BusesController,
  DepartmentController,
  NotificationsController,
  PaymentController,
  PreferredAreaController,
  RoutesController,
  SettingsController,
  StudentSubscriptionController,
  SubscriptionPlanController,
  TripBookingController,
  TripRoutesController,
  TripsController,
  UsersController,
  VotingController,
  YearOfStudyController,
  DemoController,
};

describe('demo policy', () => {
  it('fails when a rule names a method that is not on the controller', () => {
    const missing = DEMO_RULES.filter((rule) => {
      const controller = CONTROLLERS[rule.controller];
      return !controller || typeof (controller.prototype as Record<string, unknown>)[rule.handler] !== 'function';
    }).map((rule) => `${rule.controller}.${rule.handler}`);
    expect(missing).toEqual([]);
  });

  it('keeps the public status route and the driver tracking routes', () => {
    expect(typeof DemoController.prototype.status).toBe('function');
    expect(typeof DemoController.prototype.start).toBe('function');
    expect(typeof DemoController.prototype.stop).toBe('function');
  });

  it('builds object ids whose numericId stays inside the demo range', () => {
    for (const id of [IDS.admin, IDS.student, IDS.trips[0], IDS.surveys[3]]) {
      const objectId = demoObjectId(id);
      const derived = parseInt(objectId.toString().slice(-8), 16) % 100000;
      expect(derived).toBe(id);
      expect(isSeededIdentifier(objectId.toString(), SEEDED_NUMERIC_IDS)).toBe(true);
      expect(isSeededIdentifier(String(id), SEEDED_NUMERIC_IDS)).toBe(true);
    }
    expect(isSeededIdentifier('42', SEEDED_NUMERIC_IDS)).toBe(false);
    expect(isSeededIdentifier('64a0de00aabbccddeeff0011', SEEDED_NUMERIC_IDS)).toBe(false);
  });
});
