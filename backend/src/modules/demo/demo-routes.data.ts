export interface DemoPath {
  name: string;
  from: string;
  to: string;
  /** Points the simulator walks, in order, then back. */
  points: Array<{ latitude: number; longitude: number }>;
}

/** Fictional Cairo paths. The middle bus is reserved for the driver account. */
export const DEMO_PATHS: DemoPath[] = [
  {
    name: 'North line',
    from: 'North Station',
    to: 'University Gate',
    points: [
      { latitude: 30.091, longitude: 31.326 },
      { latitude: 30.078, longitude: 31.318 },
      { latitude: 30.064, longitude: 31.305 },
      { latitude: 30.052, longitude: 31.288 },
      { latitude: 30.044, longitude: 31.270 },
    ],
  },
  {
    name: 'East line',
    from: 'East Station',
    to: 'University Gate',
    points: [
      { latitude: 30.060, longitude: 31.360 },
      { latitude: 30.055, longitude: 31.340 },
      { latitude: 30.050, longitude: 31.318 },
      { latitude: 30.046, longitude: 31.295 },
      { latitude: 30.044, longitude: 31.270 },
    ],
  },
  {
    name: 'West line',
    from: 'West Station',
    to: 'University Gate',
    points: [
      { latitude: 30.070, longitude: 31.200 },
      { latitude: 30.062, longitude: 31.220 },
      { latitude: 30.054, longitude: 31.240 },
      { latitude: 30.048, longitude: 31.255 },
      { latitude: 30.044, longitude: 31.270 },
    ],
  },
];

export const DRIVER_PATH_INDEX = 1;
