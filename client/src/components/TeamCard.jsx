import { useState } from 'react';
import { fetchSummoner } from '../api';

const ROLE_LABELS = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  bot: 'Bot',
  support: 'Support',
};

const TIERS = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND'];
const DIVISIONS = ['IV', 'III', 'II', 'I'];

function rankToNumber(tier, rank) {
  if (!tier) return 0;
  if (tier === 'MASTER')      return 29;
  if (tier === 'GRANDMASTER') return 30;
  if (tier === 'CHALLENGER')  return 31;
  const ti = TIERS.indexOf(tier);
  const di = DIVISIONS.indexOf(rank);
  return ti === -1 ? 0 : ti * 4 + (di === -1 ? 0 : di) + 1;
}

function numberToRank(num) {
  if (num <= 0)  return 'Unranked';
  if (num >= 31) return 'Challenger';
  if (num >= 30) return 'Grandmaster';
  if (num >= 29) return 'Master';
  const tier = TIERS[Math.floor((num - 1) / 4)];
  const div  = DIVISIONS[(num - 1) % 4];
  return `${tier.charAt(0) + tier.slice(1).toLowerCase()} ${div}`;
}

function computeAvgRank(players) {
  const mainRoles = ['top', 'jungle', 'mid', 'bot', 'support'];
  const nums = mainRoles.map(role => {
    const result = players[role];
    if (!result?.ok) return 0;
    const soloQ = result.data.ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');
    const flexQ = result.data.ranked.find(e => e.queueType === 'RANKED_FLEX_SR');
    const entry = soloQ || flexQ;
    return entry ? rankToNumber(entry.tier, entry.rank) : 0;
  });
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return numberToRank(Math.round(avg));
}

export default function TeamCard({ team, onDelete }) {
  const [players, setPlayers] = useState({});
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadPlayers() {
    setLoading(true);
    const { top, jungle, mid, bot, support, substitute } = team.roster;
    const slots = [
      { role: 'top',     riotId: top },
      { role: 'jungle',  riotId: jungle },
      { role: 'mid',     riotId: mid },
      { role: 'bot',     riotId: bot },
      { role: 'support', riotId: support },
    ];
    if (substitute) slots.push({ role: `sub (${ROLE_LABELS[substitute.role] ?? substitute.role})`, riotId: substitute.riotId });

    const results = {};
    for (const { role, riotId } of slots) {
      const [gameName, tagLine] = riotId.split('#');
      try {
        const data = await fetchSummoner(gameName, tagLine, team.continent, team.platform, false);
        results[role] = { ok: true, data };
      } catch {
        results[role] = { ok: false, riotId };
      }
    }
    setPlayers(results);
    setLoaded(true);
    setLoading(false);
  }

  const mainRoles = ['top', 'jungle', 'mid', 'bot', 'support'];
  const avgRank = loaded ? computeAvgRank(players) : null;

  return (
    <div className="team-card">
      <div className="team-header">
        {team.logoUrl && (
          <img src={team.logoUrl} alt={team.name} className="team-logo" onError={e => { e.target.style.display = 'none'; }} />
        )}
        <div className="team-title">
          <h2>{team.name}</h2>
          <span className="team-region">{team.region}</span>
          {avgRank && <span className="team-avg-rank">Avg: {avgRank}</span>}
        </div>
        <div className="team-actions">
          {!loaded && (
            <button onClick={loadPlayers} disabled={loading}>
              {loading ? 'Loading…' : 'Load players'}
            </button>
          )}
          {onDelete && (
            <button className="delete-btn" onClick={() => onDelete(team.id)}>Remove</button>
          )}
        </div>
      </div>

      <div className="team-roster">
        {mainRoles.map(role => {
          const riotId = team.roster[role];
          const result = players[role];
          return (
            <div key={role} className="roster-row">
              <span className="roster-role">{ROLE_LABELS[role]}</span>
              <span className="roster-name">
                {result
                  ? result.ok
                    ? (() => {
                        const { account, summoner, ranked } = result.data;
                        const soloQ = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');
                        const rankStr = soloQ ? `${soloQ.tier} ${soloQ.rank} ${soloQ.leaguePoints}LP` : 'Unranked';
                        return `${account.gameName}#${account.tagLine} — Lvl ${summoner.summonerLevel} — ${rankStr}`;
                      })()
                    : `${result.riotId} — not found`
                  : riotId}
              </span>
            </div>
          );
        })}

        {team.roster.substitute && (() => {
          const { riotId, role } = team.roster.substitute;
          const subKey = `sub (${ROLE_LABELS[role] ?? role})`;
          const result = players[subKey];
          return (
            <div className="roster-row roster-sub">
              <span className="roster-role">Sub ({ROLE_LABELS[role] ?? role})</span>
              <span className="roster-name">
                {result
                  ? result.ok
                    ? (() => {
                        const { account, summoner, ranked } = result.data;
                        const soloQ = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');
                        const rankStr = soloQ ? `${soloQ.tier} ${soloQ.rank} ${soloQ.leaguePoints}LP` : 'Unranked';
                        return `${account.gameName}#${account.tagLine} — Lvl ${summoner.summonerLevel} — ${rankStr}`;
                      })()
                    : `${result.riotId} — not found`
                  : riotId}
              </span>
            </div>
          );
        })()}

        {team.roster.coach && (
          <div className="roster-row roster-coach">
            <span className="roster-role">Coach</span>
            <span className="roster-name">{team.roster.coach}</span>
          </div>
        )}
      </div>
    </div>
  );
}
