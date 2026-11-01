/**
 * Universal Overpass API Proxy for Divine's Eye Traffic on Vercel
 * Forwards road vector geometry queries to public Overpass mirrors with proper CORS headers.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter'
  ];

  let query = '';
  if (req.method === 'POST') {
    if (typeof req.body === 'string') {
      query = req.body;
    } else if (req.body && typeof req.body === 'object') {
      query = req.body.data || Object.keys(req.body).map(k => `${k}=${encodeURIComponent(req.body[k])}`).join('&');
    }
  } else if (req.method === 'GET') {
    query = req.query.data || '';
  }

  if (query && !query.startsWith('data=')) {
    query = 'data=' + encodeURIComponent(query);
  }

  for (const mirror of mirrors) {
    try {
      const upstream = await fetch(mirror, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'gods-eye-view-traffic/1.0 (+https://github.com/hharasudhan122-ai/Gen-ai-project-)',
          'Accept': 'application/json, text/plain, */*'
        },
        body: query,
        signal: AbortSignal.timeout(12000)
      });

      if (upstream.ok) {
        const text = await upstream.text();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        return res.status(200).send(text);
      }
      console.warn(`Overpass mirror ${mirror} returned ${upstream.status}`);
    } catch (err) {
      console.warn(`Overpass mirror ${mirror} error:`, err.message);
    }
  }

  // Fallback: return valid OSM envelope so traffic engine does not crash
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({ version: 0.6, generator: 'Overpass fallback', elements: [] });
};
