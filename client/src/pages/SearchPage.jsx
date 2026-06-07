import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchSummoner, fetchSummonerByPuuid, fetchMatches, fetchRandomPlayer } from '../api';
import SummonerCard from '../components/SummonerCard';
import { useSearchContext } from '../context/SearchContext';
import { PLATFORMS } from '../utils/constants';
import { getHistory, addToHistory } from '../utils/searchHistory';

const QUICK_FILTERS = [
  { label: 'All',      queue: null },
  { label: 'Solo/Duo', queue: 420  },
  { label: 'Flex',     queue: 440  },
  { label: 'ARAM',     queue: 450  },
];

const MORE_MODES = [
  { label: 'Normal Draft', queue: 400  },
  { label: 'Normal Blind', queue: 430  },
  { label: 'Quickplay',    queue: 490  },
  { label: 'URF',          queue: 1900 },
  { label: 'Arena',        queue: 1700 },
  { label: 'Arena 3v3',   queue: 1750 },
  { label: 'One for All',  queue: 1020 },
  { label: 'Nexus Blitz',  queue: 1300 },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [platform, _setPlatform] = useState('euw1');
  function setPlatform(val) { _setPlatform(val); setLastPlatform(val); }
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queueFilter, setQueueFilter] = useState(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchOffset, setMatchOffset] = useState(0);
  const [hasMoreMatches, setHasMoreMatches] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [slowLoad, setSlowLoad] = useState(false);

  const { setHasSearched, setLastPlatform } = useSearchContext();
  const navigate = useNavigate();

  const profileRef    = useRef(null);
  const mountedRef    = useRef(true);
  const matchCacheRef = useRef(new Map());
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!loading) { setSlowLoad(false); return; }
    const t = setTimeout(() => setSlowLoad(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (!data && !loading) setHasSearched(false);
  }, [data, loading]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 7000);
    return () => clearTimeout(t);
  }, [error]);

  function formatError(msg) {
    if (!msg) return '';
    if (msg.toLowerCase().includes('rate limit')) return 'Rate limit reached — please wait a moment and try again.';
    return msg.charAt(0).toUpperCase() + msg.slice(1);
  }

  function applyNewData(result, activeContinent, activePlatform) {
    setHasSearched(true);
    addToHistory({
      gameName: result.account.gameName,
      tagLine:  result.account.tagLine,
      platform: activePlatform,
      puuid:    result.account.puuid,
    });
    profileRef.current = { puuid: result.account.puuid, continent: activeContinent };
    matchCacheRef.current = new Map();
    matchCacheRef.current.set(null, {
      matches: result.matches,
      offset: result.matches.length,
      hasMore: result.matches.length >= 20,
    });
    setQueueFilter(null);
    setMatchOffset(result.matches.length);
    setHasMoreMatches(result.matches.length >= 20);
    setActiveTab('overview');
    setData(result);
  }

  async function search(riotId, overridePlatform) {
    const [gameName, tagLine] = riotId.trim().split('#');
    if (!gameName || !tagLine) {
      setError('Enter a valid Riot ID (e.g. PlayerName#EUW)');
      return;
    }
    const activePlatform = overridePlatform ?? platform;
    const activeContinent = PLATFORMS.find(p => p.value === activePlatform)?.continent ?? 'europe';
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const result = await fetchSummoner(gameName, tagLine, activeContinent, activePlatform);
      if (mountedRef.current) applyNewData(result, activeContinent, activePlatform);
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    const puuid = searchParams.get('puuid');
    const paramPlatform = searchParams.get('platform') || 'euw1';
    const riotId = searchParams.get('riotId');

    if (searchParams.get('reset') && !puuid && !riotId) {
      setData(null);
      setError(null);
      setInput('');
      return;
    }

    if (puuid) {
      const paramContinent = PLATFORMS.find(p => p.value === paramPlatform)?.continent ?? 'europe';
      setPlatform(paramPlatform);
      setLoading(true);
      setError(null);
      setData(null);
      fetchSummonerByPuuid(puuid, paramContinent, paramPlatform)
        .then(result => {
          if (mountedRef.current) {
            setInput(`${result.account.gameName}#${result.account.tagLine}`);
            applyNewData(result, paramContinent, paramPlatform);
          }
        })
        .catch(err => { if (mountedRef.current) setError(err.message); })
        .finally(() => { if (mountedRef.current) setLoading(false); });
    } else if (riotId) {
      setInput(riotId);
      search(riotId);
    }
  }, [searchParams]);

  function handleSearch(e) {
    e.preventDefault();
    search(input);
  }

  async function handleRandom() {
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const { puuid, platform: rPlatform } = await fetchRandomPlayer(platform);
      const rContinent = PLATFORMS.find(p => p.value === rPlatform)?.continent ?? 'europe';
      const result = await fetchSummonerByPuuid(puuid, rContinent, rPlatform);
      if (mountedRef.current) {
        setInput(`${result.account.gameName}#${result.account.tagLine}`);
        applyNewData(result, rContinent, rPlatform);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function applyFilter(queue) {
    setQueueFilter(queue);
    const ctx = profileRef.current;
    if (!ctx) return;

    if (matchCacheRef.current.has(queue)) {
      const cached = matchCacheRef.current.get(queue);
      setData(prev => prev ? { ...prev, matches: cached.matches } : null);
      setMatchOffset(cached.offset);
      setHasMoreMatches(cached.hasMore);
      return;
    }

    setMatchesLoading(true);
    try {
      const matches = await fetchMatches(ctx.puuid, ctx.continent, queue, 0);
      if (mountedRef.current) {
        matchCacheRef.current.set(queue, { matches, offset: matches.length, hasMore: matches.length >= 20 });
        setData(prev => prev ? { ...prev, matches } : null);
        setMatchOffset(matches.length);
        setHasMoreMatches(matches.length >= 20);
      }
    } catch {}
    finally { if (mountedRef.current) setMatchesLoading(false); }
  }

  async function loadMoreMatches() {
    const ctx = profileRef.current;
    if (!ctx) return;
    setLoadingMore(true);
    try {
      const newMatches = await fetchMatches(ctx.puuid, ctx.continent, queueFilter, matchOffset);
      if (mountedRef.current) {
        const newOffset  = matchOffset + newMatches.length;
        const newHasMore = newMatches.length >= 20;
        setData(prev => {
          if (!prev) return null;
          const merged = [...prev.matches, ...newMatches];
          matchCacheRef.current.set(queueFilter, { matches: merged, offset: newOffset, hasMore: newHasMore });
          return { ...prev, matches: merged };
        });
        setMatchOffset(newOffset);
        setHasMoreMatches(newHasMore);
      }
    } catch {}
    finally { if (mountedRef.current) setLoadingMore(false); }
  }

  const isMoreMode = MORE_MODES.some(m => m.queue === queueFilter);

  if (!data && !loading) {
    return (
      <main className="search-hero-page">
        <div className="search-hero">
          <h1 className="hero-title">diff.gg</h1>
          <p className="hero-sub">Yet another League of Legends stat site</p>
          <form className="hero-form" onSubmit={handleSearch}>
            <select value={platform} onChange={e => setPlatform(e.target.value)}>
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
            <button type="submit" disabled={loading}>
              {loading ? (slowLoad ? 'Hang tight…' : 'Searching…') : 'Search'}
            </button>
            <button type="button" onClick={handleRandom} disabled={loading}>Random</button>
          </form>
          {error && <p className="error">{formatError(error)}</p>}
          <div className="shortcut-cards">
            <div className="shortcut-card">
              <span className="shortcut-label">Recent Searches</span>
              {getHistory().length === 0
                ? <span className="shortcut-coming">No recent searches</span>
                : getHistory().map(entry => (
                    <button
                      key={entry.puuid}
                      className="history-entry"
                      onClick={() => navigate(`/?puuid=${encodeURIComponent(entry.puuid)}&platform=${entry.platform}`)}
                    >
                      <span className="history-name">{entry.gameName}<span className="history-tag">#{entry.tagLine}</span></span>
                      <span className="history-platform">{PLATFORMS.find(p => p.value === entry.platform)?.label ?? entry.platform}</span>
                    </button>
                  ))
              }
            </div>
            <div className="shortcut-card">
              <span className="shortcut-label">Favourites</span>
              <span className="shortcut-coming">Coming soon</span>
            </div>
            <div className="shortcut-card">
              <span className="shortcut-label">Pro Players</span>
              <span className="shortcut-coming">Coming soon</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      {loading && !data && <div className="spinner" />}
      {slowLoad && !error && <p className="slow-load-msg">Taking a little longer than usual, hang tight…</p>}
      {error && <p className="error">{formatError(error)}</p>}

      {data && (
        <>
          <SummonerCard
            data={data}
            platform={platform}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            filterSlot={activeTab === 'overview' ? (
              <>
                <div className="queue-filters">
                  {QUICK_FILTERS.map(({ label, queue }) => (
                    <button
                      key={label}
                      className={queueFilter === queue ? 'active' : ''}
                      onClick={() => applyFilter(queue)}
                      disabled={matchesLoading}
                    >
                      {label}
                    </button>
                  ))}
                  <select
                    value={isMoreMode ? queueFilter : ''}
                    onChange={e => {
                      const val = e.target.value;
                      if (val !== '') applyFilter(Number(val));
                    }}
                    disabled={matchesLoading}
                    className={isMoreMode ? 'active' : ''}
                  >
                    <option value="">More modes…</option>
                    {MORE_MODES.map(({ label, queue }) => (
                      <option key={queue} value={queue}>{label}</option>
                    ))}
                  </select>
                </div>
                {matchesLoading && <p>Loading matches…</p>}
              </>
            ) : null}
          />
          {activeTab === 'overview' && hasMoreMatches && (
            <button onClick={loadMoreMatches} disabled={loadingMore || matchesLoading}>
              {loadingMore ? 'Loading…' : 'Load 20 more'}
            </button>
          )}
        </>
      )}
    </main>
  );
}
