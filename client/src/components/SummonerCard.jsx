import { useState, useEffect } from 'react';
import MatchRow from './MatchRow';
import MatchOverview from './MatchOverview';
import ChampionMastery from './ChampionMastery';
import LiveGame from './LiveGame';
import { getDDVersion } from '../utils/gameData';
import { fetchApexRank } from '../api';

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
      <div className="rank-emblem-wrap">
        <img
          className="rank-emblem"
          src={`${CDRAGON_EMBLEMS}/emblem-${entry.tier.toLowerCase()}.png`}
          alt={tierWord}
          onError={e => { e.target.parentElement.style.display = 'none'; }}
        />
      </div>
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

export default function SummonerCard({ data, platform = 'euw1', activeTab = 'overview', onTabChange, filterSlot }) {
  const { account, summoner, ranked, matches } = data;
  const [ddVersion, setDDVersion] = useState('15.10.1');
  const [masteryMounted, setMasteryMounted] = useState(false);
  const [liveMounted,    setLiveMounted]    = useState(false);
  const [apexRanks, setApexRanks] = useState({});

  useEffect(() => { getDDVersion().then(setDDVersion); }, []);

  useEffect(() => {
    const apexTiers = ['CHALLENGER', 'GRANDMASTER', 'MASTER'];
    const apexEntries = ranked.filter(e => apexTiers.includes(e.tier));
    if (!apexEntries.length) return;
    Promise.all(
      apexEntries.map(e =>
        fetchApexRank(account.puuid, e.queueType, platform)
          .then(result => ({ queueType: e.queueType, result }))
          .catch(() => null)
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { if (r?.result) map[r.queueType] = r.result; });
      setApexRanks(map);
    });
  }, [summoner.id, platform]);
  useEffect(() => {
    if (activeTab === 'mastery') setMasteryMounted(true);
    if (activeTab === 'live')    setLiveMounted(true);
  }, [activeTab]);

  const soloQ = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');
  const flexQ  = ranked.find(e => e.queueType === 'RANKED_FLEX_SR');

  return (
    <div className="summoner-card">
      <div className="profile-row">
        <div className="summoner-header">
          <img
            src={`${DDRAGON}/cdn/${ddVersion}/img/profileicon/${summoner.profileIconId}.png`}
            alt="Profile icon"
            className="profile-icon"
          />
          <div>
            <h2>{account.gameName}<span className="tag">#{account.tagLine}</span></h2>
            <p>Level {summoner.summonerLevel}</p>
            {apexRanks['RANKED_SOLO_5x5'] && <p className="apex-rank">Rank {apexRanks['RANKED_SOLO_5x5'].rank} Solo/Duo</p>}
            {apexRanks['RANKED_FLEX_SR']  && <p className="apex-rank">Rank {apexRanks['RANKED_FLEX_SR'].rank} Flex</p>}
          </div>
        </div>

        <div className="rank-cards">
          <RankCard entry={soloQ} label="Solo / Duo" />
          <RankCard entry={flexQ}  label="Flex" />
        </div>
      </div>

      <div className="profile-tabs">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'mastery',  label: 'Champion Mastery' },
          { key: 'live',     label: 'Live Game' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={activeTab === key ? 'active' : ''}
            onClick={() => onTabChange?.(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {filterSlot}

      {activeTab === 'overview' && (
        <>
          <MatchOverview matches={matches} puuid={account.puuid} />
          <div className="match-list">
            {matches.length === 0
              ? <p>No matches found for this mode.</p>
              : matches.map(match => (
                  <MatchRow key={match.metadata.matchId} match={match} puuid={account.puuid} platform={platform} />
                ))}
          </div>
        </>
      )}

      {masteryMounted && (
        <div style={{ display: activeTab === 'mastery' ? 'block' : 'none' }}>
          <ChampionMastery puuid={account.puuid} platform={platform} />
        </div>
      )}

      {liveMounted && (
        <div style={{ display: activeTab === 'live' ? 'block' : 'none' }}>
          <LiveGame puuid={account.puuid} platform={platform} />
        </div>
      )}
    </div>
  );
}
