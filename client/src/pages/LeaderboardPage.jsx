import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboardTop, fetchLeaderboardMaster, fetchNames } from '../api';

const PAGE_SIZE = 500;
const NAME_BATCH = 15;
const BATCH_INTERVAL = 24000; // 15 req per 24s = 75 req/2min, leaving ~25 as headroom

// Module-level cache — survives navigation, cleared on hard refresh
const cache = {
  entries: [],
  names: {},
  namesLoaded: 0,
  nameOffset: 0,
  nextBatchTime: 0, // absolute ms timestamp — 0 means fire immediately
  displayed: PAGE_SIZE,
  masterPage: 0,
  hasMore: true,
  fetched: false,
};

export default function LeaderboardPage() {
  const [entries, setEntries]       = useState(cache.entries);
  const [names, setNames]           = useState(cache.names);
  const [namesLoaded, setNamesLoaded] = useState(cache.namesLoaded);
  const [loadingNames, setLoadingNames] = useState(false);
  const [displayed, setDisplayed]   = useState(cache.displayed);
  const [masterPage, setMasterPage] = useState(cache.masterPage);
  const [hasMore, setHasMore]       = useState(cache.hasMore);
  const [loading, setLoading]       = useState(!cache.fetched);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState(null);

  const entriesRef = useRef(cache.entries);
  const timeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { entriesRef.current = entries; }, [entries]);

  // Initial fetch — skipped if cache already has data
  useEffect(() => {
    if (cache.fetched) return;
    fetchLeaderboardTop()
      .then(data => {
        cache.entries = data;
        cache.fetched = true;
        setEntries(data);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  // Resume or start name auto-loading, respecting the persisted timer
  useEffect(() => {
    if (entriesRef.current.length === 0) return;
    if (cache.nameOffset >= entriesRef.current.length) return;

    let cancelled = false;

    async function loadBatch() {
      if (cancelled) return;
      const offset = cache.nameOffset;
      if (offset >= entriesRef.current.length) return;

      const batch = entriesRef.current
        .slice(offset, offset + NAME_BATCH)
        .map(e => e.puuid)
        .filter(Boolean);

      if (batch.length === 0) return;

      cache.nextBatchTime = Date.now() + BATCH_INTERVAL;

      setLoadingNames(true);
      try {
        const result = await fetchNames(batch);
        if (!cancelled) {
          cache.names = { ...cache.names, ...result };
          cache.nameOffset += batch.length;
          cache.namesLoaded = cache.nameOffset;
          setNames({ ...cache.names });
          setNamesLoaded(cache.namesLoaded);
        }
      } catch {}
      if (!cancelled) setLoadingNames(false);

      if (!cancelled && cache.nameOffset < entriesRef.current.length) {
        const nextIn = Math.max(0, cache.nextBatchTime - Date.now());
        timeoutRef.current = setTimeout(loadBatch, nextIn);
      }
    }

    const initialDelay = Math.max(0, cache.nextBatchTime - Date.now());
    timeoutRef.current = setTimeout(loadBatch, initialDelay);

    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, [entries.length > 0]);

  async function loadMore() {
    if (displayed < entries.length) {
      cache.displayed += PAGE_SIZE;
      setDisplayed(cache.displayed);
      return;
    }
    setLoadingMore(true);
    try {
      const nextPage = masterPage + 1;
      const newEntries = await fetchLeaderboardMaster('euw1', nextPage);
      if (newEntries.length === 0) {
        cache.hasMore = false;
        setHasMore(false);
      } else {
        cache.entries = [...cache.entries, ...newEntries];
        cache.masterPage = nextPage;
        cache.displayed += PAGE_SIZE;
        setEntries(cache.entries);
        setMasterPage(cache.masterPage);
        setDisplayed(cache.displayed);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleRowClick(entry) {
    if (!entry.puuid) return;
    navigate(`/?puuid=${encodeURIComponent(entry.puuid)}&platform=euw1`);
  }

  const winRate = e => Math.round((e.wins / (e.wins + e.losses)) * 100);

  const displayName = entry => {
    const n = names[entry.puuid];
    if (n) return `${n.gameName}#${n.tagLine}`;
    if (entry.summonerName) return entry.summonerName;
    return '—';
  };

  if (loading) return <main><p>Loading leaderboard…</p></main>;
  if (error)   return <main><p className="error">{error}</p></main>;

  const visible = entries.slice(0, displayed);

  return (
    <main>
      <h1>EUW Leaderboard</h1>
      <div className="leaderboard-meta">
        <span>{entries.length} players</span>
        <span>
          {namesLoaded >= entries.length
            ? `All ${entries.length} names loaded`
            : loadingNames
              ? `Loading names… (${namesLoaded}/${entries.length})`
              : `Names: ${namesLoaded}/${entries.length}`}
        </span>
      </div>

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Tier</th>
            <th>Summoner</th>
            <th>LP</th>
            <th>W / L</th>
            <th>Win %</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((entry, i) => (
            <tr
              key={entry.summonerId}
              className={`tier-${entry.tier.toLowerCase()} ${entry.puuid ? 'clickable' : ''}`}
              onClick={() => handleRowClick(entry)}
            >
              <td>{i + 1}</td>
              <td>{entry.tier}</td>
              <td>{displayName(entry)}</td>
              <td>{entry.leaguePoints} LP</td>
              <td>{entry.wins}W / {entry.losses}L</td>
              <td>{winRate(entry)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {hasMore && displayed >= visible.length && (
        <button onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading…' : 'Load 500 more'}
        </button>
      )}
    </main>
  );
}
