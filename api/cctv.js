/**
 * CCTV API Stub for Divine's Eye on Vercel
 * Returns valid empty responses for CCTV endpoints so the UI
 * degrades gracefully instead of throwing 404 errors.
 *
 * Endpoints (matched via vercel.json rewrites):
 *   GET /api/cctv/sources  → { sources: [] }
 *   GET /api/cctv/health   → { cameras: [] }
 *   GET /api/cctv/frame    → { ok: false }
 *   GET /api/cctv/media    → { ok: false }
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = String(req.url || '');

  if (url.includes('/sources')) {
    return res.status(200).json({ sources: [] });
  }
  if (url.includes('/health')) {
    return res.status(200).json({ cameras: [], ok: true });
  }
  if (url.includes('/frame') || url.includes('/media')) {
    return res.status(200).json({ ok: false, reason: 'No CCTV backend configured' });
  }

  return res.status(200).json({ ok: false });
};
