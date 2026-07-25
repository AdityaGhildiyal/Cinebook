import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';

export default function Movies() {
  const [movies, setMovies] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/movies').then((r) => setMovies(r.data)).catch((e) => setErr(errMsg(e))); }, []);
  if (err) return <p className="error">{err}</p>;
  if (!movies) return <p className="muted">Loading movies...</p>;
  return (
    <>
      <h1>Now showing</h1>
      <div className="grid">
        {movies.map((m) => (
          <Link key={m._id} to={`/movie/${m._id}`} className="card movie">
            <div className="poster">{m.title[0]}</div>
            <h3>{m.title}</h3>
            <p className="muted">{m.genre?.join(' / ')} | {m.durationMins} min | {m.language}</p>
            <p className="rating">★ {m.rating}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
