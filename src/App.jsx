import questions from './data/preguntas.json';
import { DailyCrossword } from './components/DailyCrossword.jsx';

function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Reto diario</p>
        <h1>Crucigrama de fútbol</h1>
        <p>Cuatro pistas, una sola pasión. Descubre las respuestas del día.</p>
      </header>

      <DailyCrossword questions={questions} />
    </main>
  );
}

export default App;
