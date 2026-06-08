import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaderboardTop, fetchLeaderboardMaster, fetchNames } from '../api';
import { PLATFORMS } from '../utils/constants';

const PAGE_SIZE = 500;
const NAME_BATCH = 15;
const BATCH_INTERVAL = 24000;

const QUEUES = [
  { value: 'RANKED_SOLO_5x5', label: 'Solo/Duo' },
  { value: 'RANKED_FLEX_SR',  label: 'Flex'      },
];

const caches = {};
let lastPlatform = 'euw1';
let lastQueue    = 'RANKED_SOLO_5x5';

function getCache(platform, queue) {
  const key = `${platform}:${queue}`;
  if (!caches[key]) {
    caches[key] = {
      entries: [], names: {}, nameOffset: 0,
      nextBatchTime: 0, displayed: PAGE_SIZE,
      masterPage: 0, hasMore: true, fetched: false,
    };
  }
  return caches[key];
}

export default function LeaderboardPage() {
  const [platform, setPlatform] = useState(lastPlatform);
  const [queue,    setQueue]    = useState(lastQueue);

  const c = getCache(platform, queue);
  const [entries, setEntries]         = useState(c.entries);
  const [names, setNames]             = useState(c.names);
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

  useEffect(() => {
    const nc = getCache(platform, queue);
    entriesRef.current = nc.entries;
    setEntries(nc.entries);
    setNames(nc.names);
    setDisplayed(nc.displayed);
    setMasterPage(nc.masterPage);
    setHasMore(nc.hasMore);
    setLoading(!nc.fetched);
    setError(null);
  }, [platform, queue]);

  useEffect(() => {
    const nc = getCache(platform, queue);
    if (nc.fetched) return;
    fetchLeaderboardTop(platform, queue)
      .then(data => {
        nc.entries = data;
        nc.fetched = true;
        entriesRef.current = data;
        setEntries(data);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [platform, queue]);

  useEffect(() => {
    if (entriesRef.current.length === 0) return;
    const nc = getCache(platform, queue);
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

      try {
        const result = await fetchNames(batch);
        if (!cancelled) {
          nc.names = { ...nc.names, ...result };
          nc.nameOffset += batch.length;
          setNames({ ...nc.names });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }

      if (!cancelled && nc.nameOffset < entriesRef.current.length) {
        const nextIn = Math.max(0, nc.nextBatchTime - Date.now());
        timeoutRef.current = setTimeout(loadBatch, nextIn);
      }
    }

    const initialDelay = Math.max(0, nc.nextBatchTime - Date.now());
    timeoutRef.current = setTimeout(loadBatch, initialDelay);
    return () => { cancelled = true; clearTimeout(timeoutRef.current); };
  }, [platform, queue, entries.length > 0]);

  async function loadMore() {
    const nc = getCache(platform, queue);
    if (displayed < entries.length) {
      nc.displayed += PAGE_SIZE;
      setDisplayed(nc.displayed);
      return;
    }
    setLoadingMore(true);
    try {
      const nextPage = masterPage + 1;
      const newEntries = await fetchLeaderboardMaster(platform, nextPage, queue);
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

  function handlePlatformChange(val) { lastPlatform = val; setPlatform(val); }
  function handleQueueChange(val)    { lastQueue    = val; setQueue(val);    }

  const winRate    = e => Math.round((e.wins / (e.wins + e.losses)) * 100);
  const displayName = entry => {
    const n = names[entry.puuid];
    if (n) return `${n.gameName}#${n.tagLine}`;
    return '—';
  };

  const regionLabel = PLATFORMS.find(p => p.value === platform)?.label ?? platform.toUpperCase();
  const queueLabel  = QUEUES.find(q => q.value === queue)?.label ?? 'Solo/Duo';
  const visible = entries.slice(0, displayed);

  return (
    <main>
      <div className="leaderboard-header">
        <h1>{regionLabel} {queueLabel} Leaderboard</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={queue} onChange={e => handleQueueChange(e.target.value)}>
            {QUEUES.map(q => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
          <select value={platform} onChange={e => handlePlatformChange(e.target.value)}>
            {PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="spinner" />}
      {error   && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
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
