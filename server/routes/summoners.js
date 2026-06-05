const express = require('express');
const { getSummonerData } = require('../services/riot');

const router = express.Router();

// POST /api/summoner  { gameName, tagLine }
router.post('/summoner', async (req, res) => {
  const { gameName, tagLine } = req.body;
  if (!gameName || !tagLine) {
    return res.status(400).json({ error: 'gameName and tagLine are required.' });
  }

  try {
    const data = await getSummonerData(gameName, tagLine);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
