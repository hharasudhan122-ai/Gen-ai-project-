/**
 * Live Flights Telemetry Aggregator for Divine's Eye (Vercel Serverless)
 * Queries wide-radius coordinates and global flight corridors via adsb.lol (250 NM radius per point)
 * to surface hundreds to thousands of live commercial aircraft globally.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const lat = parseFloat(req.query.lat) || 38.0;
  const lon = parseFloat(req.query.lon) || -97.0;
  const now = Math.floor(Date.now() / 1000);

  const clat = Math.round(lat * 10) / 10;
  const clon = Math.round(lon * 10) / 10;

  // adsb.lol has a hard 250 NM cap per query. Query camera center + surrounding clusters + global corridors:
  const queryPoints = [
    { lat: clat, lon: clon, dist: 250 },
    { lat: clat + 3, lon: clon, dist: 250 },
    { lat: clat - 3, lon: clon, dist: 250 },
    { lat: clat, lon: clon + 3, dist: 250 },
    { lat: clat, lon: clon - 3, dist: 250 },
    { lat: 40.7, lon: -74.0, dist: 250 },   // US East (NY/Boston/DC)
    { lat: 33.7, lon: -84.4, dist: 250 },   // US Southeast (Atlanta/Florida)
    { lat: 34.0, lon: -118.2, dist: 250 },  // US West (California/Pacific)
    { lat: 41.9, lon: -87.6, dist: 250 },   // US Midwest (Chicago/Great Lakes)
    { lat: 51.5, lon: 0.0, dist: 250 },     // Europe / UK (London/Paris/Frankfurt)
    { lat: 48.8, lon: 2.3, dist: 250 },     // Europe (Paris)
    { lat: 35.7, lon: 139.7, dist: 250 },   // East Asia (Tokyo/Japan)
    { lat: 1.35, lon: 103.8, dist: 250 },   // Southeast Asia (Singapore/Malaysia)
    { lat: 13.0, lon: 80.0, dist: 250 },    // India South (Chennai/Bangalore)
    { lat: 28.6, lon: 77.2, dist: 250 },    // India North (Delhi)
    { lat: 25.2, lon: 55.3, dist: 250 }     // Middle East (Dubai/Doha)
  ];

  try {
    const promises = queryPoints.map(p =>
      fetch(`https://api.adsb.lol/v2/lat/${p.lat}/lon/${p.lon}/dist/${p.dist}`, {
        headers: {
          'User-Agent': 'gods-eye-view-adsblol-regional-fallback/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(9000)
      }).then(r => r.ok ? r.json() : { ac: [] }).catch(() => ({ ac: [] }))
    );

    const settled = await Promise.allSettled(promises);
    const seenHexes = new Set();
    const states = [];

    for (const item of settled) {
      if (item.status === 'fulfilled' && Array.isArray(item.value?.ac)) {
        for (const ac of item.value.ac) {
          const hex = String(ac.hex || '').trim().toLowerCase();
          if (!hex || seenHexes.has(hex)) continue;
          if (typeof ac.lat !== 'number' || typeof ac.lon !== 'number') continue;
          seenHexes.add(hex);

          const isGround = ac.alt_baro === 'ground';
          const altM = isGround ? 0 : (typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : null);
          const vel = typeof ac.gs === 'number' ? ac.gs * 0.514444 : null;
          const trk = typeof ac.track === 'number' ? ac.track : 0;
          const geoM = typeof ac.alt_geom === 'number' ? ac.alt_geom * 0.3048 : altM;
          const vr = typeof ac.baro_rate === 'number' ? ac.baro_rate * 0.00508 : null;

          states.push([
            hex,
            String(ac.flight || ac.r || '').trim() || null,
            'Commercial',
            now,
            now,
            ac.lon,
            ac.lat,
            altM,
            isGround,
            vel,
            trk,
            vr,
            null,
            geoM,
            ac.squawk || null,
            false,
            0
          ]);
        }
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=6, stale-while-revalidate=20');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('x-flight-source', 'adsb.lol');
    res.setHeader('x-flight-coverage', `${states.length} commercial flights`);
    return res.status(200).json({ time: now, states });

  } catch (err) {
    console.error('Flight aggregation error:', err);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ time: now, states: [] });
  }
};
