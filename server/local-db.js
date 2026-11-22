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

export function openDatabase(filename) {
  const db = openLocalDb(filename);

  function prepare(sql) {
    const statement = db.prepare(sql);

    function bind(...values) {
      return {
        all() {
          return { results: statement.all(...values) };
        },

        first() {
          return statement.get(...values) ?? null;
        },

        run() {
          return { meta: statement.run(...values) };
        },
      };
    }

    return {
      ...bind(),
      bind,
    };
  }

  function batch(statements) {
    db.exec('BEGIN IMMEDIATE');

    try {
      const results = statements.map((statement) => statement.run());
      db.exec('COMMIT');
      return results;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    prepare,
    batch,
    close: () => db.close(),
  };
}