import { normalizeAnswer } from './normalize.js';

const DAY_MS = 86_400_000;

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function hash(value) {
  let state = 2166136261;
  for (const character of value) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return state >>> 0;
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, seed) {
  const result = [...items];
  const next = random(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(next() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/**
 * Picks a stable daily set without changing the source JSON. `level` is optional:
 * pass a number or an array of accepted levels to constrain a daily mode.
 */
export function selectDailyQuestions(questions, date = new Date(), { count = 4, level, recentDays = 14 } = {}) {
  const valid = questions.filter((question) => {
    const normalized = normalizeAnswer(question.respuesta);
    const allowed = level === undefined || (Array.isArray(level) ? level : [level]).includes(question.nivel);
    return allowed && normalized.length > 1;
  });
  if (valid.length < count) throw new Error(`Se necesitan al menos ${count} preguntas válidas.`);

  const today = new Date(`${dateKey(date)}T00:00:00.000Z`);
  const recentIds = new Set();
  // Reproduce prior deterministic draws; this avoids persistence and only matters
  // when the collection has enough alternatives to make the exclusion meaningful.
  for (let days = 1; days <= recentDays; days += 1) {
    const previous = new Date(today.getTime() - days * DAY_MS);
    for (const question of shuffled(valid, hash(dateKey(previous))).slice(0, count)) recentIds.add(question.id);
  }
  const candidates = valid.filter((question) => !recentIds.has(question.id));
  const pool = candidates.length >= count ? candidates : valid;
  return shuffled(pool, hash(dateKey(today))).slice(0, count);
}
