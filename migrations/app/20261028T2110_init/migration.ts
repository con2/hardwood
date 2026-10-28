#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b65d9dfe403984f8b81318d06c26abb1ae6ff9fd1cbe8384e8d664e5ed84a399/contract';
import endContract from '../../snapshots/b65d9dfe403984f8b81318d06c26abb1ae6ff9fd1cbe8384e8d664e5ed84a399/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'record_kind',
        members: [
          'VETTING_RESPONSE',
          'FLAGS',
          'PRACTICAL_RESPONSE',
          'PLAYER_ATTRIBUTES',
          'CASTING_RESULT',
        ],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'survey_slug',
        members: ['vetting', 'practical'],
      }),
      this.createNativeEnumType({
        schema: 'public',
        typeName: 'user_status',
        members: ['INVITED', 'REVOKED', 'ENTERED', 'WITHDRAWN'],
      }),
      this.createTable({
        schema: 'public',
        table: 'encrypted_record',
        columns: [
          col('ciphertext', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('gm_key_wrap', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('invitee_key_wrap', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('kind', '"record_kind"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'record_kind' } },
          }),
          col('owner_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('self_key_wrap', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'event',
        columns: [
          col('ciphertext', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('gm_key_recovery_wrap', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('invitee_key_recovery_wrap', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('invitee_key_wrap', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('privacy_policy', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'survey',
        columns: [
          col('ciphertext', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('invitee_key_wrap', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('slug', '"survey_slug"', {
            notNull: true,
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'survey_slug' } },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['slug'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('encrypted_private_key', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('failed_sign_ins', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('gm_key_wrap', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('invitation_token_hash', 'text', {
            notNull: true,
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('invitee_key_wrap', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('is_gm', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('kdf_params', 'jsonb', { notNull: true, codecRef: { codecId: 'pg/jsonb@1' } }),
          col('kdf_salt', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('locked_until', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('password_pending', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('public_key', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', '"user_status"', {
            notNull: true,
            default: lit('INVITED'),
            codecRef: { codecId: 'pg/enum@1', typeParams: { typeName: 'user_status' } },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'encrypted_record',
        constraint: 'encrypted_record_kind_owner_id_key',
        columns: ['kind', 'owner_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_invitation_token_hash_key',
        columns: ['invitation_token_hash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'encrypted_record',
        index: 'encrypted_record_owner_id_idx_ade9f347',
        columns: ['owner_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'encrypted_record',
        foreignKey: {
          name: 'encrypted_record_owner_id_fkey',
          columns: ['owner_id'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
