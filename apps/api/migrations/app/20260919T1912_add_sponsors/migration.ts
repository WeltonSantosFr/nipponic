#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/249a0c2fe7072b4fee30875474a5666435ed7e6e1f6f971a02421b391917b77e/contract';
import endContract from '../../snapshots/249a0c2fe7072b4fee30875474a5666435ed7e6e1f6f971a02421b391917b77e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/828692a9bc4fac7b607cc03c26466eec8b78c1f51e06e3c9f0266b1111512679/contract';
import startContract from '../../snapshots/828692a9bc4fac7b607cc03c26466eec8b78c1f51e06e3c9f0266b1111512679/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'sponsor',
        columns: [
          col('avatarUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('githubUserId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('githubUsername', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('isOneTime', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('monthlyPriceInCents', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tierName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('userId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.disableRowLevelSecurity({
        schema: 'public',
        table: 'sponsor',
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('githubUsername', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'sponsor',
        constraint: 'sponsor_githubUsername_key',
        columns: ['githubUsername'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_githubUsername_key',
        columns: ['githubUsername'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sponsor',
        index: 'sponsor_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sponsor',
        foreignKey: {
          name: 'sponsor_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
