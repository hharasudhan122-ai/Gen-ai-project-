/**
 * Universal Resilient Overpass API Proxy for Divine's Eye Traffic on Vercel
 * 1. Races public Overpass mirrors in parallel with strict timeout.
 * 2. If all mirrors time out or fail, generates tactical road vectors for the bounding box.
 * 3. Never returns 504 or empty failure — always keeps traffic alive.
 */

function generateFallbackRoads(s, w, n, e) {
  const elements = [];
  const numGrid = 8;
  let id = 900000;

  // East-West avenues
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
      tags: { highway: i % 2 === 0 ? 'primary' : 'secondary', oneway: i % 3 === 0 ? 'yes' : 'no' },
      geometry: geom
    });
  }

  // North-South streets
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
      tags: { highway: j % 2 === 0 ? 'primary' : 'secondary', oneway: j % 3 === 0 ? 'yes' : 'no' },
      geometry: geom
    });
  }

  // Diagonal connecting arterials
  const diag1 = [];
  const diag2 = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    diag1.push({ lat: s + t * (n - s), lon: w + t * (e - w) });
    diag2.push({ lat: s + t * (n - s), lon: e - t * (e - w) });
  }
  elements.push(
    { type: 'way', id: ++id, tags: { highway: 'motorway', oneway: 'yes' }, geometry: diag1 },
    { type: 'way', id: ++id, tags: { highway: 'motorway', oneway: 'no' }, geometry: diag2 }
  );

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

  // Parse bounding box from query for fallback
  const bboxMatch = query.match(/\(([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+)\)/);
  const bbox = bboxMatch ? {
    s: parseFloat(bboxMatch[1]),
    w: parseFloat(bboxMatch[2]),
    n: parseFloat(bboxMatch[3]),
    e: parseFloat(bboxMatch[4])
  } : null;

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  // Race mirrors in parallel with 5-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const fetchPromise = Promise.any(mirrors.map(async (mirror) => {
    const resp = await fetch(mirror, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
