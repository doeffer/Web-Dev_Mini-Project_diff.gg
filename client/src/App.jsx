import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import TeamsPage from './pages/TeamsPage';
import LeaderboardPage from './pages/LeaderboardPage';

function Nav() {
  return (
    <nav>
      <NavLink to="/" className="nav-brand">soerby.gg</NavLink>
      <div className="nav-links">
        <NavLink to="/" end>Search</NavLink>
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
