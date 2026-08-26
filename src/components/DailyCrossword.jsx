import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generateCrossword, selectDailyQuestions } from '../crossword/index.js';

const cellKey = (row, col) => `${row}-${col}`;
const getLetter = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
const DAY_MS = 86_400_000;

/** Renders an editable daily crossword while keeping its solution private. */
export function DailyCrossword({ questions, date, level }) {
  const initialDate = useRef(date ? new Date(date) : new Date());
  const cellRefs = useRef(new Map());
  const [puzzleVersion, setPuzzleVersion] = useState(0);
  const puzzleDate = useMemo(() => new Date(initialDate.current.getTime() + puzzleVersion * DAY_MS), [puzzleVersion]);
  const crossword = useMemo(() => generateCrossword(selectDailyQuestions(questions, puzzleDate, { level })), [questions, puzzleDate, level]);
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

  const focusNextCell = (row, col) => {
    const [rowStep, colStep] = activeWord.direction === 'vertical' ? [1, 0] : [0, 1];
    const index = Array.from({ length: activeWord.length }, (_, wordIndex) => wordIndex)
      .find((wordIndex) => activeWord.row + rowStep * wordIndex === row && activeWord.col + colStep * wordIndex === col);
    if (index === undefined || index === activeWord.length - 1) return;
    const nextKey = cellKey(row + rowStep, col + colStep);
    cellRefs.current.get(nextKey)?.focus();
  };

  const updateLetter = (row, col, value) => {
    const letter = getLetter(value);
    setEnteredLetters((letters) => ({ ...letters, [cellKey(row, col)]: letter }));
    if (letter) focusNextCell(row, col);
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
  const directionLabel = activeWord.direction === 'horizontal' ? 'Horizontal →' : 'Vertical ↓';
  return <section className="daily-crossword" aria-label="Crucigrama diario">
    <div className="crossword-board" aria-label="Cuadrícula del crucigrama">
      <div
        className="crossword-grid"
        style={{ gridTemplateColumns: `repeat(${crossword.grid[0].length}, var(--cell-size))` }}
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
              spellCheck="false"
              maxLength="1"
              value={enteredLetter}
              ref={(element) => {
                if (element) cellRefs.current.set(key, element);
                else cellRefs.current.delete(key);
              }}
              onChange={(event) => updateLetter(rowIndex, colIndex, event.target.value)}
              aria-label={`Casilla ${rowIndex + 1}, ${colIndex + 1}`}
            />
          ) : <span key={key} className="crossword-cell crossword-cell--blank" aria-hidden="true" />;
        }))}
      </div>
    </div>
    <section className="clue-carousel" aria-label="Pistas del crucigrama">
      <button className="carousel-control" type="button" onClick={() => changeClue(-1)} aria-label="Pregunta anterior">←</button>
      <div className="clue-viewport" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => { pointerStart.current = null; }}>
        <div className="clue-toolbar">
          <span>Resuelve las 4 pistas</span>
          <button className="new-crossword-button" type="button" onClick={() => setPuzzleVersion((version) => version + 1)}>Nuevo crucigrama</button>
        </div>
        <article className="clue-card" key={activeWord.id}>
          <p className="clue-number">Pregunta {currentClue + 1} de {crossword.words.length}</p>
          <p className="clue-question">{activeWord.pregunta}</p>
          <div className="clue-details">
            <span className={`direction-badge direction-badge--${activeWord.direction}`}>{directionLabel}</span>
            <span>{activeWord.length} letras</span>
          </div>
        </article>
        <div className="carousel-indicators" aria-label="Seleccionar pregunta">
          {crossword.words.map((word, index) => <button key={word.id} className={`carousel-dot${index === currentClue ? ' carousel-dot--active' : ''}`} type="button" onClick={() => setCurrentClue(index)} aria-label={`Mostrar pregunta ${index + 1}`} aria-current={index === currentClue} />)}
        </div>
      </div>
      <button className="carousel-control" type="button" onClick={() => changeClue(1)} aria-label="Pregunta siguiente">→</button>
    </section>
  </section>;
}
