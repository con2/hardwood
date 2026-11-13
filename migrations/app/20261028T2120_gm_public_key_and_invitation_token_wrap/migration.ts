#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/f6551e40778b7857fe91dab2a95762d928bfc82785a5ad4f44c069e1c950d742/contract';
import endContract from '../../snapshots/f6551e40778b7857fe91dab2a95762d928bfc82785a5ad4f44c069e1c950d742/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e430e2edfbcd22b00bc4d1d46ad0049a29c7f0541b52d745b15b5eb5eedb0064/contract';
import startContract from '../../snapshots/e430e2edfbcd22b00bc4d1d46ad0049a29c7f0541b52d745b15b5eb5eedb0064/contract.json' with { type: 'json' };
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
