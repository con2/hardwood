import postgres from "@prisma/orm-postgres/runtime";

import { pool } from "@/prisma/pool";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

/**
 * Module-level singleton for the process lifetime. Shares its connection pool with every other
 * raw-SQL caller (`src/prisma/pool.ts`) so the app holds one pool per process.
 */
export const db = postgres<Contract>({ contractJson, pg: pool });

/** A transaction handle, as passed to the `db.transaction` callback. */
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Either the database or a transaction: functions that may run inside a caller's transaction take this. */
export type Queryable = Pick<Transaction, "orm">;
