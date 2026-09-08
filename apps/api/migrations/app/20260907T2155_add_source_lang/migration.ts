#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/896bdf4a7e7e969ce8c4d079fd50768a63d27681f3e62fa048aa3ac8556e2ac2/contract';
import endContract from '../../snapshots/896bdf4a7e7e969ce8c4d079fd50768a63d27681f3e62fa048aa3ac8556e2ac2/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e3abe91048d3fba6f52e97e2e42e5968bcca4c6925d3eb6f1b61633e0bb27974/contract';
import startContract from '../../snapshots/e3abe91048d3fba6f52e97e2e42e5968bcca4c6925d3eb6f1b61633e0bb27974/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'note',
        column: col('sourceLang', 'text', {
          notNull: true,
          default: lit('EN'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
