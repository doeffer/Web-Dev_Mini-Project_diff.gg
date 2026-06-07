import { useState, useEffect } from 'react';
import { getDDVersion, champImgUrl, getChampionIdMap, timeAgo } from '../utils/gameData';
import { fetchChampionMastery } from '../api';

export default function ChampionMastery({ puuid, platform }) {
  const [mastery, setMastery] = useState(null);
  const [ddVersion, setDDVersion] = useState(null);
  const [champMap, setChampMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchChampionMastery(puuid, platform), getDDVersion(), getChampionIdMap()])
      .then(([m, ver, cm]) => { setMastery(m); setDDVersion(ver); setChampMap(cm); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [puuid, platform]);

  if (loading) return <div className="spinner" />;
  if (error) return <p className="error">{error}</p>;
  if (!mastery || !champMap) return null;

  const totalPoints = mastery.reduce((s, m) => s + m.championPoints, 0);

  const filtered = filter
    ? mastery.filter(m => champMap[m.championId]?.name.toLowerCase().includes(filter.toLowerCase()))
    : mastery;

  const displayed = showAll ? filtered : filtered.slice(0, 20);

  return (
    <div className="champion-mastery">
      <div className="mastery-header">
        <span className="mastery-total">
          {mastery.length} champions &mdash; {totalPoints.toLocaleString()} total points
        </span>
        <input
          type="text"
          placeholder="Filter champions…"
          value={filter}
          onChange={e => { setFilter(e.target.value); setShowAll(false); }}
          className="mastery-filter"
        />
      </div>

      <div className="mastery-list">
        {displayed.map(m => {
          const champ = champMap[m.championId];
          if (!champ) return null;
          const ptsToNext = m.championPointsUntilNextLevel;
          return (
            <div key={m.championId} className="mastery-row">
              {ddVersion && (
                <img
                  src={champImgUrl(champ.id, ddVersion)}
                  alt={champ.name}
                  data-tooltip={champ.name}
                  className="mastery-champ-icon"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <span className={`mastery-level level-${Math.min(m.championLevel, 10)}`}>
                {m.championLevel}
              </span>
              <div className="mastery-info">
                <span className="mastery-champ-name">{champ.name}</span>
                <span className="mastery-points">{m.championPoints.toLocaleString()} pts</span>
                {ptsToNext > 0 && (
                  <span className="mastery-until-next">{ptsToNext.toLocaleString()} to next</span>
                )}
              </div>
              <span className="mastery-last-played">{timeAgo(m.lastPlayTime)}</span>
              {m.tokensEarned > 0 && (
                <span className="mastery-tokens">{m.tokensEarned} token{m.tokensEarned > 1 ? 's' : ''}</span>
              )}
            </div>
          );
        })}
        {displayed.length === 0 && <p>No champions match that filter.</p>}
      </div>

      {!showAll && filtered.length > 20 && (
        <button onClick={() => setShowAll(true)}>
          Show all {filtered.length} champions
        </button>
      )}
    </div>
  );
}
