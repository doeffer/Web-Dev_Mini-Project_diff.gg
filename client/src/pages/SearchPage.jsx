import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchSummoner, fetchSummonerByPuuid, fetchMatches, fetchRandomPlayer } from '../api';
import SummonerCard from '../components/SummonerCard';

const PLATFORMS = [
  { value: 'euw1', label: 'EUW',  continent: 'europe'   },
  { value: 'eun1', label: 'EUNE', continent: 'europe'   },
  { value: 'tr1',  label: 'TR',   continent: 'europe'   },
  { value: 'ru',   label: 'RU',   continent: 'europe'   },
  { value: 'na1',  label: 'NA',   continent: 'americas' },
  { value: 'br1',  label: 'BR',   continent: 'americas' },
  { value: 'la1',  label: 'LAN',  continent: 'americas' },
  { value: 'la2',  label: 'LAS',  continent: 'americas' },
  { value: 'kr',   label: 'KR',   continent: 'asia'     },
  { value: 'jp1',  label: 'JP',   continent: 'asia'     },
  { value: 'oc1',  label: 'OCE',  continent: 'sea'      },
];

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
  { label: 'One for All',  queue: 1020 },
  { label: 'Nexus Blitz',  queue: 1300 },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [platform, setPlatform] = useState('euw1');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queueFilter, setQueueFilter] = useState(null);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const profileRef = useRef(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  function applyNewData(result, activeContinent) {
    profileRef.current = { puuid: result.account.puuid, continent: activeContinent };
    setQueueFilter(null);
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
      if (mountedRef.current) applyNewData(result, activeContinent);
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
            applyNewData(result, paramContinent);
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
        applyNewData(result, rContinent);
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
    setMatchesLoading(true);
    try {
      const matches = await fetchMatches(ctx.puuid, ctx.continent, queue);
      if (mountedRef.current) setData(prev => prev ? { ...prev, matches } : null);
    } catch {}
    finally { if (mountedRef.current) setMatchesLoading(false); }
  }

  const isMoreMode = MORE_MODES.some(m => m.queue === queueFilter);

  return (
    <main>
      <h1>soerby.gg</h1>
      <form onSubmit={handleSearch}>
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
          {loading ? 'Searching…' : 'Search'}
        </button>
        <button type="button" onClick={handleRandom} disabled={loading}>
          Random
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {data && (
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
          <SummonerCard data={data} />
        </>
      )}
    </main>
  );
}
