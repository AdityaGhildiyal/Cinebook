import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';

export default function Bookings() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api.get('/bookings/mine').then((r) => setList(r.data)).catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => { if (!confirm('Cancel this booking?')) return; try { await api.delete(`/bookings/${id}`); load(); } catch (e) { setErr(errMsg(e)); } };
  if (!list) return <p className="muted">{err || 'Loading...'}</p>;
  return (
    <>
      <h1>My bookings</h1>
      {err && <p className="error">{err}</p>}
      {!list.length && <p className="muted">No bookings yet.</p>}
      {list.map((b) => (
        <div key={b._id} className="card booking">
          <div>
            <h3>{b.show?.movie?.title}</h3>
            <p className="muted">{b.show && new Date(b.show.startsAt).toLocaleString()} · {b.show?.screen}</p>
            <p>Seats: <strong>{b.seats.join(', ')}</strong> · ₹{b.amount}</p>
          </div>
          <div>
            <span className={`tag ${b.status}`}>{b.status}</span>
            {b.status === 'confirmed' && <button className="ghost" onClick={() => cancel(b._id)}>Cancel</button>}
          </div>
        </div>
      ))}
    </>
  );
}
