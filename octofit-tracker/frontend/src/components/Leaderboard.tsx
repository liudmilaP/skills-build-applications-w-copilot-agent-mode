import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: loadedLeaderboard }) => {
        if (active) setLeaderboard(loadedLeaderboard);
      })
      .catch(() => {
        if (active) setError('Unable to load the leaderboard. Please try again.');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {leaderboard === null && !error && <p role="status">Loading leaderboard...</p>}
        {error && <p role="alert">{error}</p>}
        {leaderboard?.length === 0 && <p>No leaderboard rankings yet.</p>}
        {leaderboard && leaderboard.length > 0 && (
          <ol>
            {leaderboard.map((entry) => (
              <li key={entry.rank}>
                {entry.teamName}: {entry.totalPoints} points
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
