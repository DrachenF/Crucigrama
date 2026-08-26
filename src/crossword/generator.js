import { normalizeAnswer } from './normalize.js';

const DIRECTIONS = { horizontal: [0, 1], vertical: [1, 0] };
const key = (row, col) => `${row},${col}`;
const boundsOf = (placed) => {
  const cells = placed.flatMap((word) => Array.from({ length: word.length }, (_, i) => [word.row + DIRECTIONS[word.direction][0] * i, word.col + DIRECTIONS[word.direction][1] * i]));
  return { minRow: Math.min(...cells.map(([r]) => r)), maxRow: Math.max(...cells.map(([r]) => r)), minCol: Math.min(...cells.map(([, c]) => c)), maxCol: Math.max(...cells.map(([, c]) => c)) };
};

function cellMap(placed) {
  const cells = new Map();
  for (const word of placed) {
    const [dr, dc] = DIRECTIONS[word.direction];
    for (let i = 0; i < word.length; i += 1) cells.set(key(word.row + dr * i, word.col + dc * i), word.normalizedAnswer[i]);
  }
  return cells;
}

/** Checks collisions, word endings, and side-touching cells before placement. */
export function isValidPlacement(candidate, placed) {
  const cells = cellMap(placed);
  const [dr, dc] = DIRECTIONS[candidate.direction];
  const perpendicular = candidate.direction === 'horizontal' ? [[-1, 0], [1, 0]] : [[0, -1], [0, 1]];
  let crossings = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    const row = candidate.row + dr * i;
    const col = candidate.col + dc * i;
    const previous = cells.get(key(row, col));
    if (previous && previous !== candidate.normalizedAnswer[i]) return false;
    if (previous) crossings += 1;
    if (!previous && perpendicular.some(([sideRow, sideCol]) => cells.has(key(row + sideRow, col + sideCol)))) return false;
  }
  if (cells.has(key(candidate.row - dr, candidate.col - dc)) || cells.has(key(candidate.row + dr * candidate.length, candidate.col + dc * candidate.length))) return false;
  return crossings > 0 || placed.length === 0 || candidate.disconnected === true;
}

function candidatesFor(word, placed) {
  if (!placed.length) return [{ ...word, direction: 'horizontal', row: 0, col: 0 }];
  const candidates = new Map();
  for (const other of placed) {
    const [otherRow, otherCol] = DIRECTIONS[other.direction];
    const direction = other.direction === 'horizontal' ? 'vertical' : 'horizontal';
    const [rowDelta, colDelta] = DIRECTIONS[direction];
    for (let i = 0; i < word.length; i += 1) for (let j = 0; j < other.length; j += 1) {
      if (word.normalizedAnswer[i] !== other.normalizedAnswer[j]) continue;
      const row = other.row + otherRow * j - rowDelta * i;
      const col = other.col + otherCol * j - colDelta * i;
      candidates.set(`${direction}:${row}:${col}`, { ...word, direction, row, col });
    }
  }
  // An isolated word is a last resort. It still receives a valid, renderable board.
  const box = boundsOf(placed);
  candidates.set(`fallback:${box.maxRow + 2}:${box.minCol}`, { ...word, direction: 'horizontal', row: box.maxRow + 2, col: box.minCol, disconnected: true });
  return [...candidates.values()].filter((candidate) => isValidPlacement(candidate, placed));
}

export function scoreSolution(words) {
  const cells = cellMap(words);
  const crossings = [...cells.values()].length < words.reduce((sum, word) => sum + word.length, 0)
    ? words.reduce((sum, word) => sum + word.length, 0) - cells.size : 0;
  const connected = words.length ? connectedWordCount(words) === words.length : false;
  const box = boundsOf(words);
  const area = (box.maxRow - box.minRow + 1) * (box.maxCol - box.minCol + 1);
  return (connected ? 1_000_000 : 0) + crossings * 10_000 - area * 10 - (area - cells.size);
}

function connectedWordCount(words) {
  const occupied = words.map((word) => new Set(Array.from({ length: word.length }, (_, i) => key(word.row + DIRECTIONS[word.direction][0] * i, word.col + DIRECTIONS[word.direction][1] * i))));
  const seen = new Set([0]); const queue = [0];
  while (queue.length) {
    const index = queue.shift();
    occupied.forEach((cells, other) => {
      if (!seen.has(other) && [...occupied[index]].some((cell) => cells.has(cell))) { seen.add(other); queue.push(other); }
    });
  }
  return seen.size;
}

export function numberWords(words) {
  const starts = new Map();
  [...words].sort((a, b) => a.row - b.row || a.col - b.col).forEach((word) => {
    const start = key(word.row, word.col);
    if (!starts.has(start)) starts.set(start, starts.size + 1);
    word.number = starts.get(start);
  });
  return words;
}

export function buildGrid(words) {
  const box = boundsOf(words); const cells = cellMap(words);
  return Array.from({ length: box.maxRow - box.minRow + 1 }, (_, row) => Array.from({ length: box.maxCol - box.minCol + 1 }, (_, col) => cells.get(key(row + box.minRow, col + box.minCol)) ?? null));
}

/** Backtracks all legal crossing arrangements and keeps the highest-scoring one. */
export function generateCrossword(questions) {
  if (questions.length !== 4) throw new Error('El crucigrama diario requiere exactamente 4 preguntas.');
  const source = questions.map((question) => {
    const normalizedAnswer = normalizeAnswer(question.respuesta);
    return { ...question, answer: question.respuesta, normalizedAnswer, length: normalizedAnswer.length };
  }).filter((word) => word.normalizedAnswer.length > 1);
  if (source.length !== 4) throw new Error('Las cuatro respuestas deben contener al menos dos letras.');
  const ordered = [...source].sort((a, b) => b.normalizedAnswer.length - a.normalizedAnswer.length || a.id - b.id);
  let best = null;
  function search(index, placed) {
    if (index === ordered.length) {
      const score = scoreSolution(placed);
      if (!best || score > best.score) best = { score, words: placed.map((word) => ({ ...word })) };
      return;
    }
    for (const candidate of candidatesFor(ordered[index], placed)) search(index + 1, [...placed, candidate]);
  }
  search(0, []);
  if (!best) throw new Error('No se pudo construir un crucigrama válido.');
  const rawBox = boundsOf(best.words);
  const words = numberWords(best.words).map(({ disconnected, normalizedAnswer, row, col, ...word }) => ({ ...word, direction: word.direction, row: row - rawBox.minRow, col: col - rawBox.minCol, length: normalizedAnswer.length, normalizedAnswer }));
  return { grid: buildGrid(best.words), words, score: best.score };
}
