import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const artists = sqliteTable('artists', {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  full_name: text().notNull(),
  slug: text().notNull().unique(),
  password_hash: text().notNull(),
  draft: text().notNull(),
  publication: text(),
  revision: integer().notNull().default(0),
});

export const sessions = sqliteTable('sessions', {
  digest: text().primaryKey(),
  artist_id: text().notNull().references(() => artists.id, { onDelete: 'cascade' }),
  expires: integer().notNull(),
});

export const messages = sqliteTable('team_messages', {
  id: text().primaryKey(),
  email: text().notNull(),
  message: text().notNull(),
  created_at: text().notNull(),
});

export const limits = sqliteTable('request_limits', {
  key: text().primaryKey(),
  expires: integer().notNull(),
  attempts: integer().notNull(),
});
