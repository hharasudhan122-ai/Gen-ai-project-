/**
 * BLACK ZONE - Tactical & Dark Intel Layers for Divine's Eye
 * Adds 3 keyless, worldwide data layers at the bottom of the Data Layers panel:
 *  1. 🍸 Nightlife & Bars (Pubs, Bars, Nightclubs, Liquor Stores via Overpass OSM)
 *  2. 🎯 Tactical & Armory (Gun Stores, Firearms, Hunting Outlets via Overpass OSM)
 *  3. ☣️ High-Threat / Homicide Zones (Global High-Homicide & Conflict Hotspots)
 */

(function initBlackZone() {
  // Global Homicide Hotspots & High-Threat Data (UNODC / CCPSC verified stats)
  const THREAT_HOTSPOTS = [
    { id: 'bz-colima', name: 'Colima Metro', country: 'Mexico', lat: 19.2452, lon: -103.7247, rate: 181.9, tier: 'CRITICAL SEVERE', desc: 'Highest global homicide rate corridor (Cartel transit flashpoint)', radiusKm: 28 },
    { id: 'bz-tijuana', name: 'Tijuana Border Corridor', country: 'Mexico', lat: 32.5149, lon: -117.0382, rate: 138.0, tier: 'CRITICAL SEVERE', desc: 'Active border cartel conflict & narcotics entry hub', radiusKm: 32 },
    { id: 'bz-juarez', name: 'Ciudad Juárez', country: 'Mexico', lat: 31.6904, lon: -106.4245, rate: 104.5, tier: 'CRITICAL SEVERE', desc: 'Historic border flashpoint & asymmetric cartel friction', radiusKm: 30 },
    { id: 'bz-celaya', name: 'Celaya Industrial Belt', country: 'Mexico', lat: 20.5218, lon: -100.8140, rate: 109.4, tier: 'CRITICAL SEVERE', desc: 'Guanajuato hydrocarbon extraction & turf conflict', radiusKm: 26 },
    { id: 'bz-haiti', name: 'Port-au-Prince Metro', country: 'Haiti', lat: 18.5944, lon: -72.3074, rate: 96.2, tier: 'CRITICAL SEVERE', desc: 'Widespread gang territorial control & infrastructure siege', radiusKm: 35 },
    { id: 'bz-guayaquil', name: 'Guayaquil Port Sector', country: 'Ecuador', lat: -2.1894, lon: -79.8891, rate: 88.8, tier: 'HIGH VOLATILITY', desc: 'Primary Pacific maritime cocaine dispatch hub', radiusKm: 30 },
    { id: 'bz-caracas', name: 'Caracas Urban Zone', country: 'Venezuela', lat: 10.4806, lon: -66.9036, rate: 76.3, tier: 'HIGH VOLATILITY', desc: 'High-density armed syndicate urban enclave', radiusKm: 30 },
    { id: 'bz-kingston', name: 'Kingston Downtown & West', country: 'Jamaica', lat: 17.9714, lon: -76.7936, rate: 64.1, tier: 'HIGH VOLATILITY', desc: 'Organized garrison gang political & turf flashpoints', radiusKm: 22 },
    { id: 'bz-capetown', name: 'Cape Flats / Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, rate: 63.4, tier: 'HIGH VOLATILITY', desc: 'Pervasive syndicate violence & tactical deployment zones', radiusKm: 32 },
    { id: 'bz-joburg', name: 'Johannesburg Central / Hillbrow', country: 'South Africa', lat: -26.2041, lon: 28.0473, rate: 58.0, tier: 'HIGH VOLATILITY', desc: 'Urban high-density armed crime & transit nexus', radiusKm: 28 },
    { id: 'bz-stlouis', name: 'St. Louis North & East', country: 'United States', lat: 38.6270, lon: -90.1994, rate: 57.2, tier: 'HIGH RISK METRO', desc: 'Elevated urban homicide & gun violence concentration', radiusKm: 22 },
    { id: 'bz-neworleans', name: 'New Orleans Metro Area', country: 'United States', lat: 29.9511, lon: -90.0715, rate: 52.8, tier: 'HIGH RISK METRO', desc: 'Port delta urban violence and homicide rate alert', radiusKm: 24 },
    { id: 'bz-baltimore', name: 'Baltimore West & East', country: 'United States', lat: 39.2904, lon: -76.6122, rate: 47.5, tier: 'HIGH RISK METRO', desc: 'Chronic armed syndicate activity and urban friction', radiusKm: 22 },
    { id: 'bz-cali', name: 'Cali Metro Sector', country: 'Colombia', lat: 3.4516, lon: -76.5320, rate: 45.1, tier: 'HIGH VOLATILITY', desc: 'Southwest corridor cartel logistics & illicit gold nexus', radiusKm: 26 },
    { id: 'bz-fortaleza', name: 'Fortaleza Maritime Belt', country: 'Brazil', lat: -3.7319, lon: -38.5267, rate: 42.6, tier: 'HIGH VOLATILITY', desc: 'Transatlantic cocaine transit route turf disputes', radiusKm: 28 },
    { id: 'bz-sanpedro', name: 'San Pedro Sula', country: 'Honduras', lat: 15.5042, lon: -88.0250, rate: 41.2, tier: 'HIGH VOLATILITY', desc: 'Northern triangle transit and extortion syndicate zone', radiusKm: 24 },
    { id: 'bz-detroit', name: 'Detroit Metro Core', country: 'United States', lat: 42.3314, lon: -83.0458, rate: 41.0, tier: 'TACTICAL ALERT', desc: 'Urban containment and structural high-crime sectors', radiusKm: 24 }
  ];

  let _viewer = null;
  let _barsPrimitives = null;
  let _armoryPrimitives = null;
  let _threatEntities = [];
  let _barsEnabled = false;
  let _armoryEnabled = false;
  let _threatEnabled = false;
  let _activeDebounce = null;
  let _lastFetchBounds = null;

  function injectStyles() {
    if (document.getElementById('blackzone-styles')) return;
    const style = document.createElement('style');
    style.id = 'blackzone-styles';
    style.textContent = `
      .blackzone-divider {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 16px 0 10px 0;
        padding: 0 4px;
        user-select: none;
      }
      .blackzone-divider .bz-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, rgba(239, 68, 68, 0.6), rgba(168, 85, 247, 0.4), transparent);
      }
      .blackzone-divider .bz-title {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 1.5px;
        color: #ff3366;
        text-shadow: 0 0 8px rgba(255, 51, 102, 0.6);
        text-transform: uppercase;
      }
      .bz-row {
        border-left: 2px solid transparent;
        transition: border-color 0.2s, background 0.2s;
      }
      .bz-row[data-layer-id="bz-bars"].active-bz {
        border-left-color: #d946ef;
        background: rgba(217, 70, 239, 0.08);
      }
      .bz-row[data-layer-id="bz-armory"].active-bz {
        border-left-color: #f97316;
        background: rgba(249, 115, 22, 0.08);
      }
      .bz-row[data-layer-id="bz-threat"].active-bz {
        border-left-color: #ef4444;
        background: rgba(239, 68, 68, 0.12);
      }
      .bz-badge-threat {
        color: #ef4444 !important;
        font-weight: 700;
        text-shadow: 0 0 6px rgba(239, 68, 68, 0.7);
      }
      .bz-tooltip {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 15, 24, 0.95);
        border: 1px solid #ff3366;
        box-shadow: 0 0 20px rgba(255, 51, 102, 0.4);
        padding: 10px 18px;
        border-radius: 6px;
        color: #fff;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        pointer-events: none;
        display: none;
        max-width: 90vw;
      }
    `;
    document.head.appendChild(style);
  }

  function getCameraBounds(viewer) {
    if (!viewer?.camera) return null;
    const rect = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
    if (!rect) return null;
    return {
      south: Cesium.Math.toDegrees(rect.south),
      west: Cesium.Math.toDegrees(rect.west),
      north: Cesium.Math.toDegrees(rect.north),
      east: Cesium.Math.toDegrees(rect.east),
      altitude: Math.round(viewer.camera.positionCartographic?.height || 5000)
    };
  }

  async function fetchOverpassNodes(query) {
    try {
      const res = await fetch('/api/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(12000)
      });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json?.elements) ? json.elements : [];
    } catch {
      return [];
    }
  }

  // "?"? Bars & Nightlife Layer "?"?
  async function refreshBars(viewer) {
    if (!_barsEnabled || !_viewer) return;
    const b = getCameraBounds(viewer);
    if (!b || b.altitude > 12000) {
      if (_barsPrimitives) _barsPrimitives.removeAll();
      updateToggleCount('bz-bars', b?.altitude > 12000 ? 'ALT > 12km' : '0');
      return;
    }

    const query = `[out:json][timeout:15];(node["amenity"~"bar|pub|nightclub"](${b.south.toFixed(4)},${b.west.toFixed(4)},${b.north.toFixed(4)},${b.east.toFixed(4)});node["shop"~"alcohol|beverages|wine|beer"](${b.south.toFixed(4)},${b.west.toFixed(4)},${b.north.toFixed(4)},${b.east.toFixed(4)}););out center 160;`;
    updateToggleCount('bz-bars', 'SCANNING');
    const nodes = await fetchOverpassNodes(query);
    if (!_barsEnabled) return;

    if (!_barsPrimitives) {
      _barsPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
    }
    _barsPrimitives.removeAll();

    const magenta = Cesium.Color.fromCssColorString('#d946ef');
    const violet = Cesium.Color.fromCssColorString('#a855f7');

    let count = 0;
    for (const n of nodes) {
      if (!Number.isFinite(n.lat) || !Number.isFinite(n.lon)) continue;
      const isClub = n.tags?.amenity === 'nightclub';
      const isLiquor = !!n.tags?.shop;
      const name = n.tags?.name || (isLiquor ? 'Liquor Store' : isClub ? 'Nightclub' : 'Bar / Pub');

      _barsPrimitives.add({
        position: Cesium.Cartesian3.fromDegrees(n.lon, n.lat, 2.0),
        color: isClub ? magenta : violet,
        pixelSize: isClub ? 9 : 7,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1.5,
        id: { kind: 'bar', name, tags: n.tags, lat: n.lat, lon: n.lon }
      });
      count++;
    }

    updateToggleCount('bz-bars', `${count}`);
    viewer.scene.requestRender?.();
  }

  // "?"? Armory & Gun Stores Layer "?"?
  async function refreshArmory(viewer) {
    if (!_armoryEnabled || !_viewer) return;
    const b = getCameraBounds(viewer);
    if (!b || b.altitude > 30000) {
      if (_armoryPrimitives) _armoryPrimitives.removeAll();
      updateToggleCount('bz-armory', b?.altitude > 30000 ? 'ALT > 30km' : '0');
      return;
    }

    const query = `[out:json][timeout:15];(node["shop"~"weapons|hunting|guns|ammunition"](${b.south.toFixed(4)},${b.west.toFixed(4)},${b.north.toFixed(4)},${b.east.toFixed(4)});node["amenity"~"shooting_range"](${b.south.toFixed(4)},${b.west.toFixed(4)},${b.north.toFixed(4)},${b.east.toFixed(4)}););out center 120;`;
    updateToggleCount('bz-armory', 'SCANNING');
    const nodes = await fetchOverpassNodes(query);
    if (!_armoryEnabled) return;

    if (!_armoryPrimitives) {
      _armoryPrimitives = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
    }
    _armoryPrimitives.removeAll();

    const tacticalAmber = Cesium.Color.fromCssColorString('#f97316');
    let count = 0;
    for (const n of nodes) {
      if (!Number.isFinite(n.lat) || !Number.isFinite(n.lon)) continue;
      const isRange = n.tags?.amenity === 'shooting_range';
      const name = n.tags?.name || (isRange ? 'Shooting Range' : 'Firearms & Armory');

      _armoryPrimitives.add({
        position: Cesium.Cartesian3.fromDegrees(n.lon, n.lat, 3.0),
        color: tacticalAmber,
        pixelSize: 8,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        id: { kind: 'armory', name, tags: n.tags, lat: n.lat, lon: n.lon }
      });
      count++;
    }

    updateToggleCount('bz-armory', `${count}`);
    viewer.scene.requestRender?.();
  }

  // "?"? High-Threat & Homicide Hotspots (Worldwide Threat Rings) "?"?
  function toggleThreatZones(enable) {
    _threatEnabled = enable;
    if (!_viewer) return;

    if (!enable) {
      _threatEntities.forEach(e => _viewer.entities.remove(e));
      _threatEntities = [];
      updateToggleCount('bz-threat', 'OFF');
      _viewer.scene.requestRender?.();
      return;
    }

    const redAlpha = Cesium.Color.RED.withAlpha(0.22);
    const redOutline = Cesium.Color.fromCssColorString('#ff2255');

    THREAT_HOTSPOTS.forEach(spot => {
      // Threat circle
      const circle = _viewer.entities.add({
        id: spot.id,
        name: spot.name,
        position: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 0),
        ellipse: {
          semiMinorAxis: spot.radiusKm * 1000,
          semiMajorAxis: spot.radiusKm * 1000,
          material: redAlpha,
          outline: true,
          outlineColor: redOutline,
          outlineWidth: 2.5,
          height: 0
        },
        description: `
          <div style="font-family:monospace;padding:8px">
            <h3 style="color:#ff3366;margin:0 0 6px 0">? ${spot.name}</h3>
            <p style="margin:2px 0"><strong>Threat Tier:</strong> <span style="color:#ff5555">${spot.tier}</span></p>
            <p style="margin:2px 0"><strong>Homicide Rate:</strong> ${spot.rate} per 100k</p>
            <p style="margin:2px 0"><strong>Context:</strong> ${spot.desc}</p>
          </div>
        `
      });

      // Label at center
      const label = _viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(spot.lon, spot.lat, 800),
        point: {
          pixelSize: 10,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2
        },
        label: {
          text: `? ${spot.name} (${spot.rate}/100k)`,
          font: 'bold 11px monospace',
          fillColor: Cesium.Color.fromCssColorString('#ff4d6d'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 15000000)
        }
      });

      _threatEntities.push(circle, label);
    });

    updateToggleCount('bz-threat', `${THREAT_HOTSPOTS.length} ZONES`);
    _viewer.scene.requestRender?.();
  }

  function updateToggleCount(layerId, countStr) {
    const row = document.querySelector(`.bz-row[data-layer-id="${layerId}"]`);
    if (row) {
      const countEl = row.querySelector('.data-count');
      if (countEl) countEl.textContent = countStr;
    }
  }

  function onCameraMove() {
    if (!_viewer) return;
    clearTimeout(_activeDebounce);
    _activeDebounce = setTimeout(() => {
      if (_barsEnabled) refreshBars(_viewer);
      if (_armoryEnabled) refreshArmory(_viewer);
    }, 400);
  }

  function createToggleRow(id, icon, name, initialCount = 'OFF') {
    const row = document.createElement('div');
    row.className = 'data-toggle-row bz-row';
    row.dataset.layerId = id;

    const top = document.createElement('div');
    top.className = 'data-toggle-top';

    const left = document.createElement('div');
    left.className = 'data-toggle-left';
    left.innerHTML = `<span class="data-icon">${icon}</span><span class="data-name">${name}</span>`;

    const right = document.createElement('div');
    right.className = 'data-toggle-right';

    const count = document.createElement('span');
    count.className = 'data-count';
    count.textContent = initialCount;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'data-toggle-btn';
    btn.textContent = 'OFF';

    btn.addEventListener('click', () => {
      const isNowActive = !btn.classList.contains('active');
      btn.classList.toggle('active', isNowActive);
      row.classList.toggle('active-bz', isNowActive);
      btn.textContent = isNowActive ? 'ON' : 'OFF';

      if (id === 'bz-bars') {
        _barsEnabled = isNowActive;
        if (!isNowActive && _barsPrimitives) _barsPrimitives.removeAll();
        if (isNowActive && _viewer) refreshBars(_viewer);
        if (!isNowActive) count.textContent = 'OFF';
      } else if (id === 'bz-armory') {
        _armoryEnabled = isNowActive;
        if (!isNowActive && _armoryPrimitives) _armoryPrimitives.removeAll();
        if (isNowActive && _viewer) refreshArmory(_viewer);
        if (!isNowActive) count.textContent = 'OFF';
      } else if (id === 'bz-threat') {
        toggleThreatZones(isNowActive);
      }
    });

    right.appendChild(count);
    right.appendChild(btn);
    top.appendChild(left);
    top.appendChild(right);
    row.appendChild(top);
    return row;
  }

  function mountBlackZoneUI() {
    const list = document.getElementById('data-toggles');
    if (!list) {
      setTimeout(mountBlackZoneUI, 300);
      return;
    }

    if (document.getElementById('bz-divider')) return; // already mounted

    injectStyles();

    // Divider
    const divider = document.createElement('div');
    divider.id = 'bz-divider';
    divider.className = 'blackzone-divider';
    divider.innerHTML = `
      <div class="bz-line"></div>
      <span class="bz-title">▲ BLACK ZONE (TACTICAL INTEL)</span>
      <div class="bz-line"></div>
    `;
    list.appendChild(divider);

    // 1. Nightlife & Bars
    const barsRow = createToggleRow('bz-bars', '🍸', 'Nightlife & Bars');
    list.appendChild(barsRow);

    // 2. Tactical & Armory
    const armoryRow = createToggleRow('bz-armory', '🎯', 'Tactical & Armory');
    list.appendChild(armoryRow);

    // 3. High-Threat Zones
    const threatRow = createToggleRow('bz-threat', '☣️', 'High-Threat Zones');
    list.appendChild(threatRow);

    // Hover tooltip for blips
    const tip = document.createElement('div');
    tip.id = 'bz-tooltip';
    tip.className = 'bz-tooltip';
    document.body.appendChild(tip);

    if (_viewer?.screenSpaceEventHandler) {
      const handler = new Cesium.ScreenSpaceEventHandler(_viewer.scene.canvas);
      handler.setInputAction((movement) => {
        const picked = _viewer.scene.pick(movement.endPosition);
        if (picked?.primitive?.id && typeof picked.primitive.id === 'object') {
          const data = picked.primitive.id;
          tip.style.display = 'block';
          tip.innerHTML = `<strong>${data.name}</strong><br><small style="color:#aaa">${data.kind.toUpperCase()} // LAT:${data.lat?.toFixed(3)} LON:${data.lon?.toFixed(3)}</small>`;
        } else {
          tip.style.display = 'none';
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }
  }

  function start(viewer) {
    _viewer = viewer;
    mountBlackZoneUI();
    viewer.camera.moveEnd.addEventListener(onCameraMove);
  }

  if (window.gevViewer) {
    start(window.gevViewer);
  } else {
    window.__onViewerReady = start;
    // Fallback poll
    const check = setInterval(() => {
      if (window.gevViewer) {
        clearInterval(check);
        start(window.gevViewer);
      }
    }, 250);
  }
})();
