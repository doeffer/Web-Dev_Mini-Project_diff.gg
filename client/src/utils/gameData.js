export const QUEUE_NAMES = {
  420:  'Ranked Solo/Duo',
  440:  'Ranked Flex',
  450:  'ARAM',
  400:  'Normal Draft',
  430:  'Normal Blind',
  490:  'Quickplay',
  1900: 'URF',
  900:  'URF',
  1700: 'Arena',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  76:   'URF',
  0:    'Custom',
};

// Summoner spell IDs → DDragon key
export const SPELL_KEYS = {
  1:  'SummonerBoost',
  3:  'SummonerExhaust',
  4:  'SummonerFlash',
  6:  'SummonerHaste',
  7:  'SummonerHeal',
  11: 'SummonerSmite',
  12: 'SummonerTeleport',
  13: 'SummonerMana',
  14: 'SummonerDot',
  21: 'SummonerBarrier',
  30: 'SummonerPoroRecall',
  31: 'SummonerPoroThrow',
  32: 'SummonerSnowball',
  39: 'SummonerSnowURFSnowball_Mark',
  54: 'Summoner_UltBookPlaceholder',
  55: 'Summoner_UltBookSmitePlaceholder',
};

// championName field in Match-V5 → DDragon key where they differ
const CHAMP_KEY_FIX = { Wukong: 'MonkeyKing' };

export function champImgUrl(championName, version) {
  const key = CHAMP_KEY_FIX[championName] || championName;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${key}.png`;
}

export function spellImgUrl(spellId, version) {
  const key = SPELL_KEYS[spellId];
  if (!key) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${key}.png`;
}

export function itemImgUrl(itemId, version) {
  if (!itemId) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

// Perk images have no version in the DDragon path
export function runeImgUrl(iconPath) {
  return `https://ddragon.leagueoflegends.com/cdn/img/${iconPath}`;
}

// Module-level promise caches — fetched once, shared across all components
let _ddVersionPromise = null;
export function getDDVersion() {
  if (!_ddVersionPromise)
    _ddVersionPromise = fetch('/api/ddragon-version').then(r => r.json()).then(d => d.version);
  return _ddVersionPromise;
}

let _runeMapPromise = null;
export function getRuneMap() {
  if (!_runeMapPromise) {
    _runeMapPromise = getDDVersion().then(version =>
      fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/runesReforged.json`)
        .then(r => r.json())
        .then(styles => {
          const map = {};
          for (const style of styles) {
            map[style.id] = style.icon;
            for (const slot of style.slots)
              for (const rune of slot.runes)
                map[rune.id] = rune.icon;
          }
          return map;
        })
    );
  }
  return _runeMapPromise;
}

let _champIdMapPromise = null;
export function getChampionIdMap() {
  if (!_champIdMapPromise) {
    _champIdMapPromise = getDDVersion().then(version =>
      fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
        .then(r => r.json())
        .then(json => {
          const map = {};
          for (const champ of Object.values(json.data))
            map[parseInt(champ.key)] = { id: champ.id, name: champ.name };
          return map;
        })
    );
  }
  return _champIdMapPromise;
}

export function timeAgo(ms) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function formatDuration(raw) {
  // Riot inconsistently uses seconds vs ms in older matches
  const secs = raw > 10000 ? Math.floor(raw / 1000) : raw;
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}
