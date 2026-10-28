import type { QueryResultRow } from "pg";

import { pool } from "@/prisma/pool";

export interface SqlQuery {
  text: string;
  values: unknown[];
}

/**
 * Builds a parameterized query from a template literal: every interpolated value becomes a
 * positional parameter, never part of the SQL text.
 */
export function sql(
  strings: TemplateStringsArray,
  ...values: unknown[]
): SqlQuery {
  const text = strings.reduce(
    (acc, part, i) => (i === 0 ? part : `${acc}$${i}${part}`),
    "",
  );
  return { text, values };
}

/** Runs a `sql` tagged query on the shared pool and returns its rows. */
export async function query<Row extends QueryResultRow>(
  q: SqlQuery,
): Promise<Row[]> {
  const result = await pool.query<Row>(q.text, q.values);
  return result.rows;
}

/** Runs a `sql` tagged statement on the shared pool and returns the affected row count. */
export async function execute(q: SqlQuery): Promise<number> {
  const result = await pool.query(q.text, q.values);
  return result.rowCount ?? 0;
}
