import { useState, useEffect } from 'react';
import { getDDVersion, champImgUrl, spellImgUrl, runeImgUrl, getChampionIdMap, getRuneMap, QUEUE_NAMES } from '../utils/gameData';
import { fetchLiveGame } from '../api';

function Img({ src, alt, className }) {
  if (!src) return null;
  return <img src={src} alt={alt} className={className} onError={e => { e.target.style.display = 'none'; }} />;
}

export default function LiveGame({ puuid, platform }) {
  const [game, setGame] = useState(undefined); // undefined = loading, null = not in game
  const [ddVersion, setDDVersion] = useState(null);
  const [champMap, setChampMap] = useState(null);
  const [runeMap, setRuneMap] = useState(null);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    Promise.all([fetchLiveGame(puuid, platform), getDDVersion(), getChampionIdMap(), getRuneMap()])
      .then(([g, ver, cm, rm]) => {
        setGame(g);
        setDDVersion(ver);
        setChampMap(cm);
        setRuneMap(rm);
      })
      .catch(e => {
        if (e.message.includes('production API key')) setUnavailable(true);
        else setError(e.message);
      });
  }, [puuid, platform]);

  if (unavailable) return (
    <p className="live-unavailable">
      Live game data requires a production Riot API key — not available on development keys.
    </p>
  );
  if (error) return <p className="error">{error}</p>;
  if (game === undefined) return <p>Checking live game…</p>;
  if (game === null) return <p className="live-not-in-game">Not currently in a game.</p>;

  const queueName = QUEUE_NAMES[game.gameQueueConfigId] || game.gameMode || 'Unknown Mode';
  const elapsed = game.gameLength > 0
    ? `${Math.floor(game.gameLength / 60)}m ${String(game.gameLength % 60).padStart(2, '0')}s`
    : 'Starting…';

  const blueTeam = (game.participants || []).filter(p => p.teamId === 100);
  const redTeam  = (game.participants || []).filter(p => p.teamId === 200);

  function renderParticipant(p, i) {
    const champ = champMap?.[p.championId];
    const keystone = p.perks?.perkIds?.[0];
    const keystonePath = keystone && runeMap?.[keystone];
    const isMe = p.puuid === puuid;
    const displayName = p.riotId || p.summonerName || 'Unknown';

    return (
      <div key={i} className={`live-player${isMe ? ' live-player-self' : ''}`}>
        <Img
          src={ddVersion && champ ? champImgUrl(champ.id, ddVersion) : null}
          alt={champ?.name}
          className="live-champ-icon"
        />
        <div className="live-spells">
          <Img src={ddVersion ? spellImgUrl(p.spell1Id, ddVersion) : null} alt="" className="live-spell-icon" />
          <Img src={ddVersion ? spellImgUrl(p.spell2Id, ddVersion) : null} alt="" className="live-spell-icon" />
        </div>
        <Img src={keystonePath ? runeImgUrl(keystonePath) : null} alt="" className="live-rune-icon" />
        <span className="live-player-name">{displayName}</span>
      </div>
    );
  }

  return (
    <div className="live-game">
      <div className="live-header">
        <span className="live-mode">{queueName}</span>
        <span className="live-duration">{elapsed}</span>
      </div>
      <div className="live-teams">
        <div className="live-team blue-team">
          <h4>Blue Team</h4>
          {blueTeam.map(renderParticipant)}
        </div>
        <div className="live-team red-team">
          <h4>Red Team</h4>
          {redTeam.map(renderParticipant)}
        </div>
      </div>
    </div>
  );
}
