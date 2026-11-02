import { ForbiddenException } from '@nestjs/common';
import { METHOD_METADATA, MODULE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AUTHENTICATED_KEY } from '../decorators/authenticated.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

const A = ['Admin'] as const;
const M = ['MovementManager'] as const;
const D = ['Driver'] as const;
const S = ['Student'] as const;
const AM = ['Admin', 'MovementManager'] as const;
const AMC = ['Admin', 'MovementManager', 'Conductor'] as const;
const AMDC = ['Admin', 'MovementManager', 'Driver', 'Conductor'] as const;
const AMD = ['Admin', 'MovementManager', 'Driver'] as const;
const ALL = ['Admin', 'MovementManager', 'Conductor', 'Driver', 'Student'] as const;
const AS = ['Admin', 'Student'] as const;
const DC = ['Driver', 'Conductor'] as const;
const AC = ['Admin', 'Conductor'] as const;
const AMCS = ['Admin', 'MovementManager', 'Conductor', 'Student'] as const;
const AMS = ['Admin', 'MovementManager', 'Student'] as const;

type Rule = 'public' | 'auth' | readonly string[];
type Ctor = new (...args: never[]) => object;

const ROLES = ['Admin', 'MovementManager', 'Conductor', 'Driver', 'Student'] as const;

function catalog(controller: string, methods: Record<string, Rule>): Record<string, Rule> {
  return Object.fromEntries(Object.entries(methods).map(([method, rule]) => [`${controller}.${method}`, rule]));
}

/** The role map. A route missing from this table fails the spec. */
const EXPECTED: Record<string, Rule> = {
  ...catalog('AuthenticationController', {
    login: 'public',
    registerStudent: 'public',
    registerStaff: A,
    verifyEmail: 'public',
    forgotPassword: 'public',
    resetPassword: 'public',
  }),
  ...catalog('UsersController', {
    getAll: AMC,
    getProfile: 'auth',
    getByRole: AMC,
    getStudentsData: A,
    getStudentDataById: A,
    getStudentsOverview: A,
    getById: AMC,
    changePassword: 'auth',
    updateProfile: 'auth',
    updateDriverProfile: D,
    updateMovementManagerProfile: M,
    updateAdminProfile: A,
    updateStudentProfile: S,
    updateProfilePicture: 'auth',
    deleteUser: A,
    updateUser: A,
  }),
  ...catalog('BusesController', {
    getAll: AMDC,
    create: AM,
    getById: AMC,
    update: AM,
    delete: AM,
  }),
  ...catalog('TripsController', {
    getAll: ALL,
    getMyTrips: DC,
    getUpcoming: AM,
    getCompleted: AM,
    search: AM,
    getByDate: AM,
    getByDriver: AM,
    getByBus: AM,
    getByStatus: AM,
    getById: ALL,
    create: AM,
    renew: AM,
    update: AM,
    updateStatus: AM,
    assignDriver: AM,
    assignBus: AM,
    assignConductor: AM,
    delete: AM,
  }),
  ...catalog('TripBookingController', {
    create: AS,
    search: AM,
    getByTrip: AMC,
    getByStudent: AMS,
    getByDate: AM,
    checkEligibility: AS,
    hasBooked: AS,
    getById: AS,
    updatePickupLocation: A,
    cancel: A,
    delete: A,
  }),
  ...catalog('BookingsController', {
    getAll: AMCS,
    getById: AMC,
    create: A,
    update: AC,
    delete: A,
  }),
  ...catalog('RoutesController', {
    getAll: AMDC,
    getById: AMDC,
    create: AM,
    update: AM,
    delete: AM,
  }),
  ...catalog('TripRoutesController', {
    getAll: AM,
    getById: AM,
    create: AM,
    update: AM,
    delete: AM,
  }),
  ...catalog('SubscriptionPlanController', {
    getAll: AS,
    getActive: AS,
    getByPriceRange: AS,
    getByDuration: AS,
    getById: AS,
    create: A,
    update: A,
    activate: A,
    deactivate: A,
    delete: A,
  }),
  ...catalog('AttendanceController', {
    getAll: AMC,
    getById: AMC,
    create: AC,
    update: AC,
    delete: A,
  }),
  ...catalog('NotificationsController', {
    getAll: 'auth',
    getUnread: 'auth',
    getUnreadCount: 'auth',
    adminGetAll: A,
    getById: 'auth',
    create: AMC,
    broadcast: AMC,
    markAsRead: 'auth',
    markAllAsRead: 'auth',
    clearAll: 'auth',
    adminDelete: A,
    delete: 'auth',
  }),
  ...catalog('SettingsController', {
    get: 'auth',
    getMaintenanceMode: 'public',
    update: A,
  }),
  ...catalog('StudentDashboardController', {
    getStats: AS,
    getRecentTrips: AS,
    getUpcomingTrips: AS,
    getPayments: AS,
  }),
  ...catalog('PaymentController', {
    getAll: A,
    getMyPayments: S,
    getPending: A,
    getStatistics: A,
    getSubscriptionReport: A,
    getByStatus: A,
    getByStudent: A,
    getBySubscriptionPlan: A,
    getById: A,
    create: S,
    review: A,
    delete: A,
  }),
  ...catalog('StudentSubscriptionController', {
    getMyActiveSubscription: S,
    getMySubscriptions: S,
    getAll: A,
    getCancellationRequests: A,
    getExpiringSoon: A,
    getExpired: A,
    getByStudent: A,
    getByPlan: A,
    getByStatus: A,
    getById: A,
    requestCancellation: S,
    reviewCancellation: A,
    activate: A,
    suspend: A,
    resetForStudent: A,
  }),
  ...catalog('VotingController', {
    getAllSurveys: A,
    getActiveSurveys: AS,
    getStudentOverview: S,
    getSurveyById: AS,
    getSurveyResults: A,
    getSurveyResponsesByDate: A,
    hasVotedToday: S,
    createSurvey: A,
    updateSurvey: A,
    toggleActive: A,
    deleteSurvey: A,
    submitVote: S,
  }),
  ...catalog('BusTrackingController', {
    updateLocation: D,
    getLocation: AMD,
    getAllLocations: AM,
    getAllLocationsIncludingInactive: A,
    stopTracking: D,
  }),
  ...catalog('AdminSystemController', { purge: A }),
  ...catalog('DepartmentController', {
    getActive: 'public',
    getAll: A,
    getById: A,
    create: A,
    update: A,
    activate: A,
    deactivate: A,
    delete: A,
  }),
  ...catalog('PreferredAreaController', {
    getActive: 'public',
    getAll: A,
    getById: A,
    create: A,
    update: A,
    activate: A,
    deactivate: A,
    delete: A,
  }),
  ...catalog('YearOfStudyController', {
    getActive: 'public',
    getAll: A,
    getById: A,
    create: A,
    update: A,
    activate: A,
    deactivate: A,
    delete: A,
  }),
  ...catalog('FormsController', { get: 'public' }),
};

