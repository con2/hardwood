import type { DefaultModelRow } from "@prisma/orm-postgres/orm-client";

import type { WithDates } from "./dates";
import type { Contract } from "./contract.d.ts";

/** A model's row exactly as the ORM returns it (timestamps as strings). */
export type Row<Model extends string> = DefaultModelRow<
  Contract,
  Model,
  "public"
>;

/** A model's row as the application uses it: timestamps parsed to `Date` (see `dates.ts`). */
export type User = WithDates<Row<"User">>;
export type EncryptedRecord = WithDates<Row<"EncryptedRecord">>;
export type Event = WithDates<Row<"Event">>;
export type Survey = WithDates<Row<"Survey">>;
