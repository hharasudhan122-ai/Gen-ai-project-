/**
 * CCTV Serverless Handler for Divine's Eye on Vercel
 * Provides global camera sources (24 cameras across major metros), health status,
 * and live frame synthesis (HUD SVG fallback).
 */

function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function buildSyntheticCctvSvg(id, label = 'CAM FEED', city = 'CITY GRID') {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const safeId = escapeXml(id);
  const safeLabel = escapeXml(label);
  const safeCity = escapeXml(city);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1420" />
      <stop offset="60%" stop-color="#050a12" />
      <stop offset="100%" stop-color="#020408" />
    </linearGradient>
    <pattern id="scan" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="transparent" />
      <rect y="0" width="8" height="1" fill="rgba(255,255,255,0.06)" />
    </pattern>
  </defs>
  <rect width="960" height="540" fill="url(#bg)" />
  <rect width="960" height="540" fill="url(#scan)" />
  <!-- Corner brackets -->
  <path d="M 40 80 L 40 40 L 80 40" stroke="#00e5ff" stroke-width="2" fill="none" opacity="0.8" />
  <path d="M 920 80 L 920 40 L 880 40" stroke="#00e5ff" stroke-width="2" fill="none" opacity="0.8" />
  <path d="M 40 460 L 40 500 L 80 500" stroke="#00e5ff" stroke-width="2" fill="none" opacity="0.8" />
  <path d="M 920 460 L 920 500 L 880 500" stroke="#00e5ff" stroke-width="2" fill="none" opacity="0.8" />
  <!-- Center reticle -->
  <circle cx="480" cy="270" r="48" stroke="#00e5ff" stroke-width="1.5" stroke-dasharray="4 6" fill="none" opacity="0.4" />
  <line x1="450" y1="270" x2="510" y2="270" stroke="#00e5ff" stroke-width="1" opacity="0.6" />
  <line x1="480" y1="240" x2="480" y2="300" stroke="#00e5ff" stroke-width="1" opacity="0.6" />
  <!-- Header HUD -->
  <text x="50" y="65" font-family="monospace" font-size="14" fill="#00e5ff" font-weight="bold">? LIVE FEED // CCTV NODE</text>
  <text x="50" y="85" font-family="monospace" font-size="12" fill="#88b0c8">${safeId} ?" ${safeLabel}</text>
  <text x="910" y="65" font-family="monospace" font-size="12" fill="#00e5ff" text-anchor="end">${safeCity}</text>
  <text x="910" y="85" font-family="monospace" font-size="11" fill="#ffb74d" text-anchor="end">${now}</text>
  <!-- Status footer -->
  <rect x="40" y="475" width="880" height="25" fill="rgba(0, 229, 255, 0.08)" />
  <text x="50" y="492" font-family="monospace" font-size="11" fill="#00e5ff">STATUS: ACTIVE CARRIER // FRAME SYNTHESIS // 1080P PROJECTION</text>
  <circle cx="895" cy="487" r="4" fill="#00e5ff" />
</svg>`;
}

const GLOBAL_CAMERAS = [
  // Austin Core
  { id: 'aust-ch-17', name: 'Congress Ave & 6th St', city: 'Austin', cityId: 'austin', lat: 30.2687, lon: -97.7428, headingDeg: 0, pitchDeg: -10, fovDeg: 75, feedType: 'image' },
  { id: 'aust-ch-18', name: 'Lamar Blvd & 5th St', city: 'Austin', cityId: 'austin', lat: 30.2704, lon: -97.7584, headingDeg: 90, pitchDeg: -8, fovDeg: 70, feedType: 'image' },
  { id: 'aust-ch-19', name: 'Barton Springs & S 1st', city: 'Austin', cityId: 'austin', lat: 30.2582, lon: -97.7485, headingDeg: 45, pitchDeg: -12, fovDeg: 80, feedType: 'image' },
  { id: 'aust-ch-20', name: 'Guadalupe St & 38th St', city: 'Austin', cityId: 'austin', lat: 30.3015, lon: -97.7402, headingDeg: 180, pitchDeg: -10, fovDeg: 75, feedType: 'image' },
  { id: 'aust-ch-21', name: 'Airport Blvd & MLK Jr Blvd', city: 'Austin', cityId: 'austin', lat: 30.2831, lon: -97.7029, headingDeg: 270, pitchDeg: -9, fovDeg: 75, feedType: 'image' },
  { id: 'aust-ch-22', name: 'Riverside Dr & S Congress', city: 'Austin', cityId: 'austin', lat: 30.2541, lon: -97.7456, headingDeg: 350, pitchDeg: -11, fovDeg: 80, feedType: 'image' },
  { id: 'aust-ch-23', name: 'San Jacinto & 15th St', city: 'Austin', cityId: 'austin', lat: 30.2764, lon: -97.7381, headingDeg: 135, pitchDeg: -10, fovDeg: 70, feedType: 'image' },
  { id: 'aust-ch-24', name: 'Cesar Chavez & Brazos St', city: 'Austin', cityId: 'austin', lat: 30.2625, lon: -97.7419, headingDeg: 225, pitchDeg: -12, fovDeg: 75, feedType: 'image' },

  // New York City
  { id: 'nyc-midtown-w', name: 'Times Square & 42nd St', city: 'New York', cityId: 'nyc', lat: 40.7563, lon: -73.9863, headingDeg: 210, pitchDeg: -15, fovDeg: 75, feedType: 'image' },
  { id: 'nyc-5th-ave', name: '5th Ave & 59th St (Central Park)', city: 'New York', cityId: 'nyc', lat: 40.7648, lon: -73.9731, headingDeg: 180, pitchDeg: -12, fovDeg: 75, feedType: 'image' },
  { id: 'nyc-wall-st', name: 'Wall Street & Broadway', city: 'New York', cityId: 'nyc', lat: 40.7071, lon: -74.0113, headingDeg: 90, pitchDeg: -14, fovDeg: 70, feedType: 'image' },
  { id: 'nyc-bk-bridge', name: 'Brooklyn Bridge Walkway', city: 'New York', cityId: 'nyc', lat: 40.7061, lon: -73.9969, headingDeg: 60, pitchDeg: -8, fovDeg: 85, feedType: 'image' },
  { id: 'nyc-grand-ctl', name: 'Grand Central 42nd St', city: 'New York', cityId: 'nyc', lat: 40.7527, lon: -73.9772, headingDeg: 270, pitchDeg: -10, fovDeg: 75, feedType: 'image' },
  { id: 'nyc-hudson-yds', name: 'Hudson Yards Vessel', city: 'New York', cityId: 'nyc', lat: 40.7538, lon: -74.0022, headingDeg: 120, pitchDeg: -15, fovDeg: 80, feedType: 'image' },

  // San Francisco
  { id: 'sf-market-4th', name: 'Market St & 4th St', city: 'San Francisco', cityId: 'sf', lat: 37.7858, lon: -122.4065, headingDeg: 45, pitchDeg: -12, fovDeg: 75, feedType: 'image' },
  { id: 'sf-embarcadero', name: 'Embarcadero & Ferry Bldg', city: 'San Francisco', cityId: 'sf', lat: 37.7955, lon: -122.3937, headingDeg: 90, pitchDeg: -10, fovDeg: 80, feedType: 'image' },
  { id: 'sf-golden-gate', name: 'Golden Gate Bridge Toll', city: 'San Francisco', cityId: 'sf', lat: 37.8078, lon: -122.4751, headingDeg: 0, pitchDeg: -8, fovDeg: 85, feedType: 'image' },
  { id: 'sf-fishermans', name: 'Fisherman Wharf Pier 39', city: 'San Francisco', cityId: 'sf', lat: 37.8087, lon: -122.4098, headingDeg: 315, pitchDeg: -10, fovDeg: 75, feedType: 'image' },

  // London
  { id: 'ldn-trafalgar', name: 'Trafalgar Square Nelson', city: 'London', cityId: 'london', lat: 51.5080, lon: -0.1281, headingDeg: 180, pitchDeg: -10, fovDeg: 80, feedType: 'image' },
  { id: 'ldn-oxford-circ', name: 'Oxford Circus Crossing', city: 'London', cityId: 'london', lat: 51.5152, lon: -0.1419, headingDeg: 90, pitchDeg: -12, fovDeg: 75, feedType: 'image' },
  { id: 'ldn-bridge', name: 'London Bridge Southwark', city: 'London', cityId: 'london', lat: 51.5079, lon: -0.0877, headingDeg: 0, pitchDeg: -9, fovDeg: 80, feedType: 'image' },

  // Tokyo
  { id: 'tky-shibuya', name: 'Shibuya Scramble Crossing', city: 'Tokyo', cityId: 'tokyo', lat: 35.6595, lon: 139.7005, headingDeg: 330, pitchDeg: -15, fovDeg: 85, feedType: 'image' },
  { id: 'tky-shinjuku', name: 'Shinjuku East Gate Crossing', city: 'Tokyo', cityId: 'tokyo', lat: 35.6917, lon: 139.7013, headingDeg: 90, pitchDeg: -12, fovDeg: 80, feedType: 'image' },
  { id: 'tky-ginza', name: 'Ginza 4-Chome Wako', city: 'Tokyo', cityId: 'tokyo', lat: 35.6713, lon: 139.7650, headingDeg: 210, pitchDeg: -10, fovDeg: 75, feedType: 'image' }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = String(req.url || '');
  const urlObj = new URL(url, 'http://localhost');
  const pathParam = urlObj.searchParams.get('path') || '';
  const idParam = urlObj.searchParams.get('id') || '';

  // Handle frame requests: /api/cctv/frame/:id or ?path=frame
  if (url.includes('/frame') || pathParam === 'frame') {
    const rawId = idParam || url.split('/frame/')[1]?.split('?')[0] || 'CAM-01';
    const camera = GLOBAL_CAMERAS.find(c => c.id === rawId);
    const label = urlObj.searchParams.get('label') || camera?.name || rawId;
    const city = urlObj.searchParams.get('city') || camera?.city || 'METRO GRID';

    const svg = buildSyntheticCctvSvg(rawId, label, city);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).send(svg);
  }

  // Handle sources
  if (url.includes('/sources') || pathParam === 'sources') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ sources: GLOBAL_CAMERAS });
  }

  // Handle health
  if (url.includes('/health') || pathParam === 'health') {
    const cameras = GLOBAL_CAMERAS.map(c => ({ id: c.id, status: 'ok', sourceKind: 'synthetic' }));
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ cameras });
  }

  // Media fallback
  if (url.includes('/media') || pathParam === 'media') {
    const rawId = idParam || 'CAM-01';
    const svg = buildSyntheticCctvSvg(rawId, 'MEDIA FEED');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);
  }

  return res.status(200).json({ ok: true, count: GLOBAL_CAMERAS.length });
};