interface RouteRef {
  key: string;
  controller: Ctor;
  handler: Function;
}

function collectControllers(entry: unknown, seen: Set<Ctor>, controllers: Set<Ctor>) {
  if (!entry) return;
  if (typeof entry === 'function') {
    const moduleClass = entry as Ctor;
    if (seen.has(moduleClass)) return;
    seen.add(moduleClass);
    const imports: unknown[] = Reflect.getMetadata(MODULE_METADATA.IMPORTS, moduleClass) ?? [];
    for (const imported of imports) collectControllers(imported, seen, controllers);
    const own: Ctor[] = Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, moduleClass) ?? [];
    for (const controller of own) controllers.add(controller);
    return;
  }
  if (typeof entry !== 'object') return;
  const record = entry as { forwardRef?: () => unknown; module?: unknown; controllers?: Ctor[]; imports?: unknown[] };
  if (typeof record.forwardRef === 'function') {
    collectControllers(record.forwardRef(), seen, controllers);
    return;
  }
  if (record.module) collectControllers(record.module, seen, controllers);
  for (const controller of record.controllers ?? []) controllers.add(controller);
  for (const imported of record.imports ?? []) collectControllers(imported, seen, controllers);
}

function discoverRoutes(): RouteRef[] {
  const controllers = new Set<Ctor>();
  collectControllers(AppModule, new Set(), controllers);
  const routes: RouteRef[] = [];
  for (const controller of controllers) {
    const proto = controller.prototype as Record<string, unknown>;
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor') continue;
      const handler = proto[name];
      if (typeof handler !== 'function') continue;
      if (Reflect.getMetadata(METHOD_METADATA, handler) === undefined) continue;
      routes.push({ key: `${controller.name}.${name}`, controller, handler });
    }
  }
  return routes.sort((a, b) => a.key.localeCompare(b.key));
}

