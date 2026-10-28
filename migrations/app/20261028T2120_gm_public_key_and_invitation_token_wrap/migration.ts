#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/547fa128403954df1e0ee6bbfb9207cf4d529aaa0294ff07a2388f8f646fdb96/contract';
import endContract from '../../snapshots/547fa128403954df1e0ee6bbfb9207cf4d529aaa0294ff07a2388f8f646fdb96/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b65d9dfe403984f8b81318d06c26abb1ae6ff9fd1cbe8384e8d664e5ed84a399/contract';
import startContract from '../../snapshots/b65d9dfe403984f8b81318d06c26abb1ae6ff9fd1cbe8384e8d664e5ed84a399/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  // No backfill: these values are key material that only an unlocked GM session can produce. The
  // migration was written before any event was initialised; on a database with rows, setNotNull
  // fails and the transaction rolls back rather than storing unusable placeholders.
  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'event',
        column: col('gm_public_key', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.setNotNull({ schema: 'public', table: 'event', column: 'gm_public_key' }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('invitation_token_wrap', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'invitation_token_wrap' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
