const DDRAGON = 'https://ddragon.leagueoflegends.com';

export default function MatchRow({ match, puuid }) {
  const participant = match.info.participants.find(p => p.puuid === puuid);
  if (!participant) return null;

  const won = participant.win;
  const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
  const duration = `${Math.floor(match.info.gameDuration / 60)}m`;

  return (
    <div className={`match-row ${won ? 'win' : 'loss'}`}>
      <img
        src={`${DDRAGON}/cdn/15.10.1/img/champion/${participant.championName}.png`}
        alt={participant.championName}
        className="champion-icon"
      />
      <span className="match-result">{won ? 'W' : 'L'}</span>
      <span className="match-champ">{participant.championName}</span>
      <span className="match-kda">{kda}</span>
      <span className="match-duration">{duration}</span>
    </div>
  );
}
