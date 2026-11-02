import { Types } from 'mongoose';

/** The only database name a demo reset is allowed to write to. */
export const DEMO_DB_NAME = 'masar_demo';

export const SEEDED_ID_MIN = 99000;
export const SEEDED_ID_MAX = 99999;
export const RESET_INTERVAL_MS = 6 * 60 * 60 * 1000;

const ID_PREFIX = 'de30c0de00000000';

/** Fixed ObjectId whose derived numericId is the given value. */
export function demoObjectId(numericId: number): Types.ObjectId {
  if (!isSeededNumericId(numericId)) {
    throw new Error(`Demo id ${numericId} is outside ${SEEDED_ID_MIN}-${SEEDED_ID_MAX}`);
  }
  const tail = numericId.toString(16).padStart(8, '0');
  return new Types.ObjectId(`${ID_PREFIX}${tail}`.slice(0, 24));
}

export function isSeededNumericId(value: number): boolean {
  return Number.isInteger(value) && value >= SEEDED_ID_MIN && value <= SEEDED_ID_MAX;
}

/**
 * True when the value is one of the ids this demo allocated, or an ObjectId
 * minted by demoObjectId. Visitor records fall outside that set and stay deletable.
 */
export function isSeededIdentifier(value: unknown, allocated: ReadonlySet<number>): boolean {
  if (value === undefined || value === null || value === '') return false;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return allocated.has(Number(text));
  if (/^[a-fA-F0-9]{24}$/.test(text)) return text.toLowerCase().startsWith(ID_PREFIX.slice(0, 8));
  return false;
}
