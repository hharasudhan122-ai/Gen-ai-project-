/**
 * Radio Browser Proxy for Divine's Eye on Vercel
 * Upstream: radio-browser.info mirrors
 * Returns schema strictly validated by Divine's Eye frontend (UW validator).
 */

const RADIO_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RADIO_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];

function cleanText(v, maxLen = 140) {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s{2,}/g, ' ').trim().slice(0, maxLen);
}

function normalizeStation(raw) {
  const id = (raw?.stationuuid || '').toLowerCase().trim();
  if (!RADIO_UUID_RE.test(id)) return null;

  const lat = Number(raw?.geo_lat);
  const lon = Number(raw?.geo_long);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return null;
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) return null;

  const name = cleanText(raw?.name, 140);
  if (!name) return null;

  const streamUrl = String(raw?.url_resolved || raw?.url || '').trim();
  if (!streamUrl.startsWith('https://')) return null;

  const codec = cleanText(raw?.codec, 16).toUpperCase();
  if (!/^(?:MP3|AAC(?:\+|-LC|-HE)?|HE-AAC)$/i.test(codec)) return null;

  const tags = String(raw?.tags || '')
    .split(',')
    .map(t => cleanText(t, 40).toLowerCase().replace(/[_-]+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 15);

  const languages = String(raw?.language || '')
    .split(',')
    .map(l => cleanText(l, 30).toLowerCase().trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    id,
    name,
    lat,
    lon,
    streamUrl,
    homepage: cleanText(raw?.homepage, 180),
    tags,
    languages,
    state: cleanText(raw?.state, 60),
    country: cleanText(raw?.country, 60),
    countryCode: cleanText(raw?.countrycode, 4).toUpperCase(),
    metadataTrust: 'untrusted',
    codec,
    bitrate: Number.isFinite(Number(raw?.bitrate)) ? Number(raw?.bitrate) : 0,
    clickCount: Number.isFinite(Number(raw?.clickcount)) ? Number(raw?.clickcount) : 0
  };
}

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  if (_cache && (now - _cacheTime < CACHE_TTL_MS)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json(_cache);
  }

  // Fetch stations with geo info, https only, valid audio codec
  const params = new URLSearchParams({
    has_geo_info: 'true',
    is_https: 'true',
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true',
    limit: '600'
  });

  let rawList = [];
  for (const mirror of RADIO_MIRRORS) {
    try {
      const upstream = `${mirror}/json/stations/search?${params.toString()}`;
      const r = await fetch(upstream, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'DivinEye/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      if (r.ok) {
        rawList = await r.json();
        if (Array.isArray(rawList) && rawList.length > 0) break;
      }
    } catch (err) {
      console.warn(`[Radio] mirror ${mirror} error:`, err?.message || err);
    }
  }

  const validStations = Array.isArray(rawList)
    ? rawList.map(normalizeStation).filter(Boolean)
    : [];

  if (validStations.length === 0 && _cache) {
    return res.status(200).json(_cache);
  }

  const updatedAt = new Date(now).toISOString();
  const payload = {
    stations: validStations,
    updatedAt,
    stale: false,
    degraded: false,
    degradedReason: null,
    coverage: null,
    acceptedGeneration: 1,
    catalogInstance: 'divine-eye-radio-v2'
  };

  _cache = payload;
  _cacheTime = now;

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
  return res.status(200).json(payload);
};
