/**
 * Universal Resilient Overpass API Proxy for Divine's Eye Traffic on Vercel
 * 1. Races all major global Overpass mirrors in parallel with 10s deadline.
 * 2. Caches responses at the Vercel edge so repeat visits load in 0ms.
 * 3. Graceful fallback only if all global mirrors are down.
 */

const _cache = new Map();

function generateFallbackRoads(s, w, n, e) {
  const elements = [];
  const numGrid = 8;
  let id = 900000;

  // East-West avenues with natural curves
  for (let i = 0; i <= numGrid; i++) {
    const lat = s + (i / numGrid) * (n - s);
    const geom = [];
    const steps = 8;
    for (let k = 0; k <= steps; k++) {
      const lon = w + (k / steps) * (e - w);
      const jitterLat = lat + Math.sin(k * 0.7 + i) * 0.00025 * (n - s);
      geom.push({ lat: jitterLat, lon });
    }
    elements.push({
      type: 'way',
      id: ++id,
      tags: { highway: i % 2 === 0 ? 'primary' : 'secondary', oneway: i % 3 === 0 ? 'yes' : 'no', name: `Avenue ${i + 1}` },
      geometry: geom
    });
  }

  // North-South streets with natural curves
  for (let j = 0; j <= numGrid; j++) {
    const lon = w + (j / numGrid) * (e - w);
    const geom = [];
    const steps = 8;
    for (let k = 0; k <= steps; k++) {
      const lat = s + (k / steps) * (n - s);
      const jitterLon = lon + Math.cos(k * 0.7 + j) * 0.00025 * (e - w);
      geom.push({ lat, lon: jitterLon });
    }
    elements.push({
      type: 'way',
      id: ++id,
      tags: { highway: j % 2 === 0 ? 'primary' : 'secondary', oneway: j % 3 === 0 ? 'yes' : 'no', name: `Street ${j + 1}` },
      geometry: geom
    });
  }

  return {
    version: 0.6,
    generator: 'DivineEye-TacticalGrid/1.0',
    elements
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let rawBody = '';
  if (req.method === 'POST') {
    rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  let query = '';
  if (rawBody) {
    const params = new URLSearchParams(rawBody);
    query = params.get('data') || rawBody;
  } else if (req.method === 'GET') {
    const qs = new URLSearchParams((req.url || '').split('?')[1] || '');
    query = qs.get('data') || '';
  }

  if (!query) {
    return res.status(400).json({ error: 'No Overpass query provided' });
  }

  // Cache key based on query
  const cacheKey = query.replace(/\s+/g, '');
  const cached = _cache.get(cacheKey);
  if (cached && (Date.now() - cached.time < 3600000)) { // 1 hr in-memory cache
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Overpass-Cache', 'HIT');
    return res.status(200).send(cached.text);
  }

  // Parse bounding box from query
  const bboxMatch = query.match(/\(([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+)\)/);
  const bbox = bboxMatch ? {
    s: parseFloat(bboxMatch[1]),
    w: parseFloat(bboxMatch[2]),
    n: parseFloat(bboxMatch[3]),
    e: parseFloat(bboxMatch[4])
  } : null;

  // Global Overpass mirrors to race in parallel
  const mirrors = [
    'https://overpass.openstreetmap.fr/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9500);

  const fetchPromise = Promise.any(mirrors.map(async (mirror) => {
    const resp = await fetch(mirror, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ParziDivineEye/2.0 (+https://github.com/hharasudhan122-ai/Gen-ai-project-; contact: hharasudhan122@gmail.com)',
        'Accept': 'application/json, text/plain, */*'
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });

    if (!resp.ok) throw new Error(`${mirror} status ${resp.status}`);
    const text = await resp.text();
    if (!text.startsWith('{')) throw new Error(`${mirror} invalid json`);
    const json = JSON.parse(text);
    if (!json.elements || json.elements.length === 0) throw new Error(`${mirror} empty elements`);
    return { mirror, json, rawText: text };
  }));

  try {
    const winner = await fetchPromise;
    clearTimeout(timeoutId);

    // Save to memory cache (keep size <= 100)
    if (_cache.size >= 100) {
      const first = _cache.keys().next().value;
      _cache.delete(first);
    }
    _cache.set(cacheKey, { text: winner.rawText, time: Date.now() });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Overpass-Upstream', winner.mirror);
    return res.status(200).send(winner.rawText);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Overpass] Live mirrors unavailable, generating tactical grid fallback...');

    if (bbox && Number.isFinite(bbox.s) && Number.isFinite(bbox.w)) {
      const fallback = generateFallbackRoads(bbox.s, bbox.w, bbox.n, bbox.e);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      res.setHeader('X-Overpass-Fallback', 'tactical-grid');
      return res.status(200).json(fallback);
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).json({ version: 0.6, generator: 'empty fallback', elements: [] });
  }
};
