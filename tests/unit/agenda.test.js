import test from 'node:test';
import assert from 'node:assert/strict';
import * as validation from '../../src/domain/validation.js';
import * as collections from '../../src/domain/collections.js';

const recital = {
  title: 'Recital de viola', date: '2026-11-21', time: '19:00',
  venue: 'Sala Minas Gerais', city: 'Belo Horizonte',
};
const matine = { ...recital, title: 'Matinê', time: '10:00', venue: 'Teatro', city: 'Sabará' };
const quarteto = { ...recital, title: 'Quarteto', date: '2026-11-22' };

test('apresentação exige título e local e aceita os campos opcionais ausentes', () => {
  const minimo = { title: 'Recital', venue: 'Teatro', date: recital.date, time: recital.time };
  assert.equal(validation.validateEvent(minimo), '');
  for (const field of ['title', 'venue']) {
    for (const value of [undefined, '   ']) {
      assert.ok(validation.validateEvent({ ...minimo, [field]: value }), field);
    }
  }
});

test('valida datas reais no formato ano-mês-dia, inclusive em anos bissextos', () => {
  for (const date of ['2000-02-29', '2024-02-29', '2026-04-30']) {
    assert.equal(validation.validateEvent({ ...recital, date }), '', date);
  }
  for (const date of ['1900-02-29', '2026-02-29', '2026-04-31', '2026-13-01', '2026-2-01', '']) {
    assert.match(validation.validateEvent({ ...recital, date }), /data/i, date);
  }
});

test('horário exige hora e minuto com dois dígitos no intervalo de 00:00 a 23:59', () => {
  for (const time of ['00:00', '23:59']) {
    assert.equal(validation.validateEvent({ ...recital, time }), '', time);
  }
  for (const time of ['24:00', '12:60', '9:30', '19', '']) {
    assert.match(validation.validateEvent({ ...recital, time }), /horário/i, time);
  }
});

test('link de ingresso é opcional e aceita endereços HTTP e HTTPS', () => {
  for (const ticket of ['', 'http://example.test/bilhete', 'https://example.test/bilhete']) {
    assert.equal(validation.validateEvent({ ...recital, ticket }), '', ticket);
  }
  for (const ticket of ['/bilhete', 'ftp://example.test/bilhete']) {
    assert.match(validation.validateEvent({ ...recital, ticket }), /ingresso/i, ticket);
  }
});

test('ordena por data e horário sem alterar a lista nem inverter empates', () => {
  const bis = { ...recital, title: 'Bis' };
  const lista = Object.freeze([quarteto, recital, bis, matine]);
  assert.deepEqual(collections.sortedEvents(lista), [matine, recital, bis, quarteto]);
});

test('próximas apresentações incluem o dia consultado e seguem ordem cronológica', () => {
  const ontem = { ...recital, date: '2026-11-20' };
  const lista = [quarteto, recital, ontem, matine];
  assert.deepEqual(collections.upcoming(lista, recital.date), [matine, recital, quarteto]);
  assert.deepEqual(collections.upcoming(lista, '2026-11-23'), []);
});

test('busca por título, local ou cidade e devolve lista vazia se nada corresponder', () => {
  const lista = [quarteto, matine, recital];
  assert.deepEqual(collections.filterEvents(lista, '  QUART  '), [quarteto]);
  assert.deepEqual(collections.filterEvents(lista, 'sala minas'), [quarteto, recital]);
  assert.deepEqual(collections.filterEvents(lista, 'SABARÁ'), [matine]);
  assert.deepEqual(collections.filterEvents(lista, 'Salvador'), []);
  assert.deepEqual(collections.filterEvents(lista, ''), lista);
});

test('calendário começa na segunda e posiciona o primeiro e o último dia do mês', () => {
  // Junho de 2026 começa em uma segunda. Fevereiro começa em um domingo.
  assert.deepEqual(collections.calendarDays(2026, 5), Array.from({ length: 30 }, (_, i) => i + 1));
  assert.deepEqual(collections.calendarDays(2026, 1), [
    ...Array(6).fill(null), ...Array.from({ length: 28 }, (_, i) => i + 1),
  ]);
});

test('calendário inclui 29 de fevereiro em ano bissexto e atravessa dezembro e janeiro', () => {
  assert.equal(collections.calendarDays(2024, 1).at(-1), 29);
  const janeiro = collections.calendarDays(2026, 12);
  assert.deepEqual(janeiro, collections.calendarDays(2027, 0));
  assert.deepEqual(janeiro.slice(0, 5), [null, null, null, null, 1]);
  assert.equal(janeiro.at(-1), 31);
  assert.deepEqual(collections.calendarDays(2027, -1), collections.calendarDays(2026, 11));
});

test('só uma apresentação marcada explicitamente como pública entra no portfólio', () => {
  assert.equal(validation.isPublicEvent(recital), false);
  for (const visibility of ['private', '', 'PUBLIC', true, null]) {
    assert.equal(validation.isPublicEvent({ ...recital, visibility }), false);
  }
  assert.equal(validation.isPublicEvent({ ...recital, visibility: 'public' }), true);
});
