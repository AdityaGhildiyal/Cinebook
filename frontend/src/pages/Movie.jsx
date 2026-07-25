import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import SeatPicker from '../components/SeatPicker.jsx';

const fmt = (d) => new Date(d).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Movie() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [showId, setShowId] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get(`/movies/${id}`).then((r) => setData(r.data)).catch((e) => setErr(errMsg(e))); }, [id]);
  if (err) return <p className="error">{err}</p>;
  if (!data) return <p className="muted">Loading...</p>;
  const { movie, shows } = data;
  return (
    <>
      <h1>{movie.title}</h1>
      <p className="muted">{movie.description}</p>
      <h3>Choose a show</h3>
      {!shows.length && <p className="muted">No upcoming shows.</p>}
      <div className="chips">
        {shows.map((s) => (
          <button key={s._id} className={s._id === showId ? 'chip active' : 'chip'} onClick={() => setShowId(s._id)}>
            {fmt(s.startsAt)} · {s.screen} · ₹{s.price}
          </button>
        ))}
      </div>
      {showId && <SeatPicker showId={showId} />}
    </>
  );
}
