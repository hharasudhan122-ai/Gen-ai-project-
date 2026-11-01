/**
 * Universal Overpass API Proxy for Divine's Eye Traffic on Vercel
 * Forwards road vector geometry queries to public Overpass mirrors.
 * Reads raw POST body since Vercel serverless does NOT auto-parse form bodies.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Read raw body from stream (Vercel does NOT auto-parse application/x-www-form-urlencoded)
  let rawBody = '';
  if (req.method === 'POST') {
    rawBody = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk.toString(); });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  // Extract the Overpass QL query — body is "data=<urlencoded query>"
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

  const mirrors = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.openstreetmap.fr/api/interpreter'
  ];

  for (const mirror of mirrors) {
    try {
      const upstream = await fetch(mirror, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'DivinEye-Traffic/1.0 (+https://github.com/hharasudhan122-ai/Gen-ai-project-)',
          'Accept': 'application/json, text/plain, */*'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(15000)
      });

      if (upstream.ok) {
        const text = await upstream.text();
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        res.setHeader('X-Overpass-Upstream', mirror);
        return res.status(200).send(text);
      }
      console.warn(`[Overpass] Mirror ${mirror} returned ${upstream.status}`);
    } catch (err) {
      console.warn(`[Overpass] Mirror ${mirror} error:`, err.message);
    }
  }

  // All mirrors failed — return valid empty OSM envelope so traffic engine doesn't crash
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({ version: 0.6, generator: 'Overpass fallback', elements: [] });
};
