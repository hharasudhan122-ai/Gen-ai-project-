/**
 * Radio Browser Proxy for Divine's Eye on Vercel
 * Proxies /api/radio/stations to radio-browser.info DNS-round-robin API.
 * Endpoint used by bundle: GET /api/radio/stations?near=lat,lon&limit=N&...
 */

const RADIO_HOSTS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = String(req.url || '');
  const qs = url.split('?')[1] || '';
  const params = new URLSearchParams(qs);

  // Build the radio-browser.info query — bycoordinates or bycountry etc.
  // Bundle calls /api/radio/stations with query params forwarded
  const lat = params.get('lat') || params.get('latitude');
  const lon = params.get('lon') || params.get('longitude') || params.get('lng');
  const limit = params.get('limit') || '50';
  const country = params.get('country') || '';
  const name = params.get('name') || '';
  const tag = params.get('tag') || '';

  let upstreamPath;
  if (lat && lon) {
    // nearest stations by geo
    upstreamPath = `/json/stations/bycoordinates?lat=${lat}&lon=${lon}&limit=${limit}&hidebroken=true&order=votes`;
  } else if (country) {
    upstreamPath = `/json/stations/bycountry/${encodeURIComponent(country)}?limit=${limit}&hidebroken=true&order=votes`;
  } else if (name) {
    upstreamPath = `/json/stations/byname/${encodeURIComponent(name)}?limit=${limit}&hidebroken=true`;
  } else if (tag) {
    upstreamPath = `/json/stations/bytag/${encodeURIComponent(tag)}?limit=${limit}&hidebroken=true&order=votes`;
  } else {
    // fallback: top voted stations
    upstreamPath = `/json/stations?limit=${limit}&hidebroken=true&order=votes`;
  }

  for (const host of RADIO_HOSTS) {
    try {
      const r = await fetch(`${host}${upstreamPath}`, {
        headers: {
          'User-Agent': 'DivinEye/1.0 (+https://genaia-gilt.vercel.app)',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8000)
      });
      if (r.ok) {
        const data = await r.json();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        return res.status(200).json(data);
      }
    } catch (err) {
      console.warn(`[Radio] Host ${host} error:`, err.message);
    }
  }

  return res.status(503).json({ error: 'Radio directory temporarily unavailable' });
};
