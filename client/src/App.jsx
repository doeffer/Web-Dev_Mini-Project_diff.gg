import { useState, useEffect } from 'react';
import { initTooltips } from './utils/tooltipManager';

const HISTORY_KEY = 'diffgg_search_history';
if (!localStorage.getItem(HISTORY_KEY)) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify([
    { gameName: 'Hide on bush', tagLine: 'KR1',   platform: 'kr',   puuid: null, timestamp: Date.now() - 1000 * 60 * 5  },
    { gameName: 'Vyo',          tagLine: 'LAN1',  platform: 'la1',  puuid: null, timestamp: Date.now() - 1000 * 60 * 20 },
    { gameName: 'kceb',         tagLine: '2626',  platform: 'euw1', puuid: null, timestamp: Date.now() - 1000 * 60 * 45 },
    { gameName: 'TWTV DETDERT', tagLine: '12MAJ', platform: 'euw1', puuid: null, timestamp: Date.now() - 1000 * 60 * 90 },
  ]));
}

const MS_FAV_KEY = 'diff-gg-ms-favs';
if (!localStorage.getItem(MS_FAV_KEY)) {
  localStorage.setItem(MS_FAV_KEY, JSON.stringify([
    {
      id: 1,
      name: 'Sørby Chamoy',
      platform: 'euw1',
      players: ['Komfuret#EUW', 'Fryseren#Mango', 'Lasopp#Mango', 'døffer#1111', 'cat burger#6350'],
    },
  ]));
}
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import MultiSearchPage from './pages/MultiSearchPage';
import LeaderboardPage from './pages/LeaderboardPage';
import { SearchProvider, useSearchContext } from './context/SearchContext';
import { PLATFORMS } from './utils/constants';
import { fetchRandomPlayer } from './api';

function Nav() {
  const { hasSearched, lastPlatform, setLastPlatform } = useSearchContext();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [input,       setInput]       = useState('');
  const [randomizing, setRandomizing] = useState(false);

  const heroShowing = location.pathname === '/' && !hasSearched;

  function handleHome(e) {
    e.preventDefault();
    navigate(`/?reset=${Date.now()}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    navigate(`/?riotId=${encodeURIComponent(trimmed)}&platform=${lastPlatform}`);
    setInput('');
  }

  async function handleRandom() {
    setRandomizing(true);
    try {
      const { puuid, platform } = await fetchRandomPlayer(lastPlatform);
      navigate(`/?puuid=${encodeURIComponent(puuid)}&platform=${platform}`);
    } catch {}
    finally { setRandomizing(false); }
  }

  return (
    <nav className={!heroShowing ? 'nav-expanded' : ''}>
      <a href="/" className="nav-brand" onClick={handleHome}>diff.gg</a>
      {!heroShowing && (
        <form className="nav-search-form" onSubmit={handleSubmit}>
          <select value={lastPlatform} onChange={e => setLastPlatform(e.target.value)}>
            {PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="GameName#TAG"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit">Search</button>
          <button type="button" onClick={handleRandom} disabled={randomizing}>
            {randomizing ? '…' : 'Random'}
          </button>
        </form>
      )}
      <div className="nav-links">
        <NavLink to="/" end onClick={handleHome}>Home</NavLink>
        <NavLink to="/teams">Multi-Search</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </div>
    </nav>
  );
}

export default function App() {
  useEffect(() => { initTooltips(); }, []);

  return (
    <BrowserRouter>
      <SearchProvider>
        <Nav />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/teams" element={<MultiSearchPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}
