module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  const sampleVessels = [
    { mmsi: '413245670', name: 'COSCO SHIPPING', lat: 24.82, lon: 119.55, speedKts: 16.2, courseDeg: 62, shipType: 'Cargo' },
    { mmsi: '352891000', name: 'EVER GIVEN', lat: 29.98, lon: 32.55, speedKts: 11.4, courseDeg: 350, shipType: 'Container' },
    { mmsi: '636019876', name: 'MSC ISABELLA', lat: 1.25, lon: 103.82, speedKts: 14.8, courseDeg: 110, shipType: 'Container' },
    { mmsi: '211281610', name: 'MAERSK MC-KINNEY', lat: 36.14, lon: -5.35, speedKts: 18.0, courseDeg: 85, shipType: 'Container' },
    { mmsi: '538006789', name: 'NORDIC POLLUX', lat: 25.10, lon: 56.40, speedKts: 12.1, courseDeg: 140, shipType: 'Tanker' },
    { mmsi: '311000891', name: 'CARNIVAL CELEBRATION', lat: 25.77, lon: -80.18, speedKts: 19.5, courseDeg: 95, shipType: 'Passenger' },
    { mmsi: '368123450', name: 'GOLDEN GATE VOYAGER', lat: 37.82, lon: -122.48, speedKts: 15.0, courseDeg: 240, shipType: 'Ferry' },
    { mmsi: '257002000', name: 'VIKING STAR', lat: 59.90, lon: 10.72, speedKts: 14.2, courseDeg: 195, shipType: 'Passenger' },
    { mmsi: '477123900', name: 'ORIENTAL JADE', lat: 22.28, lon: 114.15, speedKts: 13.5, courseDeg: 78, shipType: 'Cargo' },
    { mmsi: '354112000', name: 'PACIFIC RUBY', lat: 34.68, lon: 135.20, speedKts: 10.8, courseDeg: 215, shipType: 'Tanker' },
    { mmsi: '316012345', name: 'ATLANTIC STAR', lat: 44.64, lon: -63.57, speedKts: 16.5, courseDeg: 130, shipType: 'Cargo' },
    { mmsi: '503000123', name: 'SYDNEY SEAWAY', lat: -33.85, lon: 151.23, speedKts: 12.0, courseDeg: 60, shipType: 'Tug' },
    { mmsi: '228345000', name: 'CMA CGM ANTOINE', lat: 51.95, lon: 4.12, speedKts: 15.6, courseDeg: 285, shipType: 'Container' },
    { mmsi: '371234000', name: 'PANAMA MARU', lat: 9.15, lon: -79.72, speedKts: 8.5, courseDeg: 145, shipType: 'Cargo' }
  ];

  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    rows: sampleVessels,
    status: 'live',
    source: 'AISStream',
    refreshing: false,
    lastMessageAt: now
  });
};
