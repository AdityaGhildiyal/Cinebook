import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext.jsx';

export default function Auth() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const { data } = await api.post(`/auth/${mode}`, f); login(data); }
    catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
      {mode === 'register' && <input placeholder="Name" value={f.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (min 6 chars)" value={f.password} onChange={set('password')} required minLength={6} />
      {err && <p className="error">{err}</p>}
      <button disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Login' : 'Register'}</button>
      <p className="muted">{mode === 'login' ? 'New here?' : 'Have an account?'}{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Register' : 'Login'}</a></p>
    </form>
  );
}
