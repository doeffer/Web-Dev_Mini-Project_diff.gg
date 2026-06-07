import { useState, useEffect } from 'react';
import { getDDVersion, champImgUrl, getChampionNameMap } from '../utils/gameData';

export default function MatchOverview({ matches, puuid }) {
  const [ddVersion, setDDVersion] = useState(null);
  const [champNames, setChampNames] = useState(null);
  useEffect(() => {
    getDDVersion().then(setDDVersion);
    getChampionNameMap().then(setChampNames);
  }, []);

  if (!matches || matches.length === 0) return null;

  // Pull out this player's participant entry from every match
  const participants = matches
    .map(m => m.info.participants.find(p => p.puuid === puuid))
    .filter(Boolean);

  const total  = participants.length;
  const wins   = participants.filter(p => p.win).length;
  const losses = total - wins;
  const winRate = Math.round((wins / total) * 100);

  const totalKills   = participants.reduce((s, p) => s + p.kills,   0);
  const totalDeaths  = participants.reduce((s, p) => s + p.deaths,  0);
  const totalAssists = participants.reduce((s, p) => s + p.assists, 0);
  const avgK = (totalKills   / total).toFixed(1);
  const avgD = (totalDeaths  / total).toFixed(1);
  const avgA = (totalAssists / total).toFixed(1);
  const kdaRatio = ((totalKills + totalAssists) / Math.max(totalDeaths, 1)).toFixed(2);

  // Aggregate per champion
  const champMap = {};
  for (const p of participants) {
    if (!champMap[p.championName])
      champMap[p.championName] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    const c = champMap[p.championName];
    c.games++;
    if (p.win) c.wins++;
    c.kills   += p.kills;
    c.deaths  += p.deaths;
    c.assists += p.assists;
  }

  const top3 = Object.entries(champMap)
    .map(([name, s]) => ({ name, ...s, wr: Math.round((s.wins / s.games) * 100) }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 3);

  return (
    <div className="match-overview">
      <h3>Last {total} games</h3>

      <div className="overview-summary">
        <div className="overview-record">
          <span className="ov-wins">{wins}W</span>
          {' / '}
          <span className="ov-losses">{losses}L</span>
          <span className="ov-winrate">{winRate}% WR</span>
        </div>
        <div className="overview-kda">
          {avgK} / <span className="deaths">{avgD}</span> / {avgA}
          <span className="ov-kda-ratio">{kdaRatio} KDA</span>
        </div>
      </div>

      <div className="overview-champs">
        {top3.map(c => (
          <div key={c.name} className="overview-champ">
            {ddVersion && (
              <img
                src={champImgUrl(c.name, ddVersion)}
                alt={c.name}
                data-tooltip={c.name}
                className="ov-champ-icon"
                onError={e => { e.target.style.visibility = 'hidden'; }}
              />
            )}
            <div className="ov-champ-info">
              <span className="ov-champ-name">{champNames?.[c.name] ?? c.name}</span>
              <span className="ov-champ-games">{c.games} game{c.games > 1 ? 's' : ''}</span>
              <span className={`ov-champ-wr ${c.wr >= 50 ? 'good' : 'bad'}`}>{c.wr}% WR</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
