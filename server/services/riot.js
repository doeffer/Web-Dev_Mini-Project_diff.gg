const API_KEY = process.env.RIOT_API_KEY?.trim();

const PLATFORM_CONTINENT = {
  euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
  kr: 'asia', jp1: 'asia',
  oc1: 'sea',
};

function continentOf(platform) {
  return PLATFORM_CONTINENT[platform] ?? 'europe';
}

async function riotGet(url, retries = 1) {
  console.log(`[riot] GET ${url}`);
  const res = await fetch(url, { headers: { 'X-Riot-Token': API_KEY } });
  const text = await res.text();
  console.log(`[riot] ${res.status} — ${text.slice(0, 200)}`);

  if (res.status === 429 && retries > 0) {
    const wait = parseInt(res.headers.get('Retry-After') || '1') * 1000;
    console.log(`[riot] rate limited — retrying in ${wait}ms`);
    await new Promise(r => setTimeout(r, wait));
    return riotGet(url, retries - 1);
  }

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

// Core profile fetch — starts from a known PUUID
async function fetchProfileFromPuuid(puuid, region = 'europe', platform = 'euw1', includeMatches = true) {
  const [account, summoner, ranked] = await Promise.all([
    riotGet(`https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`),
    riotGet(`https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`),
    riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`),
  ]);

  if (!includeMatches) return { account, summoner, ranked, matches: [] };

  const matchIds = await riotGet(
    `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=20`
  );

  const matches = await Promise.all(
    matchIds.map(id => riotGet(`https://${region}.api.riotgames.com/lol/match/v5/matches/${id}`))
  );

  return { account, summoner, ranked, matches };
}

// Entry point when searching by Riot ID (gameName#tagLine)
async function getSummonerData(gameName, tagLine, region = 'europe', platform = 'euw1', includeMatches = true) {
  const { puuid } = await riotGet(
    `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
  );
  return fetchProfileFromPuuid(puuid, region, platform, includeMatches);
}

// Entry point when searching by PUUID (from leaderboard)
async function getSummonerDataByPuuid(puuid, region = 'europe', platform = 'euw1', includeMatches = true) {
  return fetchProfileFromPuuid(puuid, region, platform, includeMatches);
}

// Returns all Challenger + Grandmaster entries sorted by LP
async function getTopLeaderboard(platform = 'euw1', queue = 'RANKED_SOLO_5x5') {
  const [challenger, grandmaster] = await Promise.all([
    riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queue}`),
    riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/${queue}`),
  ]);

  return [
    ...challenger.entries.map(e => ({ ...e, tier: 'CHALLENGER' })),
    ...grandmaster.entries.map(e => ({ ...e, tier: 'GRANDMASTER' })),
  ].sort((a, b) => b.leaguePoints - a.leaguePoints);
}

// Returns one page of Master entries (~205 per page) sorted by LP
async function getMasterLeaderboard(page = 1, platform = 'euw1', queue = 'RANKED_SOLO_5x5') {
  const entries = await riotGet(
    `https://${platform}.api.riotgames.com/lol/league/v4/entries/${queue}/MASTER/I?page=${page}`
  );
  return entries
    .map(e => ({ ...e, tier: 'MASTER' }))
    .sort((a, b) => b.leaguePoints - a.leaguePoints);
}

async function getMatches(puuid, region = 'europe', queueId = null, count = 20, start = 0) {
  let url = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?start=${start}&count=${count}`;
  if (queueId) url += `&queue=${queueId}`;
  const matchIds = await riotGet(url);
  return Promise.all(
    matchIds.map(id => riotGet(`https://${region}.api.riotgames.com/lol/match/v5/matches/${id}`))
  );
}

async function getSummonerById(summonerId, platform = 'euw1') {
  return riotGet(
    `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/${encodeURIComponent(summonerId)}`
  );
}

async function getAccountByPuuid(puuid, region = 'europe') {
  return riotGet(
    `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(puuid)}`
  );
}

async function getChampionMastery(puuid, platform = 'euw1') {
  return riotGet(
    `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(puuid)}`
  );
}

const apexLeagueCache = new Map();
const APEX_CACHE_TTL = 3 * 60 * 1000;

async function getApexRank(puuid, queue = 'RANKED_SOLO_5x5', platform = 'euw1') {
  const cacheKey = `${platform}:${queue}`;
  const now = Date.now();
  const cached = apexLeagueCache.get(cacheKey);

  let all;
  if (cached && now - cached.fetchedAt < APEX_CACHE_TTL) {
    all = cached.data;
  } else {
    const [challenger, grandmaster, master] = await Promise.all([
      riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/${queue}`),
      riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/grandmasterleagues/by-queue/${queue}`),
      riotGet(`https://${platform}.api.riotgames.com/lol/league/v4/masterleagues/by-queue/${queue}`),
    ]);
    all = [
      ...challenger.entries.map(e => ({ ...e, tier: 'CHALLENGER' })),
      ...grandmaster.entries.map(e => ({ ...e, tier: 'GRANDMASTER' })),
      ...master.entries.map(e => ({ ...e, tier: 'MASTER' })),
    ].sort((a, b) => b.leaguePoints - a.leaguePoints);
    apexLeagueCache.set(cacheKey, { data: all, fetchedAt: now });
  }

  const idx = all.findIndex(e => e.puuid === puuid);
  if (idx === -1) return null;
  return { rank: idx + 1, tier: all[idx].tier };
}

async function getLiveGame(puuid, platform = 'euw1') {
  try {
    return await riotGet(
      `https://${platform}.api.riotgames.com/lol/spectator/v5/active-games/by-puuid/${encodeURIComponent(puuid)}`
    );
  } catch (err) {
    if (err.status === 404) return null;
    if (err.status === 403) {
      const e = new Error('Spectator data requires a production API key. Development keys do not have access to this endpoint.');
      e.status = 403;
      throw e;
    }
    throw err;
  }
}

module.exports = { getSummonerData, getSummonerDataByPuuid, getTopLeaderboard, getMasterLeaderboard, getAccountByPuuid, getMatches, getSummonerById, getChampionMastery, getLiveGame, getApexRank, continentOf };
