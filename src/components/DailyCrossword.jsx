import React, { useMemo } from 'react';
import { generateCrossword, selectDailyQuestions } from '../crossword/index.js';

/** Presentation-only component: give it the existing JSON array as `questions`. */
export function DailyCrossword({ questions, date, level }) {
  const crossword = useMemo(() => generateCrossword(selectDailyQuestions(questions, date, { level })), [questions, date, level]);
  return <section className="daily-crossword" aria-label="Crucigrama diario">
    <div
      className="crossword-grid"
      style={{ gridTemplateColumns: `repeat(${crossword.grid[0].length}, 1fr)` }}
      aria-label="Cuadrícula del crucigrama"
    >
      {crossword.grid.map((row, rowIndex) => row.map((letter, colIndex) => (
        <span
          key={`${rowIndex}-${colIndex}`}
          className={`crossword-cell${letter ? '' : ' crossword-cell--blank'}`}
          aria-hidden={!letter}
        >
          {letter ?? ''}
        </span>
      )))}
    </div>
    <ol className="crossword-clues">
      {crossword.words.map((word) => <li key={word.id} value={word.number}>{word.pregunta} <small>({word.direction})</small></li>)}
    </ol>
  </section>;
}
