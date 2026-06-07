import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDDVersion, getAugmentMap,
  champImgUrl, itemImgUrl,
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

function ItemRow({ items, ddVersion, size = 'item-icon' }) {
  return (
    <div className="mc-items">
      {items.map((id, i) => (
        <Img key={i} src={ddVersion && id ? itemImgUrl(id, ddVersion) : null} className={size} />
      ))}
    </div>
  );
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function AugmentGrid({ p, augmentMap, iconClass, gridClass = 'mc-spells-runes' }) {
  const ids = [p.playerAugment1, p.playerAugment2, p.playerAugment3, p.playerAugment4]
    .filter(id => id && augmentMap?.[id]);
  if (!ids.length) return null;
  return (
    <div className={gridClass}>
      {ids.map((id, i) => (
        <Img key={i} src={augmentMap[id]} className={iconClass} />
      ))}
    </div>
  );
}

export default function ArenaMatchRow({ match, puuid, platform = 'euw1' }) {
  const [expanded, setExpanded] = useState(false);
  const [ddVersion, setDDVersion] = useState(null);
  const [augmentMap, setAugmentMap] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDDVersion().then(setDDVersion);
    getAugmentMap().then(setAugmentMap);
  }, []);

  const me = match.info.participants.find(p => p.puuid === puuid);
  if (!me) return null;

  const queueName = QUEUE_NAMES[match.info.queueId] || 'Arena';
  const duration  = formatDuration(match.info.gameDuration);
  const playedAt  = timeAgo(match.info.gameCreation);
  const kdaRatio  = ((me.kills + me.assists) / Math.max(me.deaths, 1)).toFixed(2);
  const items     = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5, me.item6];

  // Group participants into subteams, sorted by placement
  const subteamMap = {};
  for (const p of match.info.participants) {
    const id = p.playerSubteamId;
    if (!subteamMap[id]) subteamMap[id] = { id, placement: p.subteamPlacement, players: [] };
    subteamMap[id].players.push(p);
  }
  const subteams = Object.values(subteamMap).sort((a, b) => a.placement - b.placement);
  const totalTeams = subteams.length;
  const myPlacement = me.subteamPlacement;
  const cardClass = me.win ? 'win' : 'loss';
  const maxDmg = Math.max(...match.info.participants.map(p => p.totalDamageDealtToChampions), 1);

  function goToPlayer(p, e) {
    e.stopPropagation();
    navigate(`/?puuid=${encodeURIComponent(p.puuid)}&platform=${platform}`);
  }

  function renderArenaPlayerRow(p) {
    const isMe   = p.puuid === puuid;
    const pItems = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];
    const dmgPct = Math.round((p.totalDamageDealtToChampions / maxDmg) * 100);
    const name   = p.riotIdGameName
      ? `${p.riotIdGameName}#${p.riotIdTagline}`
      : p.summonerName || p.championName;

    return (
      <tr key={p.puuid} className={isMe ? 'detail-row-me' : ''}>
        <td className="detail-champ">
          <Img src={ddVersion ? champImgUrl(p.championName, ddVersion) : null} className="detail-champ-icon" />
          <span className="detail-champ-level">{p.champLevel}</span>
        </td>
        <td className="detail-spells">
          <AugmentGrid p={p} augmentMap={augmentMap} gridClass="detail-augment-grid" iconClass="detail-augment-icon" />
        </td>
        <td className="detail-name">
          {isMe
            ? <span className="detail-name-me">{name}</span>
            : <span className="detail-name-link" onClick={e => goToPlayer(p, e)}>{name}</span>}
        </td>
        <td className="detail-kda">
          {p.kills} / <span className="deaths">{p.deaths}</span> / {p.assists}
        </td>
        <td className="detail-gold">{(p.goldEarned / 1000).toFixed(1)}k</td>
        <td className="detail-dmg">
          <span className="detail-dmg-num">{p.totalDamageDealtToChampions.toLocaleString()}</span>
          <div className="detail-dmg-bar">
            <div className="detail-dmg-fill" style={{ width: `${dmgPct}%` }} />
          </div>
        </td>
        <td className="detail-items">
          <ItemRow items={pItems} ddVersion={ddVersion} size="detail-item-icon" />
        </td>
      </tr>
    );
  }

  return (
    <div className={`match-card ${cardClass}`}>

      {/* ── Compact summary row ── */}
      <div className="match-card-summary" onClick={() => setExpanded(e => !e)}>

        <div className="mc-result">
          <span className={`mc-badge ${cardClass}`}>{ordinal(myPlacement)}</span>
          <span className="mc-queue">{queueName}</span>
          <span className="mc-meta">{playedAt} · {duration}</span>
        </div>

        <div className="mc-champ-block">
          <div className="mc-champ-wrap">
            <Img src={ddVersion ? champImgUrl(me.championName, ddVersion) : null} alt={me.championName} className="mc-champ-icon" />
            <span className="mc-champ-level">{me.champLevel}</span>
          </div>
          <AugmentGrid p={me} augmentMap={augmentMap} iconClass="mc-spell-icon" />
        </div>

        <div className="mc-stats">
          <span className="mc-kda">
            {me.kills} / <span className="deaths">{me.deaths}</span> / {me.assists}
            <span className="mc-kda-ratio">{kdaRatio} KDA</span>
          </span>
          <span className="mc-secondary">{ordinal(myPlacement)} of {totalTeams}</span>
        </div>

        <ItemRow items={items} ddVersion={ddVersion} size="mc-item-icon" />

        {/* Mini view: one row per subteam, sorted by placement */}
        <div className="mc-mini-teams">
          {subteams.map(team => (
            <div key={team.id} className="mc-mini-row">
              {team.players.map(p => (
                <Img key={p.puuid} src={ddVersion ? champImgUrl(p.championName, ddVersion) : null}
                  className={`mc-mini-icon ${p.puuid === puuid ? 'mc-mini-me' : ''}`} />
              ))}
            </div>
          ))}
        </div>

        <span className="mc-chevron">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="match-card-detail">
          <table className="detail-table">
            <tbody>
              {subteams.map((team, idx) => {
                const cls = team.players[0]?.win ? 'win' : 'loss';
                return (
                  <>
                    {idx > 0 && <tr className="arena-team-gap"><td colSpan={7} /></tr>}
                    <tr key={`header-${team.id}`}>
                      <th colSpan={2} className={`detail-team-header detail-team-name ${cls}`}>
                        {ordinal(team.placement)} Place
                      </th>
                      <th className={`detail-team-header ${cls}`}>Player</th>
                      <th className={`detail-team-header ${cls}`}>KDA</th>
                      <th className={`detail-team-header ${cls}`}>Gold</th>
                      <th className={`detail-team-header ${cls}`}>Damage</th>
                      <th className={`detail-team-header ${cls}`}>Items</th>
                    </tr>
                    {team.players.map(p => renderArenaPlayerRow(p))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
