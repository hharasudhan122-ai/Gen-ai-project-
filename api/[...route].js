/**
 * Universal Serverless API Proxy for Divine's Eye on Vercel
 * Handles live telemetry feeds: Satellites, Live Flights, Military Aircraft, Overpass Roads, etc.
 */

export default async function handler(req, res) {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const route = req.query.route || [];
  const endpoint = route[0] || '';
  const sub = route.slice(1).join('/');

  try {
    // 1. CELESTRAK (Satellite TLE Orbital Elements)
    if (endpoint === 'celestrak') {
      const group = route[1] || 'stations';
      const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${encodeURIComponent(group)}&FORMAT=tle`;
      
      const upstream = await fetch(url, {
        headers: {
          'User-Agent': 'gods-eye-view-celestrak-proxy/1.0 (+https://github.com/bilawalsidhu/gods-eye-view)',
          'Accept': 'text/plain'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!upstream.ok) {
        return res.status(upstream.status).send(`CelesTrak error: ${upstream.status}`);
      }

      const text = await upstream.text();
      res.setHeader('Cache-Control', 'public, s-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(text);
    }

    // 2. ADS-B LOL MILITARY AIRCRAFT
    if (endpoint === 'adsblol') {
      if (route[1] === 'mil') {
        const upstream = await fetch('https://api.adsb.lol/v2/mil', {
          headers: {
            'User-Agent': 'gods-eye-view-adsblol-proxy/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(12000)
        });

        const data = await upstream.json();
        res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(data);
      }

      if (route[1] === 'trace') {
        const hex = req.query.hex || '';
        const upstream = await fetch(`https://api.adsb.lol/v2/trace/${encodeURIComponent(hex)}`, {
          headers: { 'User-Agent': 'gods-eye-view-adsblol-proxy/1.0' },
          signal: AbortSignal.timeout(10000)
        });
        const data = await upstream.json();
        return res.status(200).json(data);
      }
    }

    // 3. OPENSKY (Live Commercial Flights + adsb.lol regional fallback)
    if (endpoint === 'opensky') {
      const lat = req.query.lat;
      const lon = req.query.lon;

      // When coordinates are provided, adsb.lol provides fast regional tracking without OpenSky 429 rate limits
      if (lat && lon) {
        try {
          const roundedLat = Math.round(parseFloat(lat) * 100) / 100;
          const roundedLon = Math.round(parseFloat(lon) * 100) / 100;
          const adsbRes = await fetch(`https://api.adsb.lol/v2/lat/${roundedLat}/lon/${roundedLon}/dist/250`, {
            headers: {
              'User-Agent': 'gods-eye-view-adsblol-regional-fallback/1.0',
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(10000)
          });

          if (adsbRes.ok) {
            const data = await adsbRes.json();
            const now = Math.floor(Date.now() / 1000);
            
            // Convert adsb.lol shape to OpenSky state vector shape
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
                'International',
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

            res.setHeader('Cache-Control', 'public, s-maxage=8, stale-while-revalidate=20');
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({
              time: now,
              states
            });
          }
        } catch (e) {
          console.warn('[adsb.lol fallback failed, trying OpenSky]', e.message);
        }
      }

      // Fallback to upstream OpenSky
      try {
        const upstream = await fetch('https://opensky-network.org/api/states/all', {
          headers: {
            'User-Agent': 'gods-eye-view-opensky-proxy/1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(12000)
        });

        if (upstream.ok) {
          const data = await upstream.json();
          res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
          res.setHeader('Content-Type', 'application/json');
          return res.status(200).json(data);
        }
      } catch (e) { }

      // Safe fallback if rate-limited
      return res.status(200).json({ time: Math.floor(Date.now() / 1000), states: [] });
    }

    // 4. OVERPASS (OpenStreetMap road vectors for traffic)
    if (endpoint === 'overpass') {
      const upstream = await fetch('https://overpass-api.de/api/interpreter', {
        method: req.method,
        body: req.method === 'POST' ? req.body : undefined,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'gods-eye-view-traffic/1.0'
        },
        signal: AbortSignal.timeout(18000)
      });

      const body = await upstream.text();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, s-maxage=86400');
      return res.status(upstream.status).send(body);
    }

    // 5. TOMTOM STATUS
    if (endpoint === 'tomtom') {
      return res.status(200).json({ status: 'ok', available: false, keyless: true });
    }

    // 6. ROCKET LAUNCHES
    if (endpoint === 'launches') {
      const upstream = await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=10', {
        headers: { 'User-Agent': 'gods-eye-view/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      const data = await upstream.json();
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      return res.status(200).json(data);
    }

    // 7. NASA FIRMS (Wildfires)
    if (endpoint === 'firms') {
      return res.status(200).json({ fires: [] });
    }

    // Default unknown endpoint
    return res.status(404).json({ error: 'Endpoint not found', endpoint });

  } catch (err) {
    console.error(`[API Proxy Error on /api/${route.join('/')}]`, err);
    return res.status(500).json({ error: 'Proxy internal error', message: err.message });
  }
}
