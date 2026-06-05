import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDDVersion, getRuneMap,
  champImgUrl, spellImgUrl, itemImgUrl, runeImgUrl,
  QUEUE_NAMES, timeAgo, formatDuration,
} from '../utils/gameData';

function Img({ src, alt, className }) {
  if (!src) return <div className={`${className} img-missing`} />;
  return (
    <img
      src={src} alt={alt || ''} className={className}
      onError={e => { e.target.style.visibility = 'hidden'; }}
    />
  );
}

function ItemRow({ items, trinket, ddVersion, size = 'item-icon' }) {
  return (
    <div className="mc-items">
      {items.map((id, i) => (
        <Img key={i} src={ddVersion && id ? itemImgUrl(id, ddVersion) : null} className={size} />
      ))}
      <div className="item-divider" />
      <Img src={ddVersion && trinket ? itemImgUrl(trinket, ddVersion) : null} className={`${size} trinket`} />
    </div>
  );
}

export default function MatchRow({ match, puuid, platform = 'euw1' }) {
  const [expanded, setExpanded] = useState(false);
  const [ddVersion, setDDVersion] = useState(null);
  const [runeMap, setRuneMap]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDDVersion().then(setDDVersion);
    getRuneMap().then(setRuneMap);
  }, []);

  const me = match.info.participants.find(p => p.puuid === puuid);
  if (!me) return null;

  const queueName  = QUEUE_NAMES[match.info.queueId] || `Mode ${match.info.queueId}`;
  const duration   = formatDuration(match.info.gameDuration);
  const playedAt   = timeAgo(match.info.gameCreation);
  const cs         = me.totalMinionsKilled + me.neutralMinionsKilled;
  const kdaRatio   = ((me.kills + me.assists) / Math.max(me.deaths, 1)).toFixed(2);
  const keystoneId = me.perks?.styles?.[0]?.selections?.[0]?.perk;
  const secStyleId = me.perks?.styles?.[1]?.style;
  const items      = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];

  const blue = match.info.participants.filter(p => p.teamId === 100);
  const red  = match.info.participants.filter(p => p.teamId === 200);

  const maxDmg = Math.max(...match.info.participants.map(p => p.totalDamageDealtToChampions), 1);

  function goToPlayer(p, e) {
    e.stopPropagation();
    navigate(`/?puuid=${encodeURIComponent(p.puuid)}&platform=${platform}`);
  }

  function renderTeamTable(team) {
    return team.map(p => {
      const pCs      = p.totalMinionsKilled + p.neutralMinionsKilled;
      const pKstone  = p.perks?.styles?.[0]?.selections?.[0]?.perk;
      const pSec     = p.perks?.styles?.[1]?.style;
      const pItems   = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];
      const dmgPct   = Math.round((p.totalDamageDealtToChampions / maxDmg) * 100);
      const isMe     = p.puuid === puuid;
      const name     = p.riotIdGameName
        ? `${p.riotIdGameName}#${p.riotIdTagline}`
        : p.summonerName || p.championName;

      return (
        <tr key={p.puuid} className={isMe ? 'detail-row-me' : ''}>
          <td className="detail-champ">
            <Img src={ddVersion ? champImgUrl(p.championName, ddVersion) : null} className="detail-champ-icon" />
            <span className="detail-champ-level">{p.champLevel}</span>
          </td>
          <td className="detail-spells">
            <div className="detail-spells-runes">
              <Img src={ddVersion ? spellImgUrl(p.summoner1Id, ddVersion) : null} className="detail-spell-icon" />
              <Img src={ddVersion ? spellImgUrl(p.summoner2Id, ddVersion) : null} className="detail-spell-icon" />
              <Img src={runeMap && pKstone ? runeImgUrl(runeMap[pKstone]) : null} className="detail-rune-icon" />
              <Img src={runeMap && pSec    ? runeImgUrl(runeMap[pSec])    : null} className="detail-rune-icon" />
            </div>
          </td>
          <td className="detail-name">
            {isMe
              ? <span className="detail-name-me">{name}</span>
              : <span className="detail-name-link" onClick={e => goToPlayer(p, e)}>{name}</span>}
          </td>
          <td className="detail-kda">
            {p.kills} / <span className="deaths">{p.deaths}</span> / {p.assists}
          </td>
          <td className="detail-cs">{pCs}</td>
          <td className="detail-gold">{(p.goldEarned / 1000).toFixed(1)}k</td>
          <td className="detail-dmg">
            <span className="detail-dmg-num">{p.totalDamageDealtToChampions.toLocaleString()}</span>
            <div className="detail-dmg-bar">
              <div className="detail-dmg-fill" style={{ width: `${dmgPct}%` }} />
            </div>
          </td>
          <td className="detail-vision">{p.visionScore}</td>
          <td className="detail-items">
            <ItemRow items={pItems} trinket={p.item6} ddVersion={ddVersion} size="detail-item-icon" />
          </td>
        </tr>
      );
    });
  }

  const blueWin = match.info.teams.find(t => t.teamId === 100)?.win;

  return (
    <div className={`match-card ${me.win ? 'win' : 'loss'}`}>

      {/* ── Compact summary row ── */}
      <div className="match-card-summary" onClick={() => setExpanded(e => !e)}>

        <div className="mc-result">
          <span className={`mc-badge ${me.win ? 'win' : 'loss'}`}>{me.win ? 'WIN' : 'LOSS'}</span>
          <span className="mc-queue">{queueName}</span>
          <span className="mc-meta">{playedAt} · {duration}</span>
        </div>

        <div className="mc-champ-block">
          <div className="mc-champ-wrap">
            <Img src={ddVersion ? champImgUrl(me.championName, ddVersion) : null} alt={me.championName} className="mc-champ-icon" />
            <span className="mc-champ-level">{me.champLevel}</span>
          </div>
          <div className="mc-spells-runes">
            <Img src={ddVersion ? spellImgUrl(me.summoner1Id, ddVersion) : null} className="mc-spell-icon" />
            <Img src={ddVersion ? spellImgUrl(me.summoner2Id, ddVersion) : null} className="mc-spell-icon" />
            <Img src={runeMap && keystoneId ? runeImgUrl(runeMap[keystoneId]) : null} className="mc-rune-icon" />
            <Img src={runeMap && secStyleId  ? runeImgUrl(runeMap[secStyleId])  : null} className="mc-rune-icon" />
          </div>
        </div>

        <div className="mc-stats">
          <span className="mc-kda">
            {me.kills} / <span className="deaths">{me.deaths}</span> / {me.assists}
            <span className="mc-kda-ratio">{kdaRatio} KDA</span>
          </span>
          <span className="mc-secondary">CS {cs} · {me.totalDamageDealtToChampions.toLocaleString()} dmg</span>
        </div>

        <ItemRow items={items} trinket={me.item6} ddVersion={ddVersion} size="mc-item-icon" />

        <div className="mc-mini-teams">
          <div className="mc-mini-row">
            {blue.map(p => (
              <Img key={p.puuid} src={ddVersion ? champImgUrl(p.championName, ddVersion) : null} className={`mc-mini-icon ${p.puuid === puuid ? 'mc-mini-me' : ''}`} />
            ))}
          </div>
          <div className="mc-mini-row">
            {red.map(p => (
              <Img key={p.puuid} src={ddVersion ? champImgUrl(p.championName, ddVersion) : null} className={`mc-mini-icon ${p.puuid === puuid ? 'mc-mini-me' : ''}`} />
            ))}
          </div>
        </div>

        <span className="mc-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="match-card-detail">

          {/* Objectives */}
          <div className="detail-objectives-section">
            {[
              { teamData: match.info.teams.find(t => t.teamId === 100), participants: blue, label: 'Blue', win: blueWin },
              { teamData: match.info.teams.find(t => t.teamId === 200), participants: red,  label: 'Red',  win: !blueWin },
            ].map(({ teamData, participants, label, win }) => {
              if (!teamData) return null;
              const obj = teamData.objectives;
              const totalGold = participants.reduce((s, p) => s + p.goldEarned, 0);
              const stats = [
                `${obj.champion.kills} kills`,
                `${(totalGold / 1000).toFixed(1)}k gold`,
                `${obj.tower.kills} tower${obj.tower.kills !== 1 ? 's' : ''}`,
                `${obj.dragon.kills} dragon${obj.dragon.kills !== 1 ? 's' : ''}`,
                obj.baron.kills > 0      && `${obj.baron.kills} baron${obj.baron.kills !== 1 ? 's' : ''}`,
                obj.riftHerald?.kills > 0 && `${obj.riftHerald.kills} herald${obj.riftHerald.kills !== 1 ? 's' : ''}`,
                obj.horde?.kills > 0      && `${obj.horde.kills} grub${obj.horde.kills !== 1 ? 's' : ''}`,
                obj.atakhan?.kills > 0    && `${obj.atakhan.kills} atakhan`,
              ].filter(Boolean);
              return (
                <div key={label} className={`detail-obj-row ${win ? 'win' : 'loss'}`}>
                  <span className="detail-obj-label">{label} — {win ? 'Victory' : 'Defeat'}</span>
                  <span className="detail-obj-stats">{stats.join(' · ')}</span>
                </div>
              );
            })}
          </div>

          <table className="detail-table">
            <thead>
              <tr>
                <th colSpan={2} className={`detail-team-header ${blueWin ? 'win' : 'loss'}`}>
                  Blue Team
                </th>
                <th>Player</th>
                <th>KDA</th>
                <th>CS</th>
                <th>Gold</th>
                <th>Damage</th>
                <th>Vision</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {renderTeamTable(blue)}
              <tr className="detail-team-divider">
                <td colSpan={9} className={`detail-team-header ${blueWin ? 'loss' : 'win'}`}>
                  Red Team
                </td>
              </tr>
              {renderTeamTable(red)}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
