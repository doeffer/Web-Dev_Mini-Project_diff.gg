import { teams } from '../data/teams';
import TeamCard from '../components/TeamCard';

export default function TeamsPage() {
  return (
    <main>
      <h1>Teams</h1>
      <div className="teams-grid">
        {teams.map(team => (
          <TeamCard key={team.tag} team={team} />
        ))}
      </div>
    </main>
  );
}
