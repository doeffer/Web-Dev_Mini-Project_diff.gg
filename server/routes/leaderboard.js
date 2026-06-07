const express = require('express');
const { getTopLeaderboard, getMasterLeaderboard, getAccountByPuuid, continentOf, getSummonerById } = require('../services/riot');

const router = express.Router();

// GET /api/leaderboard/top?platform=euw1
router.get('/leaderboard/top', async (req, res) => {
  const platform = req.query.platform || 'euw1';
  const queue    = req.query.queue    || 'RANKED_SOLO_5x5';
  try {
    const entries = await getTopLeaderboard(platform, queue);
    res.json(entries);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/leaderboard/master?platform=euw1&page=1&queue=RANKED_SOLO_5x5
router.get('/leaderboard/master', async (req, res) => {
  const platform = req.query.platform || 'euw1';
  const page     = parseInt(req.query.page) || 1;
  const queue    = req.query.queue    || 'RANKED_SOLO_5x5';
  try {
    const entries = await getMasterLeaderboard(page, platform, queue);
    res.json(entries);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/names  { puuids: string[], region?: string }
// Fetches Riot IDs for a batch of PUUIDs sequentially.
// Returns { [puuid]: { gameName, tagLine } }
router.post('/names', async (req, res) => {
  const { puuids, region = 'europe' } = req.body;
  if (!Array.isArray(puuids) || puuids.length === 0) {
    return res.status(400).json({ error: 'puuids must be a non-empty array.' });
  }

  const result = {};
  for (const puuid of puuids.slice(0, 15)) {
    try {
      const account = await getAccountByPuuid(puuid, region);
      result[puuid] = { gameName: account.gameName, tagLine: account.tagLine };
    } catch {
      result[puuid] = null;
    }
  }
  res.json(result);
});

// GET /api/random-five?platform=euw1
// Returns 5 random Challenger/Grandmaster players as Name#TAG strings
router.get('/random-five', async (req, res) => {
  const platform = req.query.platform || 'euw1';
  const region   = continentOf(platform);
  try {
    const entries  = await getTopLeaderboard(platform);
    const eligible = entries.filter(e => (e.wins + e.losses) >= 50);
    if (eligible.length < 5) return res.status(404).json({ error: 'Not enough eligible players.' });

    // Pick 5 unique random entries
    const shuffled = eligible.sort(() => Math.random() - 0.5).slice(0, 5);

    // Resolve puuids then Riot IDs
    const players = await Promise.all(shuffled.map(async entry => {
      let puuid = entry.puuid;
      if (!puuid) {
        const summoner = await getSummonerById(entry.summonerId, platform);
        puuid = summoner.puuid;
      }
      const account = await getAccountByPuuid(puuid, region);
      return `${account.gameName}#${account.tagLine}`;
    }));

    res.json({ players });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/random?platform=euw1
// Returns a random Challenger/Grandmaster player with 50+ games
router.get('/random', async (req, res) => {
  const platform = req.query.platform || 'euw1';
  try {
    const entries = await getTopLeaderboard(platform);
    const eligible = entries.filter(e => (e.wins + e.losses) >= 50);
    if (eligible.length === 0) return res.status(404).json({ error: 'No eligible players found.' });
    const entry = eligible[Math.floor(Math.random() * eligible.length)];

    // puuid may or may not be present in league entries — fall back to summoner lookup
    let puuid = entry.puuid;
    if (!puuid) {
      const summoner = await getSummonerById(entry.summonerId, platform);
      puuid = summoner.puuid;
    }

    res.json({ puuid, platform });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
