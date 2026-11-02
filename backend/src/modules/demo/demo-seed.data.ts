import { brand } from '../../config/brand';

export const DEMO_PASSWORD = 'Masar-demo-1';
export const DEMO_EMAIL_DOMAIN = '@demo.example.com';
export const PRIMARY_STUDENT_EMAIL = `student${DEMO_EMAIL_DOMAIN}`;

export const IDS = {
  admin: 99001,
  driver: 99002,
  conductor: 99003,
  manager: 99004,
  student: 99005,
  student2: 99006,
  student3: 99007,
  buses: [99101, 99102, 99103],
  routes: [99111, 99112, 99113],
  departments: brand.departments.map((_, index) => 99121 + index),
  areas: [99131, 99132, 99133],
  years: [99141, 99142, 99143, 99144],
  plan: 99151,
  subscriptions: [99161, 99162, 99163],
  payments: [99171, 99172, 99173],
  trips: Array.from({ length: 18 }, (_, index) => 99201 + index),
  bookings: [99301, 99302, 99303, 99304, 99305, 99306],
  attendance: [99401, 99402, 99403, 99404],
  surveys: [99501, 99502, 99503, 99504],
  notifications: [99601, 99602, 99603, 99604, 99605, 99606, 99607],
} as const;

export const SEEDED_NUMERIC_IDS: ReadonlySet<number> = new Set(
  Object.values(IDS).flatMap((value) => (typeof value === 'number' ? [value] : [...value])),
);

export const DRIVER_BUS_ID = IDS.buses[1];

export interface DemoAccount {
  id: number;
  email: string;
  role: 'Admin' | 'Student' | 'Driver' | 'Conductor' | 'MovementManager';
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar: string;
  department?: string;
  preferredArea?: string;
  yearOfStudy?: string;
  assignedBusId?: number;
  licenseNumber?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: IDS.admin,
    email: `admin${DEMO_EMAIL_DOMAIN}`,
    role: 'Admin',
    firstName: 'Nadia',
    lastName: 'Farouk',
    phoneNumber: '01010000001',
    avatar: '/avatars/avatar-admin.png',
  },
  {
    id: IDS.driver,
    email: `driver${DEMO_EMAIL_DOMAIN}`,
    role: 'Driver',
    firstName: 'Youssef',
    lastName: 'Adel',
    phoneNumber: '01010000002',
    avatar: '/avatars/avatar-driver.png',
    assignedBusId: DRIVER_BUS_ID,
    licenseNumber: 'DEMO-DRV-1002',
  },
  {
    id: IDS.conductor,
    email: `conductor${DEMO_EMAIL_DOMAIN}`,
    role: 'Conductor',
    firstName: 'Mariam',
    lastName: 'Samir',
    phoneNumber: '01010000003',
    avatar: '/avatars/avatar-conductor.png',
  },
  {
    id: IDS.manager,
    email: `manager${DEMO_EMAIL_DOMAIN}`,
    role: 'MovementManager',
    firstName: 'Karim',
    lastName: 'Nabil',
    phoneNumber: '01010000004',
    avatar: '/avatars/avatar-admin.png',
  },
  {
    id: IDS.student,
    email: PRIMARY_STUDENT_EMAIL,
    role: 'Student',
    firstName: 'Lina',
    lastName: 'Hassan',
    phoneNumber: '01010000005',
    avatar: '/avatars/avatar-student.png',
    department: brand.departments[0],
    preferredArea: 'North Station',
    yearOfStudy: 'FirstYear',
  },
  {
    id: IDS.student2,
    email: `student2${DEMO_EMAIL_DOMAIN}`,
    role: 'Student',
    firstName: 'Omar',
    lastName: 'Tarek',
    phoneNumber: '01010000006',
    avatar: '/avatars/avatar-student.png',
    department: brand.departments[1],
    preferredArea: 'East Station',
    yearOfStudy: 'SecondYear',
  },
  {
    id: IDS.student3,
    email: `student3${DEMO_EMAIL_DOMAIN}`,
    role: 'Student',
    firstName: 'Hana',
    lastName: 'Sherif',
    phoneNumber: '01010000007',
    avatar: '/avatars/avatar-student.png',
    department: brand.departments[2],
    preferredArea: 'West Station',
    yearOfStudy: 'ThirdYear',
  },
];