function hasAccessRule(route: RouteRef): boolean {
  const reflector = new Reflector();
  const targets: [Function, Ctor] = [route.handler, route.controller];
  return Boolean(
    reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets) ||
      reflector.getAllAndOverride<string[]>(ROLES_KEY, targets) ||
      reflector.getAllAndOverride<boolean>(AUTHENTICATED_KEY, targets),
  );
}

function allows(rule: Rule, role: string | null): boolean {
  if (rule === 'public') return true;
  if (!role) return false;
  if (rule === 'auth') return true;
  return rule.some((allowed) => allowed.toLowerCase() === role.toLowerCase());
}

function canActivate(route: RouteRef, role: string | null): boolean {
  const guard = new RolesGuard(new Reflector());
  const context = {
    getHandler: () => route.handler,
    getClass: () => route.controller,
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role, numericId: 1 } : undefined }) }),
  };
  try {
    return guard.canActivate(context as never);
  } catch (error) {
    if (error instanceof ForbiddenException) return false;
    throw error;
  }
}

describe('route authorization', () => {
  const routes = discoverRoutes();

  it('finds the application controllers without starting the server', () => {
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.some((route) => route.key === 'AuthenticationController.login')).toBe(true);
  });

  it('fails when any route has no access rule', () => {
    const missing = routes.filter((route) => !hasAccessRule(route)).map((route) => route.key);
    expect(missing).toEqual([]);
  });

  it('covers every discovered route in the role map, and no extra entries', () => {
    const discovered = routes.map((route) => route.key);
    const expected = Object.keys(EXPECTED).sort((a, b) => a.localeCompare(b));
    expect(discovered).toEqual(expected);
  });

  it('allows each role only on its routes and denies everyone else', () => {
    const failures: string[] = [];
    for (const route of routes) {
      const rule = EXPECTED[route.key];
      const visitors: Array<string | null> = [null, ...ROLES];
      for (const role of visitors) {
        const actual = canActivate(route, role);
        const wanted = allows(rule, role);
        if (actual !== wanted) {
          failures.push(`${route.key} as ${role ?? 'anonymous'}: expected ${wanted}, got ${actual}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it('treats role names case-insensitively', () => {
    const purge = routes.find((route) => route.key === 'AdminSystemController.purge');
    expect(purge).toBeDefined();
    expect(canActivate(purge!, 'admin')).toBe(true);
    expect(canActivate(purge!, 'ADMIN')).toBe(true);
  });

  it('lets a public route through with no user', () => {
    const login = routes.find((route) => route.key === 'AuthenticationController.login');
    expect(canActivate(login!, null)).toBe(true);
  });

  it('denies a signed-out caller on an authenticated route', () => {
    const profile = routes.find((route) => route.key === 'UsersController.getProfile');
    expect(canActivate(profile!, null)).toBe(false);
    expect(canActivate(profile!, 'Driver')).toBe(true);
  });

  it('denies a handler with no access rule unless AUTHZ_LOG_ONLY is set', () => {
    class BareController {
      open() {
        return 'open';
      }
    }
    const route: RouteRef = {
      key: 'BareController.open',
      controller: BareController,
      handler: BareController.prototype.open,
    };
    const previous = process.env.AUTHZ_LOG_ONLY;
    try {
      delete process.env.AUTHZ_LOG_ONLY;
      expect(canActivate(route, 'Admin')).toBe(false);

      process.env.AUTHZ_LOG_ONLY = '1';
      expect(canActivate(route, null)).toBe(true);

      process.env.AUTHZ_LOG_ONLY = 'true';
      expect(canActivate(route, 'Student')).toBe(true);

      process.env.AUTHZ_LOG_ONLY = 'yes';
      expect(canActivate(route, 'Admin')).toBe(false);

      delete process.env.AUTHZ_LOG_ONLY;
      const guard = new RolesGuard(new Reflector(), { get: () => '1' } as never);
      const context = {
        getHandler: () => route.handler,
        getClass: () => route.controller,
        switchToHttp: () => ({ getRequest: () => ({ user: undefined }) }),
      };
      expect(guard.canActivate(context as never)).toBe(true);
    } finally {
      if (previous === undefined) delete process.env.AUTHZ_LOG_ONLY;
      else process.env.AUTHZ_LOG_ONLY = previous;
    }
  });
});
