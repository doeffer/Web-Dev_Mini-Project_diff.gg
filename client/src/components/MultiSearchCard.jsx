import { useState, useEffect } from 'react';
import { getDDVersion, champImgUrl, getChampionNameMap } from '../utils/gameData';

const DDRAGON = 'https://ddragon.leagueoflegends.com';
const CDRAGON_EMBLEMS = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem';

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function MultiSearchCard({ role, playerData, error, loading, champsPending }) {
  const [ddVersion, setDDVersion] = useState(null);
  const [champNames, setChampNames] = useState(null);
  const [slowChamps, setSlowChamps] = useState(false);

  useEffect(() => {
    getDDVersion().then(setDDVersion);
    getChampionNameMap().then(setChampNames);
  }, []);

  useEffect(() => {
    if (!champsPending) { setSlowChamps(false); return; }
    const t = setTimeout(() => setSlowChamps(true), 8000);
    return () => clearTimeout(t);
  }, [champsPending]);

  if (loading) return (
    <div className="ms-card">
      <div className="ms-card-role">{role}</div>
      <div className="spinner spinner-sm" />
    </div>
  );

  if (error) return (
    <div className="ms-card ms-card-error">
      <div className="ms-card-role">{role}</div>
      <p className="error ms-card-err-msg">{error}</p>
    </div>
  );

  if (!playerData) return (
    <div className="ms-card ms-card-empty">
      <div className="ms-card-role">{role}</div>
      <span className="ms-empty-label">—</span>
    </div>
  );

  const { account, summoner, ranked, champStats } = playerData;
  const soloQ = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');
  const winRate = soloQ ? Math.round((soloQ.wins / (soloQ.wins + soloQ.losses)) * 100) : null;

  return (
    <div className="ms-card">
      <div className="ms-card-role">{role}</div>

      <div className="ms-card-header">
        {ddVersion && (
          <img
            className="ms-profile-icon"
            src={`${DDRAGON}/cdn/${ddVersion}/img/profileicon/${summoner.profileIconId}.png`}
            alt="icon"
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="ms-card-identity">
          <span className="ms-card-name">{account.gameName}</span>
          <span className="ms-card-tag">#{account.tagLine}</span>
          <span className="ms-card-level">Level {summoner.summonerLevel}</span>
        </div>
      </div>

      <div className="ms-card-rank">
        {soloQ ? (
          <>
            <div className="ms-rank-emblem-wrap">
              <img
                className="ms-rank-emblem"
                src={`${CDRAGON_EMBLEMS}/emblem-${soloQ.tier.toLowerCase()}.png`}
                alt={soloQ.tier}
                onError={e => { e.target.parentElement.style.display = 'none'; }}
              />
            </div>
            <div className="ms-rank-info">
              <span className="ms-rank-tier">{capitalize(soloQ.tier)} {soloQ.rank}</span>
              <span className="ms-rank-lp">{soloQ.leaguePoints} LP</span>
              <span className="ms-rank-record">{soloQ.wins}W {soloQ.losses}L · {winRate}%</span>
            </div>
          </>
        ) : (
          <span className="ms-unranked">Unranked</span>
        )}
      </div>

      <div className="ms-champ-list">
        <span className="ms-section-label">Ranked Champions</span>
        {champsPending ? (
          <div className="ms-champs-loading">
            <div className="spinner spinner-sm" style={{ margin: '12px auto' }} />
            {slowChamps && <span className="ms-slow-champs">Waiting on rate limit…</span>}
          </div>
        ) : champStats.length === 0 ? (
          <span className="ms-no-data">No ranked games found</span>
        ) : (
          champStats.map((c, i) => {
            const wr = Math.round((c.wins / c.games) * 100);
            const avgK = (c.kills / c.games).toFixed(1);
            const avgD = (c.deaths / c.games).toFixed(1);
            const avgA = (c.assists / c.games).toFixed(1);
            return (
              <div key={i} className="ms-champ-row">
                {ddVersion && (
                  <img
                    className="ms-champ-icon"
                    src={champImgUrl(c.champName, ddVersion)}
                    alt={c.champName}
                    data-tooltip={c.champName}
                    onError={e => { e.target.style.visibility = 'hidden'; }}
                  />
                )}
                <div className="ms-champ-info">
                  <span className="ms-champ-name">{champNames?.[c.champName] ?? c.champName}</span>
                  <span className="ms-champ-stats">
                    <span className={wr >= 50 ? 'ms-wr-good' : 'ms-wr-bad'}>{wr}%</span>
                    {' · '}{c.games}G
                    {' · '}{avgK}/<span className="deaths">{avgD}</span>/{avgA}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
