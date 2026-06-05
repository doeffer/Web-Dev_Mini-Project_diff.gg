const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DATA_FILE = path.join(__dirname, '../data/teams.json');

function readTeams() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeTeams(teams) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(teams, null, 2), 'utf8');
}

router.get('/teams', (_req, res) => {
  res.json(readTeams());
});

router.post('/teams', (req, res) => {
  const { name, region, platform, continent, logoUrl, roster } = req.body;
  if (!name?.trim() || !platform || !continent || !roster) {
    return res.status(400).json({ error: 'name, platform, continent, and roster are required.' });
  }
  const ROLES = ['top', 'jungle', 'mid', 'bot', 'support'];
  for (const role of ROLES) {
    if (!roster[role]?.trim()) {
      return res.status(400).json({ error: `Roster slot "${role}" is required.` });
    }
  }
  const team = {
    id: String(Date.now()),
    name: name.trim(),
    region,
    platform,
    continent,
    logoUrl: logoUrl?.trim() || '',
    roster: {
      top:        roster.top.trim(),
      jungle:     roster.jungle.trim(),
      mid:        roster.mid.trim(),
      bot:        roster.bot.trim(),
      support:    roster.support.trim(),
      substitute: roster.substitute
        ? { riotId: roster.substitute.riotId.trim(), role: roster.substitute.role }
        : null,
      coach: roster.coach?.trim() || null,
    },
  };
  const teams = readTeams();
  teams.push(team);
  writeTeams(teams);
  res.status(201).json(team);
});

router.delete('/teams/:id', (req, res) => {
  const teams = readTeams();
  const filtered = teams.filter(t => t.id !== req.params.id);
  if (filtered.length === teams.length) {
    return res.status(404).json({ error: 'Team not found.' });
  }
  writeTeams(filtered);
  res.json({ ok: true });
});

module.exports = router;
