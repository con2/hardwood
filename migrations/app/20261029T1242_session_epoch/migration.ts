#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/b8d79c52d40f623a51d8cef4b49442659a7f71dc4aaf9f473afddea69a63e3db/contract';
import startContract from '../../snapshots/b8d79c52d40f623a51d8cef4b49442659a7f71dc4aaf9f473afddea69a63e3db/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ae48bab8393e8a6b1fc2ea81d71de68197c593d18eee6b7c3d4524ed344947e2/contract';
import endContract from '../../snapshots/ae48bab8393e8a6b1fc2ea81d71de68197c593d18eee6b7c3d4524ed344947e2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('session_epoch', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
