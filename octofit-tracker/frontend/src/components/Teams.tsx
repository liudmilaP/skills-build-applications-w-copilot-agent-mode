import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name: string;
  mascot: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: loadedTeams }) => {
        if (active) setTeams(loadedTeams);
      })
      .catch(() => {
        if (active) setError('Unable to load teams. Please try again.');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {teams === null && !error && <p role="status">Loading teams...</p>}
        {error && <p role="alert">{error}</p>}
        {teams?.length === 0 && <p>No teams yet.</p>}
        {teams && teams.length > 0 && (
          <ul>
            {teams.map((team) => (
              <li key={team.name}>
                {team.name} ({team.mascot}): {team.members.length} members
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
