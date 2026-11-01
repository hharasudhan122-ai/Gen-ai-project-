/**
 * ADS-B DB Proxy for Divine's Eye on Vercel
 * Proxies aircraft type and callsign route lookups to api.adsbdb.com
 *
 * Vercel rewrites:
 *   /api/adsbdb/type/:hex  →  /api/adsbdb?type=:hex
 *   /api/adsbdb/route/:cs  →  /api/adsbdb?route=:cs
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = String(req.url || '');
  const qs = Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''));

  // Support both query-string form (?type=hex) and path form (/type/hex)
  const typeMatch = qs.type || (url.match(/\/type\/([0-9a-fA-F]{1,6})/) || [])[1];
  const routeMatch = qs.route || (url.match(/\/route\/([A-Za-z0-9]{2,10})/) || [])[1];

  let upstream;
  if (typeMatch) {
    upstream = `https://api.adsbdb.com/v0/aircraft/${typeMatch}`;
  } else if (routeMatch) {
    upstream = `https://api.adsbdb.com/v0/callsign/${routeMatch}`;
  } else {
    return res.status(200).json({ found: false, error: 'Unknown adsbdb path' });
  }

  try {
    const r = await fetch(upstream, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'DivinEye/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    res.setHeader('Content-Type', 'application/json');
    if (!r.ok) return res.status(200).json({ found: false });
    const data = await r.json();
    return res.status(200).json(data);
  } catch {
    return res.status(200).json({ found: false });
  }
};
