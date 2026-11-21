import test from 'node:test';
import assert from 'node:assert/strict';
import { openLocalDb } from '../../server/local-db.js';

test('abrir um banco novo cria a tabela de artistas', (t) => {
  const db = openLocalDb(':memory:');
  t.after(() => db.close());

  const table = db.prepare(`
    SELECT name
    FROM sqlite_schema
    WHERE type = 'table' AND name = 'artists'
  `).get();

  assert.equal(table?.name, 'artists');
});

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function insertArtist(db, id, email, slug) {
  db.prepare(`
    INSERT INTO artists (id, email, full_name, slug, password_hash, draft)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email, 'Ana Silva', slug, 'hash-de-teste', '{}');
}

test('reabrir um banco em arquivo preserva o artista cadastrado', () => {
  const directory = mkdtempSync(join(tmpdir(), 'compasso-test-'));
  const filename = join(directory, 'compasso.sqlite');

  try {
    const first = openLocalDb(filename);
    try {
      insertArtist(first, 'a1', 'ana@example.com', 'ana-silva');
    } finally {
      first.close();
    }

    const reopened = openLocalDb(filename);
    try {
      const artist = reopened.prepare(
        'SELECT slug FROM artists WHERE email = ?'
      ).get('ana@example.com');

      assert.equal(artist?.slug, 'ana-silva');
    } finally {
      reopened.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('rejeita um e-mail já cadastrado mesmo com outro slug', (t) => {
  const db = openLocalDb(':memory:');
  t.after(() => db.close());

  insertArtist(db, 'a1', 'ana@example.com', 'ana-silva');

  assert.throws(
    () => insertArtist(db, 'a2', 'ana@example.com', 'outro-artista'),
    /UNIQUE constraint failed: artists\.email/
  );
});

test('rejeita um slug já cadastrado mesmo com outro e-mail', (t) => {
  const db = openLocalDb(':memory:');
  t.after(() => db.close());

  insertArtist(db, 'a1', 'ana@example.com', 'ana-silva');

  assert.throws(
    () => insertArtist(db, 'a2', 'outra@example.com', 'ana-silva'),
    /UNIQUE constraint failed: artists\.slug/
  );
});
