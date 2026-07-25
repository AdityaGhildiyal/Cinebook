import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';

export default function SeatPicker({ showId }) {
  const nav = useNavigate();
  const [show, setShow] = useState(null);
  const [sel, setSel] = useState([]);
  const [held, setHeld] = useState(null); // { until }
  const [left, setLeft] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get(`/shows/${showId}`).then((r) => setShow(r.data)).catch((e) => setMsg(errMsg(e))), [showId]);

  // Real-time updates: the server broadcasts "seats" whenever holds or bookings change
  useEffect(() => {
    setSel([]); setHeld(null); setMsg(''); load();
    const socket = io();
    socket.on('seats', (e) => { if (e.showId === showId) load(); });
    return () => socket.disconnect();
  }, [showId, load]);

  useEffect(() => {
    if (!held) return;
    const t = setInterval(() => {
      const s = Math.round((held.until - Date.now()) / 1000);
      setLeft(s);
      if (s <= 0) { setHeld(null); setSel([]); setMsg('Your hold expired. Please select seats again.'); load(); }
    }, 500);
    return () => clearInterval(t);
  }, [held, load]);

  if (!show) return <p className="muted">Loading seats...</p>;
  const lockedByOthers = new Set(show.locked.filter((l) => !l.mine).map((l) => l.seat));
  const booked = new Set(show.bookedSeats);
  const toggle = (s) => { if (!held) setSel(sel.includes(s) ? sel.filter((x) => x !== s) : sel.length < 6 ? [...sel, s] : sel); };

  const act = async (fn) => { setBusy(true); setMsg(''); try { await fn(); } catch (e) { setMsg(errMsg(e)); load(); } finally { setBusy(false); } };
  const hold = () => act(async () => { const { data } = await api.post(`/shows/${showId}/lock`, { seats: sel }); setHeld({ until: data.expiresAt }); setLeft(Math.round((data.expiresAt - Date.now()) / 1000)); });
  const release = () => act(async () => { await api.post(`/shows/${showId}/unlock`, { seats: sel }); setHeld(null); setSel([]); });
  const confirm = () => act(async () => { await api.post(`/shows/${showId}/book`, { seats: sel }); nav('/bookings'); });

  const rows = Array.from({ length: show.rows }, (_, r) => String.fromCharCode(65 + r));
  const cls = (s) => booked.has(s) ? 'seat booked' : lockedByOthers.has(s) ? 'seat held' : sel.includes(s) ? 'seat selected' : 'seat';
  return (
    <div className="card seats">
      <div className="screen">SCREEN</div>
      {rows.map((r) => (
        <div className="row" key={r}>
          <span className="rowlabel">{r}</span>
          {Array.from({ length: show.cols }, (_, c) => { const s = `${r}${c + 1}`; return (
            <button key={s} className={cls(s)} disabled={booked.has(s) || lockedByOthers.has(s) || busy} onClick={() => toggle(s)} title={s}>{c + 1}</button>); })}
        </div>
      ))}
      <div className="legend"><span className="seat" /> Free <span className="seat selected" /> Yours <span className="seat held" /> Held <span className="seat booked" /> Booked</div>
      {msg && <p className="error">{msg}</p>}
      <div className="bar">
        <strong>{sel.length ? `${sel.join(', ')} · ₹${sel.length * show.price}` : 'Select up to 6 seats'}</strong>
        {!held ? <button disabled={!sel.length || busy} onClick={hold}>Hold seats</button> : (
          <>
            <span className="timer">Held for {Math.max(left, 0)}s</span>
            <button disabled={busy} onClick={confirm}>Pay ₹{sel.length * show.price} and confirm</button>
            <button className="ghost" disabled={busy} onClick={release}>Release</button>
          </>)}
      </div>
    </div>
  );
}
