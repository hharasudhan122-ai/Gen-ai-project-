/**
 * TomTom Traffic Flow Status Endpoint for Divine's Eye on Vercel
 * Returns status to enable simulated traffic or live flow when TOMTOM_API_KEY is present.
 */

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const hasKey = Boolean(process.env.TOMTOM_API_KEY);
  const date = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    hasKey,
    dailyCount: 0,
    budget: 40000,
    date
  });
};
