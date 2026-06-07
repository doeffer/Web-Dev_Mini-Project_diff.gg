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
  1750: 'Arena 3v3',
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

let _runesRawPromise = null;
function getRawRunes() {
  if (!_runesRawPromise)
    _runesRawPromise = getDDVersion().then(v =>
      fetch(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/runesReforged.json`).then(r => r.json())
    );
  return _runesRawPromise;
}

let _runeMapPromise = null;
export function getRuneMap() {
  if (!_runeMapPromise)
    _runeMapPromise = getRawRunes().then(styles => {
      const map = {};
      for (const style of styles) {
        map[style.id] = style.icon;
        for (const slot of style.slots)
          for (const rune of slot.runes)
            map[rune.id] = rune.icon;
      }
      return map;
    });
  return _runeMapPromise;
}

let _runeNameMapPromise = null;
export function getRuneNameMap() {
  if (!_runeNameMapPromise)
    _runeNameMapPromise = getRawRunes().then(styles => {
      const map = {};
      for (const style of styles) {
        map[style.id] = style.name;
        for (const slot of style.slots)
          for (const rune of slot.runes)
            map[rune.id] = rune.name;
      }
      return map;
    });
  return _runeNameMapPromise;
}

let _champRawPromise = null;
function getRawChamps() {
  if (!_champRawPromise)
    _champRawPromise = getDDVersion().then(v =>
      fetch(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`).then(r => r.json())
    );
  return _champRawPromise;
}

let _champIdMapPromise = null;
export function getChampionIdMap() {
  if (!_champIdMapPromise)
    _champIdMapPromise = getRawChamps().then(json => {
      const map = {};
      for (const champ of Object.values(json.data))
        map[parseInt(champ.key)] = { id: champ.id, name: champ.name };
      return map;
    });
  return _champIdMapPromise;
}

let _champNameMapPromise = null;
export function getChampionNameMap() {
  if (!_champNameMapPromise)
    _champNameMapPromise = getRawChamps().then(json => {
      const map = {};
      for (const champ of Object.values(json.data))
        map[champ.id] = champ.name;
      return map;
    });
  return _champNameMapPromise;
}

let _augmentRawPromise = null;
function getRawAugments() {
  if (!_augmentRawPromise)
    _augmentRawPromise = fetch('https://raw.communitydragon.org/latest/cdragon/arena/en_us.json')
      .then(r => r.json())
      .then(data => data.augments || data);
  return _augmentRawPromise;
}

let _augmentMapPromise = null;
export function getAugmentMap() {
  if (!_augmentMapPromise)
    _augmentMapPromise = getRawAugments().then(list => {
      const map = {};
      for (const aug of list)
        if (aug.iconSmall)
          map[aug.id] = 'https://raw.communitydragon.org/latest/game/' + aug.iconSmall.toLowerCase();
      return map;
    });
  return _augmentMapPromise;
}

let _augmentNameMapPromise = null;
export function getAugmentNameMap() {
  if (!_augmentNameMapPromise)
    _augmentNameMapPromise = getRawAugments().then(list => {
      const map = {};
      for (const aug of list) map[aug.id] = aug.name;
      return map;
    });
  return _augmentNameMapPromise;
}

let _itemNameMapPromise = null;
export function getItemNameMap() {
  if (!_itemNameMapPromise)
    _itemNameMapPromise = getDDVersion().then(v =>
      fetch(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/item.json`)
        .then(r => r.json())
        .then(json => {
          const map = {};
          for (const [id, item] of Object.entries(json.data))
            map[parseInt(id)] = item.name;
          return map;
        })
    );
  return _itemNameMapPromise;
}

let _spellNameMapPromise = null;
export function getSpellNameMap() {
  if (!_spellNameMapPromise)
    _spellNameMapPromise = getDDVersion().then(v =>
      fetch(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/summoner.json`)
        .then(r => r.json())
        .then(json => {
          const map = {};
          for (const spell of Object.values(json.data))
            map[parseInt(spell.key)] = spell.name;
          return map;
        })
    );
  return _spellNameMapPromise;
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
