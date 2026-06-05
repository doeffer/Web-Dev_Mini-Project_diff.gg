import MatchRow from './MatchRow';

const DDRAGON = 'https://ddragon.leagueoflegends.com';

export default function SummonerCard({ data }) {
  const { account, summoner, ranked, matches } = data;

  const soloQ = ranked.find(e => e.queueType === 'RANKED_SOLO_5x5');

  return (
    <div className="summoner-card">
      <div className="summoner-header">
        <img
          src={`${DDRAGON}/cdn/15.10.1/img/profileicon/${summoner.profileIconId}.png`}
          alt="Profile icon"
          className="profile-icon"
        />
        <div>
          <h2>{account.gameName}<span className="tag">#{account.tagLine}</span></h2>
          <p>Level {summoner.summonerLevel}</p>
          {soloQ && (
            <p className="rank">
              {soloQ.tier} {soloQ.rank} — {soloQ.leaguePoints} LP
              ({soloQ.wins}W / {soloQ.losses}L)
            </p>
          )}
        </div>
      </div>

      <div className="match-list">
        {matches.length === 0
          ? <p>No matches found for this mode.</p>
          : matches.map(match => (
              <MatchRow key={match.metadata.matchId} match={match} puuid={account.puuid} />
            ))}
      </div>
    </div>
  );
}
