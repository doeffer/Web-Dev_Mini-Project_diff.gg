const KEY = 'diffgg_search_history';
const MAX = 8;

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function addToHistory({ gameName, tagLine, platform, puuid }) {
  const history = getHistory().filter(e => {
    if (e.platform !== platform) return true;
    if (e.puuid && e.puuid === puuid) return false;
    if (e.gameName.toLowerCase() === gameName.toLowerCase() &&
        e.tagLine.toLowerCase()  === tagLine.toLowerCase()) return false;
    return true;
  });
  history.unshift({ gameName, tagLine, platform, puuid, timestamp: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX)));
}
