#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b8d79c52d40f623a51d8cef4b49442659a7f71dc4aaf9f473afddea69a63e3db/contract';
import endContract from '../../snapshots/b8d79c52d40f623a51d8cef4b49442659a7f71dc4aaf9f473afddea69a63e3db/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f6551e40778b7857fe91dab2a95762d928bfc82785a5ad4f44c069e1c950d742/contract';
import startContract from '../../snapshots/f6551e40778b7857fe91dab2a95762d928bfc82785a5ad4f44c069e1c950d742/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('public_key_binding', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
