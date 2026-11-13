#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/d09a08c99ecb0da4b9fdb2777956608f382f4b8c4c458541adeb8c6791ed7475/contract';
import endContract from '../../snapshots/d09a08c99ecb0da4b9fdb2777956608f382f4b8c4c458541adeb8c6791ed7475/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/5f2126da47f19f17dd789879049ae351c42e46bd5e8e325488df604193810bbf/contract';
import startContract from '../../snapshots/5f2126da47f19f17dd789879049ae351c42e46bd5e8e325488df604193810bbf/contract.json' with { type: 'json' };
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
