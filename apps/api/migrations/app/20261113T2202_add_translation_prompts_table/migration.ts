#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1b8f2ca2e118e9e0796dc634988a15c3e064c1a4cc1229aec396663e0c9eb7aa/contract';
import endContract from '../../snapshots/1b8f2ca2e118e9e0796dc634988a15c3e064c1a4cc1229aec396663e0c9eb7aa/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/3a1864e9f78401553641ef8a7acb1cf58dd5701c2d090c7d72634ac708e49109/contract';
import startContract from '../../snapshots/3a1864e9f78401553641ef8a7acb1cf58dd5701c2d090c7d72634ac708e49109/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'translationPrompt',
        columns: [
          col('acceptedAnswers', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('answerReading', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('canonicalAnswer', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('day', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('difficulty', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('difficultyLabel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('direction', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('explanation', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('grammarPoint', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('hint', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('jlptLevel', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sourceReading', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sourceText', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'translationPrompt',
        constraint: 'translationPrompt_order_key',
        columns: ['order'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'translationPrompt',
        constraint: 'translationPrompt_day_key',
        columns: ['day'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
