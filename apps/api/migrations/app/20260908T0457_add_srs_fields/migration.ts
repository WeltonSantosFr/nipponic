#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/828692a9bc4fac7b607cc03c26466eec8b78c1f51e06e3c9f0266b1111512679/contract';
import endContract from '../../snapshots/828692a9bc4fac7b607cc03c26466eec8b78c1f51e06e3c9f0266b1111512679/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/896bdf4a7e7e969ce8c4d079fd50768a63d27681f3e62fa048aa3ac8556e2ac2/contract';
import startContract from '../../snapshots/896bdf4a7e7e969ce8c4d079fd50768a63d27681f3e62fa048aa3ac8556e2ac2/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'card',
        column: col('easeFactor', 'float8', {
          notNull: true,
          default: lit(2.5),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'card',
        column: col('interval', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'card',
        column: col('lapses', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'card',
        column: col('lastReviewedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'card',
        column: col('nextReviewAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'card',
        column: col('repetitions', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
