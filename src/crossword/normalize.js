/** Return the alphabet-only representation used by the crossword engine. */
export function normalizeAnswer(answer) {
  return String(answer ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}
