#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/235c9d9777325e65a8694bf0bd54eb97f7e591bce2515d08992daff2f411582e/contract';
import endContract from '../../snapshots/235c9d9777325e65a8694bf0bd54eb97f7e591bce2515d08992daff2f411582e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/547fa128403954df1e0ee6bbfb9207cf4d529aaa0294ff07a2388f8f646fdb96/contract';
import startContract from '../../snapshots/547fa128403954df1e0ee6bbfb9207cf4d529aaa0294ff07a2388f8f646fdb96/contract.json' with { type: 'json' };
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
