#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/235c9d9777325e65a8694bf0bd54eb97f7e591bce2515d08992daff2f411582e/contract';
import startContract from '../../snapshots/235c9d9777325e65a8694bf0bd54eb97f7e591bce2515d08992daff2f411582e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/dd38524fb3b0bb69650ebf9bc1c3db898daabd2e2488455007abff5411bf3203/contract';
import endContract from '../../snapshots/dd38524fb3b0bb69650ebf9bc1c3db898daabd2e2488455007abff5411bf3203/contract.json' with { type: 'json' };
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
