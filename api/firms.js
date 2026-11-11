/**
 * NASA FIRMS Live Active Fires Proxy for Divine's Eye on Vercel
 * Upstream: https://firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/{SOURCE}/world/1
 * Returns: { fetchedAt, stale, ttlMs, sources, count, fires }
 */

const HOUR_MS = 3600_000;
const WINDOW_MS = 24 * HOUR_MS;
const FORWARD_SLACK_MS = 2 * HOUR_MS;

function isLikelyCsv(text) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trimStart();
  if (!trimmed || trimmed[0] === '<') return false;
  const headerLine = trimmed.slice(0, trimmed.indexOf('\n') === -1 ? undefined : trimmed.indexOf('\n'))
    .trim().toLowerCase();
  const fields = headerLine.split(',').map((f) => f.trim());
  return ['latitude', 'longitude', 'acq_date', 'acq_time', 'confidence'].every((r) => fields.includes(r));
}

function acquisitionMsUtc(acqDate, acqTime) {
  if (typeof acqDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(acqDate)) return NaN;
  const timeText = String(acqTime ?? '').trim();
  if (!/^\d{1,4}$/.test(timeText)) return NaN;
  const hhmm = timeText.padStart(4, '0');
  const year = Number(acqDate.slice(0, 4));
  const month = Number(acqDate.slice(5, 7));
  const day = Number(acqDate.slice(8, 10));
  const hours = Number(hhmm.slice(0, 2));
  const minutes = Number(hhmm.slice(2, 4));
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59) return NaN;
  return Date.UTC(year, month - 1, day, hours, minutes);
}

function filterTrailing24h(records, nowMs) {
  if (!Array.isArray(records) || !Number.isFinite(nowMs)) return [];
  const oldest = nowMs - WINDOW_MS;
  const newest = nowMs + FORWARD_SLACK_MS;
  const memo = new Map();
  return records.filter((record) => {
    const key = `${record.acqDate}:${record.acqTime}`;
    let ms = memo.get(key);
    if (ms === undefined) {
      ms = acquisitionMsUtc(record.acqDate, record.acqTime);
      memo.set(key, ms);
    }
    return Number.isFinite(ms) && ms >= oldest && ms <= newest;
  });
}

function parseFirmsCsv(text) {
  if (!isLikelyCsv(text)) return null;
  const lines = text.split('\n');
  let headerIndex = 0;
  while (headerIndex < lines.length && !lines[headerIndex].trim()) headerIndex += 1;
  if (headerIndex >= lines.length) return [];
  const header = lines[headerIndex].trim().toLowerCase().split(',').map((f) => f.trim());
  const col = new Map(header.map((name, i) => [name, i]));
  const iLat = col.get('latitude');
  const iLon = col.get('longitude');
  const iFrp = col.get('frp');
  const iConfidence = col.get('confidence');
  const iBrightness = col.get('bright_ti4') ?? col.get('brightness');
  const iBrightnessTi5 = col.get('bright_ti5') ?? col.get('bright_t31');
  const iDaynight = col.get('daynight');
  const iAcqDate = col.get('acq_date');
  const iAcqTime = col.get('acq_time');
  const iSatellite = col.get('satellite');
  const iInstrument = col.get('instrument');

  const records = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < header.length) continue;
    const lat = Number(parts[iLat]);
    const lon = Number(parts[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    records.push({
      lat,
      lon,
      frp: Number(parts[iFrp]) || 0,
      confidence: (parts[iConfidence] || '').trim(),
      brightness: Number(parts[iBrightness]) || 0,
      brightnessTi5: Number(parts[iBrightnessTi5]) || 0,
      daynight: (parts[iDaynight] || '').trim(),
      acqDate: (parts[iAcqDate] || '').trim(),
      acqTime: (parts[iAcqTime] || '').trim(),
      satellite: (parts[iSatellite] || '').trim(),
      instrument: (parts[iInstrument] || '').trim(),
    });
  }
  return records;
}

// In-memory cache for serverless execution
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = (process.env.FIRMS_MAP_KEY || 'b992eead29c2d499b3ad94f629e521ff').trim();
  const url = String(req.url || '');

  if (url.includes('/status')) {
    return res.status(200).json({
      hasKey: Boolean(key),
      lastFetch: _cacheTime ? new Date(_cacheTime).toISOString() : null,
      count: _cache ? _cache.fires.length : 0,
      stale: false,
      ttlMs: CACHE_TTL_MS
    });
  }

  if (!key) {
    return res.status(503).json({ error: 'no_key', message: 'FIRMS_MAP_KEY required' });
  }

  const now = Date.now();
  if (_cache && (now - _cacheTime < CACHE_TTL_MS)) {
    const freshFires = filterTrailing24h(_cache.fires, now);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({
      fetchedAt: _cacheTime,
      stale: false,
      ttlMs: CACHE_TTL_MS,
      sources: _cache.sources,
      count: freshFires.length,
      fires: freshFires
    });
  }

  // MODIS is fast & rock-solid; NOAA20 has dense VIIRS detection
  const SOURCES = ['MODIS_NRT', 'VIIRS_NOAA20_NRT'];

  const fetchPromises = SOURCES.map(async (source) => {
    try {
      const upstreamUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(key)}/${source}/world/1`;
      const r = await fetch(upstreamUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(12000)
      });
      if (r.ok) {
        const text = await r.text();
        const records = parseFirmsCsv(text);
        if (records && records.length > 0) {
          const trailing = filterTrailing24h(records, now);
          return { source, count: trailing.length, ok: true, fires: trailing };
        }
        return { source, count: 0, ok: false, status: r.status, reason: 'empty_or_unparseable', len: text.length, sample: text.slice(0, 100), fires: [] };
      }
      return { source, count: 0, ok: false, status: r.status, reason: 'http_' + r.status, fires: [] };
    } catch (e) {
      return { source, count: 0, ok: false, reason: e.name + ': ' + e.message, fires: [] };
    }
  });

  const settled = await Promise.allSettled(fetchPromises);
  const sourcesOut = [];
  const allFires = [];

  for (const item of settled) {
    if (item.status === 'fulfilled') {
      sourcesOut.push({
        source: item.value.source,
        count: item.value.count,
        ok: item.value.ok,
        status: item.value.status,
        reason: item.value.reason,
        sample: item.value.sample
      });
      if (item.value.ok && item.value.fires.length > 0) {
        allFires.push(...item.value.fires);
      }
    }
  }

  if (!sourcesOut.some(s => s.ok) && _cache && _cache.fires.length > 0) {
    // Serve stale cache if available
    const freshFires = filterTrailing24h(_cache.fires, now);
    return res.status(200).json({
      fetchedAt: _cacheTime,
      stale: true,
      ttlMs: CACHE_TTL_MS,
      sources: _cache.sources,
      count: freshFires.length,
      fires: freshFires
    });
  }

  if (allFires.length > 0) {
    _cache = { sources: sourcesOut, fires: allFires };
    _cacheTime = now;
    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
  } else {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
  }

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    fetchedAt: now,
    stale: false,
    ttlMs: CACHE_TTL_MS,
    sources: sourcesOut,
    count: allFires.length,
    fires: allFires
  });
};
