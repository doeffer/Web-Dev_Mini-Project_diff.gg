const express = require('express');
const { getSummonerData, getSummonerDataByPuuid, getMatches, getChampionMastery, getLiveGame } = require('../services/riot');

const router = express.Router();

// POST /api/summoner  { gameName, tagLine, region?, platform?, includeMatches? }
//                  or { puuid, region?, platform?, includeMatches? }
router.post('/summoner', async (req, res) => {
  const { gameName, tagLine, puuid, region, platform, includeMatches } = req.body;

  try {
    let data;
    if (puuid) {
      data = await getSummonerDataByPuuid(puuid, region, platform, includeMatches ?? true);
    } else {
      if (!gameName || !tagLine) {
        return res.status(400).json({ error: 'gameName and tagLine are required.' });
      }
      data = await getSummonerData(gameName, tagLine, region, platform, includeMatches ?? true);
    }
    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    const message = status === 404
      ? 'Summoner not found. Check the Riot ID and selected region.'
      : err.message;
    res.status(status).json({ error: message });
  }
});

// POST /api/matches  { puuid, region?, queueId? }
router.post('/matches', async (req, res) => {
  const { puuid, region = 'europe', queueId = null, start = 0 } = req.body;
  if (!puuid) return res.status(400).json({ error: 'puuid is required.' });
  try {
    const matches = await getMatches(puuid, region, queueId, 20, start);
    res.json(matches);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/mastery?puuid=&platform=
router.get('/mastery', async (req, res) => {
  const { puuid, platform = 'euw1' } = req.query;
  if (!puuid) return res.status(400).json({ error: 'puuid is required.' });
  try {
    const mastery = await getChampionMastery(puuid, platform);
    res.json(mastery);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// GET /api/live?puuid=&platform=
router.get('/live', async (req, res) => {
  const { puuid, platform = 'euw1' } = req.query;
  if (!puuid) return res.status(400).json({ error: 'puuid is required.' });
  try {
    const game = await getLiveGame(puuid, platform);
    res.json(game); // null when not in a game
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
