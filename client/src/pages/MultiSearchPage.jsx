import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchSummoner, fetchMatches, fetchRandomFive } from '../api';
import MultiSearchCard from '../components/MultiSearchCard';
import { PLATFORMS } from '../utils/constants';

const ROLES = [
  { key: 'top',     label: 'Top'     },
  { key: 'jungle',  label: 'Jungle'  },
  { key: 'mid',     label: 'Mid'     },
  { key: 'bot',     label: 'Bot'     },
  { key: 'support', label: 'Support' },
];

function continentOf(platform) {
  return PLATFORMS.find(p => p.value === platform)?.continent ?? 'europe';
}

function formatError(msg) {
  if (!msg) return '';
  if (msg.toLowerCase().includes('rate limit')) return 'Rate limit reached — please wait a moment and try again.';
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

function parseSlot(slot) {
  const trimmed = slot.trim();
  if (!trimmed) return null;
  const idx = trimmed.indexOf('#');
  if (idx === -1) return { error: `"${trimmed}" — use Name#TAG format` };
  const gameName = trimmed.slice(0, idx).trim();
  const tagLine  = trimmed.slice(idx + 1).trim();
  if (!gameName || !tagLine) return { error: `"${trimmed}" — use Name#TAG format` };
  return { gameName, tagLine };
}

function computeChampStats(matches, puuid) {
  const map = {};
  for (const m of matches) {
    const p = m.info.participants.find(p => p.puuid === puuid);
    if (!p) continue;
    const n = p.championName;
    if (!map[n]) map[n] = { champName: n, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    map[n].games++;
    if (p.win) map[n].wins++;
    map[n].kills   += p.kills;
    map[n].deaths  += p.deaths;
    map[n].assists += p.assists;
  }
  return Object.values(map).sort((a, b) => b.games - a.games).slice(0, 7);
}

const FAV_KEY = 'diff-gg-ms-favs';
function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
  catch { return []; }
}

export default function MultiSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [platform,    setPlatform]    = useState('euw1');
  const [players,     setPlayers]     = useState(['', '', '', '', '']);
  const [results,     setResults]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [randomizing, setRandomizing] = useState(false);
  const [formErr,     setFormErr]     = useState(null);
  const [favourites,  setFavourites]  = useState(loadFavs);
  const [saveName,    setSaveName]    = useState('');
  const [showSave,    setShowSave]    = useState(false);

  useEffect(() => {
    const favId = searchParams.get('fav');
    if (!favId) return;
    const fav = loadFavs().find(f => String(f.id) === favId);
    if (!fav) return;
    setPlatform(fav.platform);
    setPlayers(fav.players);
    setSearchParams({}, { replace: true });
    runSearch(fav.players, fav.platform);
  }, []);

  function setPlayer(i, val) {
    setPlayers(ps => ps.map((p, idx) => idx === i ? val : p));
  }

  async function runSearch(slots, plat) {
    setLoading(true);
    setShowSave(false);
    const region = continentOf(plat);

    setResults(slots.map(() => ({ data: null, error: null, pending: true, champsPending: false })));

    // Phase 1 — profiles only (3-4 calls each, fast)
    const profiles = new Array(slots.length).fill(null);
    for (let i = 0; i < slots.length; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 300));

      const parsed = parseSlot(slots[i]);
      if (!parsed) {
        setResults(prev => prev.map((r, idx) =>
          idx === i ? { data: null, error: null, pending: false, champsPending: false } : r
        ));
        continue;
      }
      if (parsed.error) {
        setResults(prev => prev.map((r, idx) =>
          idx === i ? { data: null, error: parsed.error, pending: false, champsPending: false } : r
        ));
        continue;
      }

      try {
        const profile = await fetchSummoner(parsed.gameName, parsed.tagLine, region, plat, false);
        profiles[i] = profile;
        setResults(prev => prev.map((r, idx) =>
          idx === i
            ? { data: { ...profile, champStats: [] }, error: null, pending: false, champsPending: true }
            : r
        ));
      } catch (err) {
        setResults(prev => prev.map((r, idx) =>
          idx === i ? { data: null, error: formatError(err.message), pending: false, champsPending: false } : r
        ));
      }
    }

    // Phase 2 — ranked matches (10 parallel calls each, rate-limit sensitive)
    let first = true;
    for (let i = 0; i < slots.length; i++) {
      if (!profiles[i]) continue;
      if (!first) await new Promise(r => setTimeout(r, 800));
      first = false;

      try {
        const matches    = await fetchMatches(profiles[i].account.puuid, region, 420, 0, 10);
        const champStats = computeChampStats(matches, profiles[i].account.puuid);
        setResults(prev => prev.map((r, idx) =>
          idx === i ? { ...r, data: { ...r.data, champStats }, champsPending: false } : r
        ));
      } catch (err) {
        setResults(prev => prev.map((r, idx) =>
          idx === i ? { ...r, champsPending: false, error: formatError(err.message) } : r
        ));
      }
    }

    setLoading(false);
  }

  async function handleRandom() {
    setRandomizing(true);
    setFormErr(null);
    try {
      const picked = await fetchRandomFive(platform);
      setPlayers(picked);
    } catch (err) {
      setFormErr(formatError(err.message));
    } finally {
      setRandomizing(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (players.every(p => !p.trim())) { setFormErr('Enter at least one player.'); return; }
    setFormErr(null);
    runSearch(players, platform);
  }

  function handleSave() {
    if (!saveName.trim()) return;
    const fav = { id: Date.now(), name: saveName.trim(), platform, players: [...players] };
    const updated = [fav, ...favourites];
    setFavourites(updated);
    localStorage.setItem(FAV_KEY, JSON.stringify(updated));
    setSaveName('');
    setShowSave(false);
  }

  function handleLoadFav(fav) {
    setPlatform(fav.platform);
    setPlayers(fav.players);
    runSearch(fav.players, fav.platform);
  }

  function deleteFav(id) {
    const updated = favourites.filter(f => f.id !== id);
    setFavourites(updated);
    localStorage.setItem(FAV_KEY, JSON.stringify(updated));
  }

  return (
    <main>
      <h1>Multi-Search</h1>

      <div className="ms-top-layout">
        <form className="ms-form" onSubmit={handleSubmit}>
          <div className="ms-form-top">
            <div className="ms-form-region">
              <label>Region</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)}>
                {PLATFORMS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="ms-form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Searching…' : 'Search'}
              </button>
              <button type="button" disabled={loading || randomizing} onClick={handleRandom}>
                {randomizing ? '…' : 'Random'}
              </button>
            </div>
          </div>

          <fieldset className="ms-form-roster">
            <legend>Roster (Riot ID: Name#TAG)</legend>
            {ROLES.map((role, i) => (
              <div key={role.key} className="form-row">
                <label>{role.label}</label>
                <input
                  type="text"
                  placeholder={`${role.label}#TAG`}
                  value={players[i]}
                  onChange={e => setPlayer(i, e.target.value)}
                />
              </div>
            ))}
          </fieldset>

          {formErr && <p className="error">{formErr}</p>}
        </form>

        {favourites.length > 0 && (
          <div className="ms-favourites">
            <h3>Saved Multi-Searches</h3>
            <div className="ms-fav-list">
              {favourites.map(fav => (
                <div key={fav.id} className="ms-fav-item">
                  <button className="ms-fav-load" onClick={() => handleLoadFav(fav)}>
                    <span className="ms-fav-name">{fav.name}</span>
                    <span className="ms-fav-region">{fav.platform.toUpperCase()}</span>
                    <span className="ms-fav-players">
                      {fav.players.filter(Boolean).join(' · ')}
                    </span>
                  </button>
                  <button
                    className="ms-fav-delete"
                    onClick={() => deleteFav(fav.id)}
                    title="Remove"
                  >×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="ms-results-section">
          {!loading && (
            <div className="ms-save-row">
              {showSave ? (
                <div className="ms-save-form">
                  <input
                    type="text"
                    placeholder="Give this search a name…"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
                    autoFocus
                  />
                  <button type="button" onClick={handleSave} disabled={!saveName.trim()}>Save</button>
                  <button type="button" onClick={() => setShowSave(false)}>Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowSave(true)}>★ Save as Favourite</button>
              )}
            </div>
          )}
          <div className="ms-results">
            {results.map((r, i) => (
              <MultiSearchCard
                key={i}
                role={ROLES[i].label}
                playerData={r.data}
                error={r.error}
                loading={r.pending}
                champsPending={r.champsPending}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
