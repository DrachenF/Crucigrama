import { buildGrid, numberWords } from './generator.js';

/** Validates an output object before a React renderer consumes it. */
export function validateCrossword(crossword) {
  const errors = [];
  if (!crossword?.grid?.length || !Array.isArray(crossword.words) || crossword.words.length !== 4) errors.push('Deben existir exactamente cuatro palabras y una cuadrícula.');
  for (const word of crossword?.words ?? []) {
    const [dr, dc] = word.direction === 'horizontal' ? [0, 1] : word.direction === 'vertical' ? [1, 0] : [null, null];
    if (dr === null || word.length !== word.normalizedAnswer?.length) { errors.push(`Metadatos inválidos para ${word.id}.`); continue; }
    for (let i = 0; i < word.length; i += 1) if (crossword.grid[word.row + dr * i]?.[word.col + dc * i] !== word.normalizedAnswer[i]) errors.push(`Coordenada inválida para ${word.id}.`);
  }
  const occupied = new Map();
  for (const word of crossword?.words ?? []) {
    const [dr, dc] = word.direction === 'vertical' ? [1, 0] : [0, 1];
    for (let index = 0; index < word.length; index += 1) {
      const position = `${word.row + dr * index},${word.col + dc * index}`;
      const letter = word.normalizedAnswer[index];
      if (occupied.has(position) && occupied.get(position) !== letter) errors.push(`Conflicto de letras en ${position}.`);
      occupied.set(position, letter);
    }
  }
  if ((crossword?.grid ?? []).some((row) => !Array.isArray(row) || row.length !== crossword.grid[0]?.length)) errors.push('La cuadrícula debe ser rectangular.');
  const expected = numberWords(crossword.words.map((word) => ({ ...word }))).map((word) => word.number);
  if (expected.some((number, index) => number !== crossword.words[index].number)) errors.push('Numeración de pistas inválida.');
  try { buildGrid(crossword.words); } catch { errors.push('La cuadrícula no se puede renderizar.'); }
  return { valid: errors.length === 0, errors };
}
