import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

const initialMigration = new URL('../drizzle/0000_compasso.sql', import.meta.url);

export function openLocalDb(filename) {
  const db = new DatabaseSync(filename);

  try {
    db.exec('PRAGMA foreign_keys = ON');
    db.exec('BEGIN IMMEDIATE');

    const { user_version } = db.prepare('PRAGMA user_version').get();

    if (user_version === 0) {
      db.exec(readFileSync(initialMigration, 'utf8'));
      db.exec('PRAGMA user_version = 1');
    }

    db.exec('COMMIT');
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
