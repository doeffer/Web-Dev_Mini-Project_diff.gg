require('dotenv').config();
const express = require('express');

console.log('API key loaded:', !!process.env.RIOT_API_KEY);
const summonersRouter = require('./routes/summoners');
const leaderboardRouter = require('./routes/leaderboard');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/ping', (_req, res) => res.json({ ok: true }));

app.use('/api', summonersRouter);
app.use('/api', leaderboardRouter);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
