#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/8b2fd060981196dc0f5672f639220717669bbae496d6991f0f4c84190171973e/contract';
import endContract from '../../snapshots/8b2fd060981196dc0f5672f639220717669bbae496d6991f0f4c84190171973e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cdd8eed3b536edcd797640dcb27c668a99b1158b171c68c2c4b51373c9153ac0/contract';
import startContract from '../../snapshots/cdd8eed3b536edcd797640dcb27c668a99b1158b171c68c2c4b51373c9153ac0/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'feedback',
        columns: [
          col('ciphertext', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('gm_key_wrap', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('mac', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
