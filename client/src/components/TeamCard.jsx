import { useState } from 'react';
import { fetchSummoner } from '../api';

export default function TeamCard({ team }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadPlayers() {
    setLoading(true);
    const results = [];
    for (const id of team.players) {
      const [gameName, tagLine] = id.split('#');
      try {
        const data = await fetchSummoner(gameName, tagLine, team.region, team.platform, false);
        results.push({ status: 'fulfilled', value: data });
      } catch (err) {
        results.push({ status: 'rejected', reason: err });
      }
    }
    setPlayers(results);
    setLoaded(true);
    setLoading(false);
  }

  return (
    <div className="team-card">
      <div className="team-header">
        {team.logoUrl && <img src={team.logoUrl} alt={team.name} className="team-logo" />}
        <div>
          <h2>{team.name}</h2>
          <span className="team-tag">{team.tag}</span>
        </div>
        {!loaded && (
          <button onClick={loadPlayers} disabled={loading}>
            {loading ? 'Loading…' : 'Load players'}
          </button>
        )}
      </div>

      {loaded && (
        <ul className="player-list">
          {players.map((result, i) => {
            if (result.status !== 'fulfilled') {
              return <li key={team.players[i]}>{team.players[i]} — not found</li>;
            }
            const { account, summoner, ranked } = result.value;
            const soloQ = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');
            const rankStr = soloQ
              ? `${soloQ.tier} ${soloQ.rank} ${soloQ.leaguePoints}LP`
              : 'Unranked';
            return (
              <li key={team.players[i]}>
                {account.gameName}#{account.tagLine} — Lvl {summoner.summonerLevel} — {rankStr}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
