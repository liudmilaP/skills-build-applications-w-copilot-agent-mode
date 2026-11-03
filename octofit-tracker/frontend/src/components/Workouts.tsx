import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(
      `/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`,
    )
      .then(({ suggestions: loadedSuggestions }) => {
        if (active) setSuggestions(loadedSuggestions);
      })
      .catch(() => {
        if (active) setError('Unable to load workout suggestions. Please try again.');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {suggestions === null && !error && <p role="status">Loading workout suggestions...</p>}
        {error && <p role="alert">{error}</p>}
        {suggestions?.length === 0 && <p>No workout suggestions yet.</p>}
        {suggestions && suggestions.length > 0 && (
          <ul>
            {suggestions.map((suggestion) => (
              <li key={suggestion.title}>
                <strong>{suggestion.title}</strong>: {suggestion.focus}, {suggestion.minutes} minutes, {suggestion.difficulty}. {suggestion.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
