export async function fetchTeams() {
  const res = await fetch('/api/teams');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch teams.');
  return data;
}

export async function createTeam(team) {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(team),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create team.');
  return data;
}

export async function deleteTeam(id) {
  const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete team.');
  return data;
}

export async function fetchDDragonVersion() {
  const res = await fetch('/api/ddragon-version');
  const data = await res.json();
  return data.version;
}

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

export async function fetchRandomPlayer(platform = 'euw1') {
  const res = await fetch(`/api/random?platform=${platform}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to find a random player.');
  return data; // { puuid, platform }
}

export async function fetchLeaderboardTop(platform = 'euw1') {
  const res = await fetch(`/api/leaderboard/top?platform=${platform}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load leaderboard.');
  return data;
}

export async function fetchLeaderboardMaster(platform = 'euw1', page = 1) {
  const res = await fetch(`/api/leaderboard/master?platform=${platform}&page=${page}`);
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

export async function fetchMatches(puuid, region = 'europe', queueId = null, start = 0) {
  const res = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ puuid, region, queueId, start }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch matches.');
  return data;
}
