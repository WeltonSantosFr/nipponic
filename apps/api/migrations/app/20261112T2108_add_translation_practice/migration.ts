#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3a1864e9f78401553641ef8a7acb1cf58dd5701c2d090c7d72634ac708e49109/contract';
import endContract from '../../snapshots/3a1864e9f78401553641ef8a7acb1cf58dd5701c2d090c7d72634ac708e49109/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/685423cfaf8a8020212c48e5ed84e9025b5c7576ee823182d5003f9da6e233b3/contract';
import startContract from '../../snapshots/685423cfaf8a8020212c48e5ed84e9025b5c7576ee823182d5003f9da6e233b3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'translationAttempt',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isCorrect', 'bool', { notNull: true, codecRef: { codecId: 'pg/bool@1' } }),
          col('localDate', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('promptId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userAnswer', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'userTranslationProgress',
        columns: [
          col('completedPromptIds', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('currentDifficulty', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lastCompletedDate', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('totalCompleted', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'userTranslationProgress',
        constraint: 'userTranslationProgress_userId_key',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'translationAttempt',
        index: 'translationAttempt_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'translationAttempt',
        foreignKey: {
          name: 'translationAttempt_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'userTranslationProgress',
        foreignKey: {
          name: 'userTranslationProgress_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
