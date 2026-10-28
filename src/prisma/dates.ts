/**
 * Prisma 8 reads and writes timestamptz columns as ISO 8601 strings. The rest of the app works
 * with `Date`, so rows cross this boundary on the way in (`parseDates`) and out (`formatDates`).
 * Fields are recognized by name; every timestamp column in the contract is listed here.
 */
const timestampFields = new Set(["createdAt", "updatedAt", "lockedUntil"]);

const jsonFields = new Set(["kdfParams"]);

type TimestampField = "createdAt" | "updatedAt" | "lockedUntil";

/** jsonb columns hold arbitrary JSON, never timestamps to convert. */
type JsonField = "kdfParams";

type Replace<T, From, To> = T extends From ? To : T;

/** A row shape with the timestamp string fields read as `Date`, including included relations. */
export type WithDates<T> = T extends readonly (infer Item)[]
  ? WithDates<Item>[]
  : T extends object
    ? {
        [K in keyof T]: K extends TimestampField
          ? Replace<T[K], string, Date>
          : K extends JsonField
            ? T[K]
            : WithDates<T[K]>;
      }
    : T;

/** A write shape with `Date` timestamp fields formatted as strings. */
export type WithTimestamps<T> = {
  [K in keyof T]: K extends TimestampField ? Replace<T[K], Date, string> : T[K];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

/** Converts the timestamp string fields of a row (and its included relations) to `Date`. */
export function parseDates<T>(row: T): WithDates<T> {
  if (Array.isArray(row)) {
    return row.map(parseDates) as WithDates<T>;
  }
  if (!isPlainObject(row)) {
    return row as WithDates<T>;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (timestampFields.has(key) && typeof value === "string") {
      result[key] = new Date(value);
    } else if (jsonFields.has(key)) {
      result[key] = value;
    } else if (Array.isArray(value) || isPlainObject(value)) {
      result[key] = parseDates(value);
    } else {
      result[key] = value;
    }
  }
  return result as WithDates<T>;
}

/** Converts the `Date` timestamp fields of a write input to ISO strings. */
export function formatDates<T extends object>(input: T): WithTimestamps<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = value instanceof Date ? value.toISOString() : value;
  }
  return result as WithTimestamps<T>;
}
