import { useState, useEffect } from 'react';
import MatchRow from './MatchRow';
import { getDDVersion } from '../utils/gameData';

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const CDRAGON_EMBLEMS = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem';

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function RankCard({ entry, label }) {
  if (!entry) {
    return (
      <div className="rank-card unranked">
        <div className="rank-queue-label">{label}</div>
        <div className="rank-tier-name">Unranked</div>
      </div>
    );
  }

  const winRate = Math.round((entry.wins / (entry.wins + entry.losses)) * 100);
  const tierWord = capitalize(entry.tier);

  return (
    <div className="rank-card">
      <img
        className="rank-emblem"
        src={`${CDRAGON_EMBLEMS}/emblem-${entry.tier.toLowerCase()}.png`}
        alt={tierWord}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <div className="rank-details">
        <div className="rank-queue-label">{label}</div>
        <div className="rank-tier-name">
          {tierWord} {entry.rank} — {entry.leaguePoints} LP
          {entry.hotStreak && <span className="hot-streak"> Hot Streak</span>}
        </div>
        <div className="rank-record">
          {entry.wins}W / {entry.losses}L &nbsp;({winRate}% WR)
        </div>
      </div>
    </div>
  );
}

export default function SummonerCard({ data, platform = 'euw1' }) {
  const { account, summoner, ranked, matches } = data;
  const [ddVersion, setDDVersion] = useState('15.10.1');
  useEffect(() => { getDDVersion().then(setDDVersion); }, []);

  const soloQ = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');
  const flexQ  = ranked.find(e => e.queueType === 'RANKED_FLEX_SR');

  return (
    <div className="summoner-card">
      <div className="summoner-header">
        <img
          src={`${DDRAGON}/cdn/${ddVersion}/img/profileicon/${summoner.profileIconId}.png`}
          alt="Profile icon"
          className="profile-icon"
        />
        <div>
          <h2>{account.gameName}<span className="tag">#{account.tagLine}</span></h2>
          <p>Level {summoner.summonerLevel}</p>
        </div>
      </div>

      <div className="ranked-section">
        <h3>Ranked</h3>
        <div className="rank-cards">
          <RankCard entry={soloQ} label="Solo / Duo" />
          <RankCard entry={flexQ}  label="Flex" />
        </div>
      </div>

      <div className="match-list">
        {matches.length === 0
          ? <p>No matches found for this mode.</p>
          : matches.map(match => (
              <MatchRow key={match.metadata.matchId} match={match} puuid={account.puuid} platform={platform} />
            ))}
      </div>
    </div>
  );
}
