#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5f2126da47f19f17dd789879049ae351c42e46bd5e8e325488df604193810bbf/contract';
import endContract from '../../snapshots/5f2126da47f19f17dd789879049ae351c42e46bd5e8e325488df604193810bbf/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/ae48bab8393e8a6b1fc2ea81d71de68197c593d18eee6b7c3d4524ed344947e2/contract';
import startContract from '../../snapshots/ae48bab8393e8a6b1fc2ea81d71de68197c593d18eee6b7c3d4524ed344947e2/contract.json' with { type: 'json' };
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
