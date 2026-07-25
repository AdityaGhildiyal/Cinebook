import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Auth from './pages/Auth.jsx';
import Movies from './pages/Movies.jsx';
import Movie from './pages/Movie.jsx';
import Bookings from './pages/Bookings.jsx';

const Private = ({ children }) => (useAuth().user ? children : <Navigate to="/login" replace />);

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="nav">
        <Link to="/" className="brand">CineBook</Link>
        <nav>
          {user ? (<><Link to="/bookings">My bookings</Link><span className="muted">{user.name}</span><button className="ghost" onClick={logout}>Logout</button></>) : <Link to="/login">Login</Link>}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Private><Movies /></Private>} />
          <Route path="/movie/:id" element={<Private><Movie /></Private>} />
          <Route path="/bookings" element={<Private><Bookings /></Private>} />
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
