export type DemoRuleWhen = 'always' | 'seeded-target' | 'demo-email' | 'primary-student';

export interface DemoRule {
  controller: string;
  handler: string;
  when: DemoRuleWhen;
}

/**
 * Matched on the controller class and method, never on the URL, so a rewritten
 * path such as /API/ADMIN/SYSTEM/PURGE/ cannot slip past.
 */
export const DEMO_RULES: DemoRule[] = [
  { controller: 'AdminSystemController', handler: 'purge', when: 'always' },
  { controller: 'AuthenticationController', handler: 'registerStudent', when: 'always' },
  { controller: 'AuthenticationController', handler: 'forgotPassword', when: 'always' },
  { controller: 'AuthenticationController', handler: 'resetPassword', when: 'always' },
  { controller: 'UsersController', handler: 'deleteUser', when: 'always' },
  { controller: 'UsersController', handler: 'updateUser', when: 'always' },
  { controller: 'UsersController', handler: 'changePassword', when: 'always' },
  { controller: 'UsersController', handler: 'updateProfilePicture', when: 'always' },
  { controller: 'PaymentController', handler: 'delete', when: 'always' },
  { controller: 'SettingsController', handler: 'update', when: 'always' },
  { controller: 'BusTrackingController', handler: 'updateLocation', when: 'always' },
  { controller: 'BusTrackingController', handler: 'stopTracking', when: 'always' },

  { controller: 'UsersController', handler: 'updateProfile', when: 'demo-email' },
  { controller: 'UsersController', handler: 'updateDriverProfile', when: 'demo-email' },
  { controller: 'UsersController', handler: 'updateMovementManagerProfile', when: 'demo-email' },
  { controller: 'UsersController', handler: 'updateAdminProfile', when: 'demo-email' },
  { controller: 'UsersController', handler: 'updateStudentProfile', when: 'demo-email' },

  { controller: 'BusesController', handler: 'delete', when: 'seeded-target' },
  { controller: 'TripsController', handler: 'delete', when: 'seeded-target' },
  { controller: 'RoutesController', handler: 'delete', when: 'seeded-target' },
  { controller: 'TripRoutesController', handler: 'delete', when: 'seeded-target' },
  { controller: 'TripBookingController', handler: 'delete', when: 'seeded-target' },
  { controller: 'TripBookingController', handler: 'cancel', when: 'seeded-target' },
  { controller: 'BookingsController', handler: 'delete', when: 'seeded-target' },
  { controller: 'AttendanceController', handler: 'delete', when: 'seeded-target' },
  { controller: 'NotificationsController', handler: 'delete', when: 'seeded-target' },
  { controller: 'NotificationsController', handler: 'adminDelete', when: 'seeded-target' },
  { controller: 'SubscriptionPlanController', handler: 'delete', when: 'seeded-target' },
  { controller: 'DepartmentController', handler: 'delete', when: 'seeded-target' },
  { controller: 'PreferredAreaController', handler: 'delete', when: 'seeded-target' },
  { controller: 'YearOfStudyController', handler: 'delete', when: 'seeded-target' },
  { controller: 'VotingController', handler: 'deleteSurvey', when: 'seeded-target' },
  { controller: 'StudentSubscriptionController', handler: 'activate', when: 'seeded-target' },
  { controller: 'StudentSubscriptionController', handler: 'suspend', when: 'seeded-target' },
  { controller: 'StudentSubscriptionController', handler: 'resetForStudent', when: 'seeded-target' },

  { controller: 'PaymentController', handler: 'create', when: 'primary-student' },
];

export function findDemoRule(controller: string, handler: string): DemoRule | undefined {
  return DEMO_RULES.find((rule) => rule.controller === controller && rule.handler === handler);
}
