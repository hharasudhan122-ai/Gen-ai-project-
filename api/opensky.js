module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const lat = req.query.lat;
  const lon = req.query.lon;
  const now = Math.floor(Date.now() / 1000);

  // 1. Regional high-speed adsb.lol query when coordinates are provided
  if (lat && lon) {
    try {
      const roundedLat = Math.round(parseFloat(lat) * 100) / 100;
      const roundedLon = Math.round(parseFloat(lon) * 100) / 100;
      const adsbRes = await fetch(`https://api.adsb.lol/v2/lat/${roundedLat}/lon/${roundedLon}/dist/250`, {
        headers: {
          'User-Agent': 'gods-eye-view-adsblol-regional-fallback/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(9000)
      });

      if (adsbRes.ok) {
        const data = await adsbRes.json();
        const states = (data.ac || []).map(ac => {
          const hex = String(ac.hex || '').trim().toLowerCase();
          const la = typeof ac.lat === 'number' ? ac.lat : null;
          const lo = typeof ac.lon === 'number' ? ac.lon : null;
          if (!hex || la === null || lo === null) return null;

          const isGround = ac.alt_baro === 'ground';
          const altM = isGround ? 0 : (typeof ac.alt_baro === 'number' ? ac.alt_baro * 0.3048 : null);
          const vel = typeof ac.gs === 'number' ? ac.gs * 0.514444 : null;
          const trk = typeof ac.track === 'number' ? ac.track : 0;
          const geoM = typeof ac.alt_geom === 'number' ? ac.alt_geom * 0.3048 : altM;
          const vr = typeof ac.baro_rate === 'number' ? ac.baro_rate * 0.00508 : null;

          return [
            hex,
            String(ac.flight || ac.r || '').trim() || null,
            'Commercial',
            now,
            now,
            lo,
            la,
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
          ];
        }).filter(Boolean);

        res.setHeader('Cache-Control', 'public, s-maxage=6, stale-while-revalidate=20');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ time: now, states });
      }
    } catch (e) {
      console.warn('adsb.lol regional lookup error:', e.message);
    }
  }

  // 2. Global fallback: try OpenSky, or safe empty states
  try {
    const upstream = await fetch('https://opensky-network.org/api/states/all', {
      headers: {
        'User-Agent': 'gods-eye-view-opensky-proxy/1.0',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (upstream.ok) {
      const data = await upstream.json();
      res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json(data);
    }
  } catch (e) { }

  // Return safe valid empty states so layer never shows 502/UNAVAILABLE
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({ time: now, states: [] });
};
