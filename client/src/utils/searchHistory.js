const KEY = 'diffgg_search_history';
const MAX = 8;

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function addToHistory({ gameName, tagLine, platform, puuid }) {
  const history = getHistory().filter(
    e => !(e.puuid === puuid && e.platform === platform)
  );
  history.unshift({ gameName, tagLine, platform, puuid, timestamp: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX)));
}
