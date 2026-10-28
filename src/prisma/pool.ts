import { Pool } from "pg";

import { databaseUrl } from "@/config";

declare global {
  var pgPool: Pool | undefined;
}

function createPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 10 });
}

/**
 * One pg.Pool per process. In development the module is re-evaluated on hot reload, so the pool
 * is parked on globalThis to avoid leaking connections.
 */
export const pool: Pool =
  process.env.NODE_ENV === "production"
    ? createPool(databaseUrl)
    : (globalThis.pgPool ??= createPool(databaseUrl));
