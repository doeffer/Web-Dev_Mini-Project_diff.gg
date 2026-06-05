require('dotenv').config();
const express = require('express');

console.log('API key loaded:', !!process.env.RIOT_API_KEY);
const summonersRouter = require('./routes/summoners');
const leaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// Fetch and cache the latest DDragon version once on startup
let ddVersion = '15.10.1';
fetch('https://ddragon.leagueoflegends.com/api/versions.json')
  .then(r => r.json())
  .then(versions => { ddVersion = versions[0]; console.log(`[ddragon] version: ${ddVersion}`); })
  .catch(() => console.warn('[ddragon] could not fetch version, using fallback'));

app.get('/api/ddragon-version', (_req, res) => res.json({ version: ddVersion }));

app.use('/api', summonersRouter);
app.use('/api', leaderboardRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
