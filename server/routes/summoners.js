const express = require('express');
const { getSummonerData, getSummonerDataByPuuid, getMatches } = require('../services/riot');

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
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/matches  { puuid, region?, queueId? }
router.post('/matches', async (req, res) => {
  const { puuid, region = 'europe', queueId = null } = req.body;
  if (!puuid) return res.status(400).json({ error: 'puuid is required.' });
  try {
    const matches = await getMatches(puuid, region, queueId);
    res.json(matches);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
