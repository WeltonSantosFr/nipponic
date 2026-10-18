#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/249a0c2fe7072b4fee30875474a5666435ed7e6e1f6f971a02421b391917b77e/contract';
import startContract from '../../snapshots/249a0c2fe7072b4fee30875474a5666435ed7e6e1f6f971a02421b391917b77e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/3522529e115f4cceeff3ba18a5244a0cf26b7bdd83474796cbb32b8df8c503f5/contract';
import endContract from '../../snapshots/3522529e115f4cceeff3ba18a5244a0cf26b7bdd83474796cbb32b8df8c503f5/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'curriculumTopic',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('grammarKey', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lessonIndex', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('level', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('objective', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unitIndex', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('unitTitle', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'lesson',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('dialogueJson', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('level', 'text', {
            notNull: true,
            default: lit('N5'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('theoryMarkdown', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('title', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('topicId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('vocabularyJson', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'lessonExercise',
        columns: [
          col('correctAnswer', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('explanation', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lessonId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('optionsJson', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('order', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('prompt', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'lessonFeedback',
        columns: [
          col('comment', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lessonId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rating', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'userLessonProgress',
        columns: [
          col('completedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('lessonId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('score', 'int4', {
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
        table: 'curriculumTopic',
        constraint: 'curriculumTopic_level_unitIndex_lessonIndex_key',
        columns: ['level', 'unitIndex', 'lessonIndex'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'lesson',
        constraint: 'lesson_topicId_key',
        columns: ['topicId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'userLessonProgress',
        constraint: 'userLessonProgress_userId_lessonId_key',
        columns: ['userId', 'lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessonExercise',
        index: 'lessonExercise_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'lessonFeedback',
        index: 'lessonFeedback_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'userLessonProgress',
        index: 'userLessonProgress_lessonId_idx_e358970d',
        columns: ['lessonId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'userLessonProgress',
        index: 'userLessonProgress_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lesson',
        foreignKey: {
          name: 'lesson_topicId_fkey',
          columns: ['topicId'],
          references: { schema: 'public', table: 'curriculumTopic', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessonExercise',
        foreignKey: {
          name: 'lessonExercise_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'lessonFeedback',
        foreignKey: {
          name: 'lessonFeedback_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'userLessonProgress',
        foreignKey: {
          name: 'userLessonProgress_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'userLessonProgress',
        foreignKey: {
          name: 'userLessonProgress_lessonId_fkey',
          columns: ['lessonId'],
          references: { schema: 'public', table: 'lesson', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
