import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: loadedActivities }) => {
        if (active) setActivities(loadedActivities);
      })
      .catch(() => {
        if (active) setError('Unable to load activities. Please try again.');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {activities === null && !error && <p role="status">Loading activities...</p>}
        {error && <p role="alert">{error}</p>}
        {activities?.length === 0 && <p>No activities yet.</p>}
        {activities && activities.length > 0 && (
          <ul>
            {activities.map((activity, index) => (
              <li key={`${activity.type}-${index}`}>
                {activity.type}: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
