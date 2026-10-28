import type { JsonValue } from "@prisma/orm-postgres/target/codec-types";

export type { JsonValue };

/** Serializes a value for a jsonb column the way JSON.stringify would. */
export function toJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value ?? null));
}
