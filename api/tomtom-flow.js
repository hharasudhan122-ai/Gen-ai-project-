/**
 * TomTom Traffic Flow Tile Proxy for Divine's Eye on Vercel
 * Proxies .pbf vector tiles when TOMTOM_API_KEY is configured in Vercel environment variables.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.TOMTOM_API_KEY;
  if (!key) {
    return res.status(503).json({ error: 'no_key' });
  }

  const { z, x, y } = req.query;
  if (!z || !x || !y) {
    return res.status(400).json({ error: 'invalid_coordinates' });
  }

  try {
    const upstreamUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/relative/${z}/${x}/${y}.pbf?key=${encodeURIComponent(key)}`;
    const upstream = await fetch(upstreamUrl, {
      signal: AbortSignal.timeout(12000)
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `upstream_${upstream.status}` });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', 'application/x-protobuf');
    res.setHeader('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
    return res.status(200).send(buf);
  } catch (err) {
    return res.status(502).json({ error: err.message || 'proxy_error' });
  }
};
