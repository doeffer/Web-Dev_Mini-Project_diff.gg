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
      src={src}
      alt={alt || ''}
      className={className}
      onError={e => { e.target.style.visibility = 'hidden'; }}
    />
  );
}

export default function MatchRow({ match, puuid, platform = 'euw1' }) {
  const [ddVersion, setDDVersion] = useState(null);
  const [runeMap, setRuneMap]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDDVersion().then(setDDVersion);
    getRuneMap().then(setRuneMap);
  }, []);

  const me = match.info.participants.find(p => p.puuid === puuid);
  if (!me) return null;

  const queueId   = match.info.queueId;
  const queueName = QUEUE_NAMES[queueId] || `Mode ${queueId}`;
  const duration  = formatDuration(match.info.gameDuration);
  const playedAt  = timeAgo(match.info.gameCreation);

  const cs        = me.totalMinionsKilled + me.neutralMinionsKilled;
  const damage    = me.totalDamageDealtToChampions.toLocaleString();
  const kdaRatio  = ((me.kills + me.assists) / Math.max(me.deaths, 1)).toFixed(2);

  const items     = [me.item0, me.item1, me.item2, me.item3, me.item4, me.item5];
  const trinket   = me.item6;

  const keystoneId = me.perks?.styles?.[0]?.selections?.[0]?.perk;
  const secStyleId = me.perks?.styles?.[1]?.style;

  const blue = match.info.participants.filter(p => p.teamId === 100);
  const red  = match.info.participants.filter(p => p.teamId === 200);

  return (
    <div className={`match-row ${me.win ? 'win' : 'loss'}`}>

      {/* ── Header ── */}
      <div className="match-header">
        <span className={`match-result-badge ${me.win ? 'win' : 'loss'}`}>
          {me.win ? 'WIN' : 'LOSS'}
        </span>
        <span className="match-queue">{queueName}</span>
        <span className="match-meta">{playedAt}</span>
        <span className="match-meta">{duration}</span>
      </div>

      {/* ── Player section ── */}
      <div className="match-player">

        <div className="match-champ-block">
          <Img
            src={ddVersion ? champImgUrl(me.championName, ddVersion) : null}
            alt={me.championName}
            className="match-champ-icon"
          />
          <span className="champ-level">{me.champLevel}</span>
        </div>

        <div className="match-spells-runes">
          <div className="match-spells">
            <Img src={ddVersion ? spellImgUrl(me.summoner1Id, ddVersion) : null} className="spell-icon" />
            <Img src={ddVersion ? spellImgUrl(me.summoner2Id, ddVersion) : null} className="spell-icon" />
          </div>
          <div className="match-runes">
            <Img
              src={runeMap && keystoneId ? runeImgUrl(runeMap[keystoneId]) : null}
              className="rune-icon keystone"
            />
            <Img
              src={runeMap && secStyleId ? runeImgUrl(runeMap[secStyleId]) : null}
              className="rune-icon secondary"
            />
          </div>
        </div>

        <div className="match-stats">
          <div className="match-kda-score">
            <span className="kda-numbers">{me.kills} / <span className="deaths">{me.deaths}</span> / {me.assists}</span>
            <span className="kda-ratio">{kdaRatio} KDA</span>
          </div>
          <div className="match-secondary-stats">
            <span>CS {cs}</span>
            <span>{damage} dmg</span>
          </div>
        </div>

        <div className="match-items">
          {items.map((id, i) => (
            <Img
              key={i}
              src={ddVersion && id ? itemImgUrl(id, ddVersion) : null}
              className="item-icon"
            />
          ))}
          <div className="item-divider" />
          <Img
            src={ddVersion && trinket ? itemImgUrl(trinket, ddVersion) : null}
            className="item-icon trinket"
          />
        </div>
      </div>

      {/* ── Teams overview ── */}
      <div className="match-teams">
        <div className="team-col blue-team">
          {blue.map(p => (
            <div key={p.puuid} className={`team-member ${p.puuid === puuid ? 'you' : ''}`}>
              <Img
                src={ddVersion ? champImgUrl(p.championName, ddVersion) : null}
                className="team-champ-icon"
              />
              <span
                className={`team-champ-name ${p.puuid !== puuid ? 'clickable' : ''}`}
                onClick={() => p.puuid !== puuid && navigate(`/?puuid=${encodeURIComponent(p.puuid)}&platform=${platform}`)}
              >
                {p.riotIdGameName
                  ? `${p.riotIdGameName}#${p.riotIdTagline}`
                  : p.summonerName || p.championName}
              </span>
            </div>
          ))}
        </div>
        <div className="team-col red-team">
          {red.map(p => (
            <div key={p.puuid} className={`team-member ${p.puuid === puuid ? 'you' : ''}`}>
              <Img
                src={ddVersion ? champImgUrl(p.championName, ddVersion) : null}
                className="team-champ-icon"
              />
              <span
                className={`team-champ-name ${p.puuid !== puuid ? 'clickable' : ''}`}
                onClick={() => p.puuid !== puuid && navigate(`/?puuid=${encodeURIComponent(p.puuid)}&platform=${platform}`)}
              >
                {p.riotIdGameName
                  ? `${p.riotIdGameName}#${p.riotIdTagline}`
                  : p.summonerName || p.championName}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
