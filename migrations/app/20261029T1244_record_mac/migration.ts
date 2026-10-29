#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/cdd8eed3b536edcd797640dcb27c668a99b1158b171c68c2c4b51373c9153ac0/contract';
import endContract from '../../snapshots/cdd8eed3b536edcd797640dcb27c668a99b1158b171c68c2c4b51373c9153ac0/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/dd38524fb3b0bb69650ebf9bc1c3db898daabd2e2488455007abff5411bf3203/contract';
import startContract from '../../snapshots/dd38524fb3b0bb69650ebf9bc1c3db898daabd2e2488455007abff5411bf3203/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'encrypted_record',
        column: col('mac', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
