/**
 * CCTV Serverless Handler for Divine's Eye on Vercel
 * Provides camera sources, health status, and live frame synthesis (HUD SVG fallback).
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
    const label = urlObj.searchParams.get('label') || rawId;
    const city = urlObj.searchParams.get('city') || 'LOCAL REGION';

    const svg = buildSyntheticCctvSvg(rawId, label, city);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.status(200).send(svg);
  }

  // Handle sources
  if (url.includes('/sources') || pathParam === 'sources') {
    // Austin & NYC preset cameras
    const sources = [
      { id: 'aust-ch-17', name: 'Congress Ave & 6th St', city: 'Austin', cityId: 'austin', lat: 30.2687, lon: -97.7428, headingDeg: 0, pitchDeg: -10, fovDeg: 75, feedType: 'image' },
      { id: 'aust-ch-18', name: 'Lamar Blvd & 5th St', city: 'Austin', cityId: 'austin', lat: 30.2704, lon: -97.7584, headingDeg: 90, pitchDeg: -8, fovDeg: 70, feedType: 'image' },
      { id: 'aust-ch-19', name: 'Barton Springs & S 1st', city: 'Austin', cityId: 'austin', lat: 30.2582, lon: -97.7485, headingDeg: 45, pitchDeg: -12, fovDeg: 80, feedType: 'image' },
      { id: 'nyc-midtown-w', name: 'Times Square & 42nd St', city: 'New York', cityId: 'nyc', lat: 40.7563, lon: -73.9863, headingDeg: 210, pitchDeg: -15, fovDeg: 75, feedType: 'image' }
    ];
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ sources });
  }

  // Handle health
  if (url.includes('/health') || pathParam === 'health') {
    return res.status(200).json({
      cameras: [
        { id: 'aust-ch-17', status: 'ok', sourceKind: 'synthetic' },
        { id: 'aust-ch-18', status: 'ok', sourceKind: 'synthetic' },
        { id: 'aust-ch-19', status: 'ok', sourceKind: 'synthetic' },
        { id: 'nyc-midtown-w', status: 'ok', sourceKind: 'synthetic' }
      ]
    });
  }

  // Media fallback
  if (url.includes('/media') || pathParam === 'media') {
    const rawId = idParam || 'CAM-01';
    const svg = buildSyntheticCctvSvg(rawId, 'MEDIA FEED');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.status(200).send(svg);
  }

  return res.status(200).json({ ok: true });
};
