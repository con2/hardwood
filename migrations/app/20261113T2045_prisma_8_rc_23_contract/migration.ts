#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/d09a08c99ecb0da4b9fdb2777956608f382f4b8c4c458541adeb8c6791ed7475/contract';
import startContract from '../../snapshots/d09a08c99ecb0da4b9fdb2777956608f382f4b8c4c458541adeb8c6791ed7475/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/ef0409578add6a994d46b8944ceb48ef7f2efd631de3b77ee3747527930a2e0f/contract';
import endContract from '../../snapshots/ef0409578add6a994d46b8944ceb48ef7f2efd631de3b77ee3747527930a2e0f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [];
  }
}

MigrationCLI.run(import.meta.url, M);
