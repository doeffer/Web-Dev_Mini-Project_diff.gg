import { useState } from 'react';
import { fetchSummoner } from '../api';

export default function TeamCard({ team }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadPlayers() {
    setLoading(true);
    const results = await Promise.allSettled(
      team.players.map(id => {
        const [gameName, tagLine] = id.split('#');
        return fetchSummoner(gameName, tagLine);
      })
    );
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
          {players.map((result, i) => (
            <li key={team.players[i]}>
              {result.status === 'fulfilled'
                ? `${result.value.account.gameName} — Lvl ${result.value.summoner.summonerLevel}`
                : `${team.players[i]} — not found`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
