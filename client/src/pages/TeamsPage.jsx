import { useState, useEffect } from 'react';
import TeamCard from '../components/TeamCard';
import { fetchTeams, createTeam, deleteTeam } from '../api';

const PLATFORMS = [
  { value: 'euw1', label: 'EUW',  continent: 'europe'   },
  { value: 'eun1', label: 'EUNE', continent: 'europe'   },
  { value: 'tr1',  label: 'TR',   continent: 'europe'   },
  { value: 'ru',   label: 'RU',   continent: 'europe'   },
  { value: 'na1',  label: 'NA',   continent: 'americas' },
  { value: 'br1',  label: 'BR',   continent: 'americas' },
  { value: 'la1',  label: 'LAN',  continent: 'americas' },
  { value: 'la2',  label: 'LAS',  continent: 'americas' },
  { value: 'kr',   label: 'KR',   continent: 'asia'     },
  { value: 'jp1',  label: 'JP',   continent: 'asia'     },
  { value: 'oc1',  label: 'OCE',  continent: 'sea'      },
];

const ROLES = ['top', 'jungle', 'mid', 'bot', 'support'];
const ROLE_LABELS = { top: 'Top', jungle: 'Jungle', mid: 'Mid', bot: 'Bot', support: 'Support' };

const emptyForm = () => ({
  name: '',
  platform: 'euw1',
  logoUrl: '',
  roster: { top: '', jungle: '', mid: '', bot: '', support: '', coach: '' },
  hasSub: false,
  subRiotId: '',
  subRole: 'top',
});

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function setRosterField(role, value) {
    setForm(f => ({ ...f, roster: { ...f.roster, [role]: value } }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    const p = PLATFORMS.find(p => p.value === form.platform);

    for (const role of ROLES) {
      const val = form.roster[role].trim();
      if (!val) return setFormError(`${ROLE_LABELS[role]} is required.`);
      if (!val.includes('#')) return setFormError(`${ROLE_LABELS[role]}: enter a valid Riot ID (Name#TAG).`);
    }
    if (form.hasSub) {
      if (!form.subRiotId.trim()) return setFormError('Substitute Riot ID is required.');
      if (!form.subRiotId.includes('#')) return setFormError('Substitute: enter a valid Riot ID (Name#TAG).');
    }

    const payload = {
      name: form.name.trim(),
      region: p.label,
      platform: p.value,
      continent: p.continent,
      logoUrl: form.logoUrl.trim(),
      roster: {
        top:     form.roster.top.trim(),
        jungle:  form.roster.jungle.trim(),
        mid:     form.roster.mid.trim(),
        bot:     form.roster.bot.trim(),
        support: form.roster.support.trim(),
        substitute: form.hasSub
          ? { riotId: form.subRiotId.trim(), role: form.subRole }
          : null,
        coach: form.roster.coach.trim() || null,
      },
    };

    setSubmitting(true);
    try {
      const created = await createTeam(payload);
      setTeams(prev => [...prev, created]);
      setForm(emptyForm());
      setShowForm(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTeam(id);
      setTeams(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <main><p>Loading teams…</p></main>;
  if (error)   return <main><p className="error">{error}</p></main>;

  return (
    <main>
      <div className="teams-header">
        <h1>Teams</h1>
        <button onClick={() => { setShowForm(f => !f); setFormError(null); }}>
          {showForm ? 'Cancel' : '+ Add Team'}
        </button>
      </div>

      {showForm && (
        <form className="add-team-form" onSubmit={handleSubmit}>
          <h2>New Team</h2>

          <div className="form-row">
            <label>Team Name *</label>
            <input
              type="text"
              placeholder="Team name"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label>Region *</label>
            <select value={form.platform} onChange={e => setField('platform', e.target.value)}>
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label>Logo URL</label>
            <input
              type="text"
              placeholder="https://… (optional)"
              value={form.logoUrl}
              onChange={e => setField('logoUrl', e.target.value)}
            />
          </div>

          <fieldset className="form-roster">
            <legend>Roster (Riot ID: Name#TAG)</legend>
            {ROLES.map(role => (
              <div key={role} className="form-row">
                <label>{ROLE_LABELS[role]} *</label>
                <input
                  type="text"
                  placeholder={`${ROLE_LABELS[role]}#TAG`}
                  value={form.roster[role]}
                  onChange={e => setRosterField(role, e.target.value)}
                />
              </div>
            ))}
          </fieldset>

          <fieldset className="form-optional">
            <legend>Optional</legend>

            <div className="form-row">
              <label>Coach</label>
              <input
                type="text"
                placeholder="Coach name"
                value={form.roster.coach}
                onChange={e => setRosterField('coach', e.target.value)}
              />
            </div>

            <div className="form-row">
              <label>
                <input
                  type="checkbox"
                  checked={form.hasSub}
                  onChange={e => setField('hasSub', e.target.checked)}
                />
                {' '}Add substitute
              </label>
            </div>

            {form.hasSub && (
              <div className="form-sub-fields">
                <div className="form-row">
                  <label>Sub Riot ID *</label>
                  <input
                    type="text"
                    placeholder="Name#TAG"
                    value={form.subRiotId}
                    onChange={e => setField('subRiotId', e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>Sub Role *</label>
                  <select value={form.subRole} onChange={e => setField('subRole', e.target.value)}>
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </fieldset>

          {formError && <p className="error">{formError}</p>}

          <button type="submit" disabled={submitting || !form.name.trim()}>
            {submitting ? 'Adding…' : 'Add Team'}
          </button>
        </form>
      )}

      <div className="teams-grid">
        {teams.length === 0 && !showForm && <p>No teams yet. Add one above.</p>}
        {teams.map(team => (
          <TeamCard key={team.id} team={team} onDelete={handleDelete} />
        ))}
      </div>
    </main>
  );
}
