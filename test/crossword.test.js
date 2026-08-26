import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCrossword, normalizeAnswer, selectDailyQuestions, validateCrossword } from '../src/crossword/index.js';

const questions = [
  { id: 1, pregunta: 'Uno', respuesta: 'Fútbol', nivel: 1, categoria: 'historia' },
  { id: 2, pregunta: 'Dos', respuesta: 'Bota', nivel: 1, categoria: 'historia' },
  { id: 3, pregunta: 'Tres', respuesta: 'Gol', nivel: 2, categoria: 'reglas' },
  { id: 4, pregunta: 'Cuatro', respuesta: 'Tobillo', nivel: 2, categoria: 'reglas' },
  { id: 5, pregunta: 'Cinco', respuesta: 'Liga', nivel: 3, categoria: 'clubes' },
  { id: 6, pregunta: 'Seis', respuesta: 'Balón', nivel: 3, categoria: 'clubes' }
];

test('normaliza tildes, separadores y caracteres especiales', () => {
  assert.equal(normalizeAnswer('Cristiano Ronaldo!'), 'CRISTIANORONALDO');
  assert.equal(normalizeAnswer('La-Liga'), 'LALIGA');
});

test('selecciona el mismo conjunto para una fecha sin usar aleatoriedad global', () => {
  assert.deepEqual(selectDailyQuestions(questions, '2026-08-26').map((q) => q.id), selectDailyQuestions(questions, '2026-08-26').map((q) => q.id));
});

test('genera y valida cuatro palabras con metadatos renderizables', () => {
  const crossword = generateCrossword(questions.slice(0, 4));
  assert.equal(crossword.words.length, 4);
  assert.equal(validateCrossword(crossword).valid, true);
  assert.ok(crossword.words.every((word) => word.number && word.length === word.normalizedAnswer.length));
});
