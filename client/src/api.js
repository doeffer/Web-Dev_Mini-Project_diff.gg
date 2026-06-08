export async function fetchNames(puuids, region = 'europe') {
  const res = await fetch('/api/names', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puuids, region }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch names.');
  return data;
}

export async function fetchRandomFive(platform = 'euw1') {
  const res = await fetch(`/api/random-five?platform=${platform}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to find random players.');
  return data.players; // string[]
}

export async function fetchRandomPlayer(platform = 'euw1') {
  const res = await fetch(`/api/random?platform=${platform}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to find a random player.');
  return data; // { puuid, platform }
}

export async function fetchLeaderboardTop(platform = 'euw1', queue = 'RANKED_SOLO_5x5') {
  const res = await fetch(`/api/leaderboard/top?platform=${platform}&queue=${queue}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard.');
  return data;
}

export async function fetchLeaderboardMaster(platform = 'euw1', page = 1, queue = 'RANKED_SOLO_5x5') {
  const res = await fetch(`/api/leaderboard/master?platform=${platform}&page=${page}&queue=${queue}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load master entries.');
  return data;
}

async function postSummoner(body) {
  const res = await fetch('/api/summoner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export function fetchSummoner(gameName, tagLine, region = 'europe', platform = 'euw1', includeMatches = true) {
  return postSummoner({ gameName, tagLine, region, platform, includeMatches });
}

export function fetchSummonerByPuuid(puuid, region = 'europe', platform = 'euw1', includeMatches = true) {
  return postSummoner({ puuid, region, platform, includeMatches });
}

export async function fetchChampionMastery(puuid, platform = 'euw1') {
  const res = await fetch(`/api/mastery?puuid=${encodeURIComponent(puuid)}&platform=${platform}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch mastery.');
  return data;
}

export async function fetchLiveGame(puuid, platform = 'euw1') {
  const res = await fetch(`/api/live?puuid=${encodeURIComponent(puuid)}&platform=${platform}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch live game.');
  return data; // null when not in a game
}

export async function fetchApexRank(puuid, queue, platform) {
  const params = new URLSearchParams({ puuid, queue, platform });
  const res = await fetch(`/api/apex-rank?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch apex rank.');
  return data; // { rank, tier } or null
}

export async function fetchMatches(puuid, region = 'europe', queueId = null, start = 0, count = 20) {
  const res = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puuid, region, queueId, start, count }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch matches.');
  return data;
}
