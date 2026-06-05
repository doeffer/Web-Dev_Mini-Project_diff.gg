const API_KEY = process.env.RIOT_API_KEY?.trim();

async function riotGet(url) {
  console.log(`[riot] GET ${url}`);
  const res = await fetch(url, { headers: { 'X-Riot-Token': API_KEY } });
  const text = await res.text();
  console.log(`[riot] ${res.status} — ${text.slice(0, 200)}`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const err = new Error(`Riot API returned non-JSON (HTTP ${res.status})`);
    err.status = res.status;
    throw err;
  }

  if (!res.ok) {
    const message = data?.status?.message || `Riot API error (HTTP ${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

async function getSummonerData(gameName, tagLine) {
  // 1. PUUID
  const account = await riotGet(
    `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );

  // 2. Summoner profile (level, iconId, summonerId)
  const summoner = await riotGet(
    `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`
  );

  // 3. Ranked data
  const ranked = await riotGet(
    `https://euw1.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`
  );

  // 4. Last 5 match IDs
  const matchIds = await riotGet(
    `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(account.puuid)}/ids?count=5`
  );

  // 5. Match details
  const matches = await Promise.all(
    matchIds.map(id =>
      riotGet(`https://europe.api.riotgames.com/lol/match/v5/matches/${id}`)
    )
  );

  return { account, summoner, ranked, matches };
}

module.exports = { getSummonerData };
