import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboardTop, fetchLeaderboardMaster, fetchNames } from '../api';

const PAGE_SIZE = 500;
const NAME_BATCH = 15;
const BATCH_INTERVAL = 24000;

const PLATFORMS = [
  { value: 'euw1', label: 'EUW'  },
  { value: 'eun1', label: 'EUNE' },
  { value: 'na1',  label: 'NA'   },
  { value: 'kr',   label: 'KR'   },
  { value: 'br1',  label: 'BR'   },
  { value: 'la1',  label: 'LAN'  },
  { value: 'la2',  label: 'LAS'  },
  { value: 'tr1',  label: 'TR'   },
  { value: 'ru',   label: 'RU'   },
  { value: 'jp1',  label: 'JP'   },
  { value: 'oc1',  label: 'OCE'  },
];

// Per-platform cache — survives navigation, cleared on hard refresh
const caches = {};
let lastPlatform = 'euw1';
function getCache(platform) {
  if (!caches[platform]) {
    caches[platform] = {
      entries: [], names: {}, namesLoaded: 0, nameOffset: 0,
      nextBatchTime: 0, displayed: PAGE_SIZE,
      masterPage: 0, hasMore: true, fetched: false,
    };
  }
  return caches[platform];
}

export default function LeaderboardPage() {
  const [platform, setPlatform] = useState(lastPlatform);

  const c = getCache(platform);
  const [entries, setEntries]         = useState(c.entries);
  const [names, setNames]             = useState(c.names);
  const [namesLoaded, setNamesLoaded] = useState(c.namesLoaded);
  const [loadingNames, setLoadingNames] = useState(false);
  const [displayed, setDisplayed]     = useState(c.displayed);
  const [masterPage, setMasterPage]   = useState(c.masterPage);
  const [hasMore, setHasMore]         = useState(c.hasMore);
  const [loading, setLoading]         = useState(!c.fetched);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);

  const entriesRef = useRef(c.entries);
  const timeoutRef = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => { entriesRef.current = entries; }, [entries]);

  // When platform changes: sync all state from that platform's cache
  useEffect(() => {
    const nc = getCache(platform);
    entriesRef.current = nc.entries;
    setEntries(nc.entries);
    setNames(nc.names);
    setNamesLoaded(nc.namesLoaded);
    setDisplayed(nc.displayed);
    setMasterPage(nc.masterPage);
    setHasMore(nc.hasMore);
    setLoading(!nc.fetched);
    setLoadingNames(false);
    setError(null);
  }, [platform]);

  // Initial fetch for this platform
  useEffect(() => {
    const nc = getCache(platform);
    if (nc.fetched) return;
    fetchLeaderboardTop(platform)
      .then(data => {
        nc.entries = data;
        nc.fetched = true;
        entriesRef.current = data;
        setEntries(data);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [platform]);

  // Name auto-loader — resumes from cached offset, respects persisted timer
  useEffect(() => {
    if (entriesRef.current.length === 0) return;
    const nc = getCache(platform);
    if (nc.nameOffset >= entriesRef.current.length) return;

    let cancelled = false;

    async function loadBatch() {
      if (cancelled) return;
      const offset = nc.nameOffset;
      if (offset >= entriesRef.current.length) return;

      const batch = entriesRef.current
        .slice(offset, offset + NAME_BATCH)
        .map(e => e.puuid)
        .filter(Boolean);

      if (batch.length === 0) return;

      nc.nextBatchTime = Date.now() + BATCH_INTERVAL;
      setLoadingNames(true);

      try {
        const result = await fetchNames(batch);
        if (!cancelled) {
          nc.names = { ...nc.names, ...result };
          nc.nameOffset += batch.length;
          nc.namesLoaded = nc.nameOffset;
          setNames({ ...nc.names });
          setNamesLoaded(nc.namesLoaded);
        }
      } catch {}

      if (!cancelled) setLoadingNames(false);
      if (!cancelled && nc.nameOffset < entriesRef.current.length) {
        const nextIn = Math.max(0, nc.nextBatchTime - Date.now());
        timeoutRef.current = setTimeout(loadBatch, nextIn);
      }
    }

    const initialDelay = Math.max(0, nc.nextBatchTime - Date.now());
    timeoutRef.current = setTimeout(loadBatch, initialDelay);
    return () => { cancelled = true; clearTimeout(timeoutRef.current); };
  }, [platform, entries.length > 0]);

  async function loadMore() {
    const nc = getCache(platform);
    if (displayed < entries.length) {
      nc.displayed += PAGE_SIZE;
      setDisplayed(nc.displayed);
      return;
    }
    setLoadingMore(true);
    try {
      const nextPage = masterPage + 1;
      const newEntries = await fetchLeaderboardMaster(platform, nextPage);
      if (newEntries.length === 0) {
        nc.hasMore = false;
        setHasMore(false);
      } else {
        nc.entries = [...nc.entries, ...newEntries];
        nc.masterPage = nextPage;
        nc.displayed += PAGE_SIZE;
        entriesRef.current = nc.entries;
        setEntries(nc.entries);
        setMasterPage(nc.masterPage);
        setDisplayed(nc.displayed);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleRowClick(entry) {
    if (!entry.puuid) return;
    navigate(`/?puuid=${encodeURIComponent(entry.puuid)}&platform=${platform}`);
  }

  const winRate    = e => Math.round((e.wins / (e.wins + e.losses)) * 100);
  const displayName = entry => {
    const n = names[entry.puuid];
    if (n) return `${n.gameName}#${n.tagLine}`;
    if (entry.summonerName) return entry.summonerName;
    return '—';
  };

  const regionLabel = PLATFORMS.find(p => p.value === platform)?.label ?? platform.toUpperCase();
  const visible = entries.slice(0, displayed);

  return (
    <main>
      <div className="leaderboard-header">
        <h1>{regionLabel} Leaderboard</h1>
        <select value={platform} onChange={e => { lastPlatform = e.target.value; setPlatform(e.target.value); }}>
          {PLATFORMS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading leaderboard…</p>}
      {error   && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
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
        </>
      )}
    </main>
  );
}
