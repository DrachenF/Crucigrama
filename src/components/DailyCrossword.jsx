import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generateCrossword, selectDailyQuestions } from '../crossword/index.js';

const cellKey = (row, col) => `${row}-${col}`;
const getLetter = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(-1);

/** Renders an editable daily crossword while keeping its solution private. */
export function DailyCrossword({ questions, date, level }) {
  const crossword = useMemo(() => generateCrossword(selectDailyQuestions(questions, date, { level })), [questions, date, level]);
  const [enteredLetters, setEnteredLetters] = useState({});
  const [currentClue, setCurrentClue] = useState(0);
  const pointerStart = useRef(null);

  useEffect(() => {
    setEnteredLetters({});
    setCurrentClue(0);
  }, [crossword]);

  const changeClue = (offset) => {
    setCurrentClue((current) => (current + offset + crossword.words.length) % crossword.words.length);
  };

  const updateLetter = (row, col, value) => {
    const letter = getLetter(value);
    setEnteredLetters((letters) => ({ ...letters, [cellKey(row, col)]: letter }));
  };

  const handlePointerDown = (event) => {
    pointerStart.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) >= 40) changeClue(distance < 0 ? 1 : -1);
  };

  const activeWord = crossword.words[currentClue];
  return <section className="daily-crossword" aria-label="Crucigrama diario">
    <div
      className="crossword-grid"
      style={{ gridTemplateColumns: `repeat(${crossword.grid[0].length}, 1fr)` }}
      aria-label="Cuadrícula del crucigrama"
    >
      {crossword.grid.map((row, rowIndex) => row.map((solutionLetter, colIndex) => {
        const key = cellKey(rowIndex, colIndex);
        const enteredLetter = enteredLetters[key] ?? '';
        return solutionLetter ? (
          <input
            key={key}
            className={`crossword-cell${enteredLetter ? ' crossword-cell--filled' : ''}${enteredLetter && enteredLetter !== solutionLetter ? ' crossword-cell--incorrect' : ''}`}
            type="text"
            inputMode="text"
            autoComplete="off"
            maxLength="1"
            value={enteredLetter}
            onChange={(event) => updateLetter(rowIndex, colIndex, event.target.value)}
            aria-label={`Casilla ${rowIndex + 1}, ${colIndex + 1}`}
          />
        ) : <span key={key} className="crossword-cell crossword-cell--blank" aria-hidden="true" />;
      }))}
    </div>
    <section className="clue-carousel" aria-label="Pistas del crucigrama">
      <button className="carousel-control" type="button" onClick={() => changeClue(-1)} aria-label="Pregunta anterior">←</button>
      <div className="clue-viewport" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
        <article className="clue-card" key={activeWord.id}>
          <p className="clue-number">Pregunta {currentClue + 1} de {crossword.words.length}</p>
          <p className="clue-question">{activeWord.pregunta}</p>
          <small>{activeWord.length} letras · {activeWord.direction}</small>
        </article>
        <div className="carousel-indicators" aria-label="Seleccionar pregunta">
          {crossword.words.map((word, index) => <button key={word.id} className={`carousel-dot${index === currentClue ? ' carousel-dot--active' : ''}`} type="button" onClick={() => setCurrentClue(index)} aria-label={`Mostrar pregunta ${index + 1}`} aria-current={index === currentClue} />)}
        </div>
      </div>
      <button className="carousel-control" type="button" onClick={() => changeClue(1)} aria-label="Pregunta siguiente">→</button>
    </section>
  </section>;
}
