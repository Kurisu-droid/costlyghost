import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';

export const HistoryPage = () => {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => { apiGet<any[]>('/audit-events').then(setEvents); }, []);

  return (
    <section>
      <header className="page-head"><h2>History</h2><p>Audit trail with before/after visibility.</p></header>
      <div className="panel">
        <table className="dense"><thead><tr><th>Time</th><th>Event</th><th>Actor</th><th>Before</th><th>After</th><th>Rollback</th></tr></thead><tbody>
          {events.map((e) => <tr key={e.id}><td>{new Date(e.createdAt).toLocaleString()}</td><td>{e.eventType}</td><td>{e.actor}</td><td><code>{JSON.stringify(e.before)}</code></td><td><code>{JSON.stringify(e.after)}</code></td><td><button disabled>Rollback</button></td></tr>)}
        </tbody></table>
      </div>
    </section>
  );
};
