class FlightManager {
  constructor(globeManager) {
    this.globe = globeManager;
    this.flightEntities = new Map();
    this.arcEntities = [];
    this.rawFlights = [];
    this.apiIndex = 0;
    this.cache = { data: null, ts: 0 };
    this.visible = true;
    this.opacity = 1.0;
  }

  async fetchFlights() {
    const now = Date.now();
    if (this.cache.data && now - this.cache.ts < 12000) return this.cache.data;

    const apis = CONFIG.FLIGHT_APIS;
    for (let i = 0; i < apis.length; i++) {
      const idx = (this.apiIndex + i) % apis.length;
      try {
        const res = await fetch(apis[idx], { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const json = await res.json();
        const flights = this._parseAdsbLol(json);
        if (flights.length > 0) {
          this.apiIndex = idx;
          this.cache = { data: flights, ts: now };
          return flights;
        }
      } catch { continue; }
    }

    // Fallback to OpenSky
    try {
      const res = await fetch(CONFIG.OPENSKY_URL, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const json = await res.json();
        const flights = this._parseOpenSky(json);
        this.cache = { data: flights, ts: now };
        return flights;
      }
    } catch { }

    return this.cache.data || [];
  }

  _parseAdsbLol(json) {
    const arr = json.ac || json.aircraft || json.states || [];
    return arr.filter(a => a.lat && a.lon).map(a => ({
      icao: a.hex || a.icao24 || '',
      callsign: (a.flight || a.callsign || '').trim(),
      lat: parseFloat(a.lat),
      lon: parseFloat(a.lon),
      alt: parseFloat(a.alt_baro || a.altitude || a.geo_altitude || 0),
      speed: parseFloat(a.gs || a.velocity || 0),
      heading: parseFloat(a.track || a.true_track || 0),
      origin: a.dep || a.origin_country || '',
      dest: a.arr || ''
    }));
  }

  _parseOpenSky(json) {
    if (!json.states) return [];
    return json.states.filter(s => s[5] && s[6]).map(s => ({
      icao: s[0] || '',
      callsign: (s[1] || '').trim(),
      lat: parseFloat(s[6]),
      lon: parseFloat(s[5]),
      alt: parseFloat(s[13] || s[7] || 0),
      speed: parseFloat(s[9] || 0),
      heading: parseFloat(s[10] || 0),
      origin: s[2] || '',
      dest: ''
    }));
  }

  async update(mode) {
    const flights = await this.fetchFlights();
    this.rawFlights = flights;
    this._render(flights, mode);
    return flights;
  }

  _render(flights, mode) {
    const viewer = this.globe.viewer;
    const isStorm = mode === CONFIG.MODES.STORM;
    const isTransit = mode === CONFIG.MODES.TRANSIT;

    // Remove old entities
    this.flightEntities.forEach(e => viewer.entities.remove(e));
    this.flightEntities.clear();
    this.arcEntities.forEach(e => viewer.entities.remove(e));
    this.arcEntities = [];

    const limited = flights.slice(0, CONFIG.MAX_FLIGHTS_DISPLAY);
    const alpha = isStorm ? 0.25 : 1.0;
    const dotColor = Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT).withAlpha(alpha);
    const arcColor = Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT_ARC).withAlpha(alpha * 0.6);

    limited.forEach(f => {
      if (!isFinite(f.lat) || !isFinite(f.lon)) return;
      const alt = Math.max(f.alt * 0.3048, 1000); // feet to meters
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(f.lon, f.lat, alt),
        point: {
          pixelSize: isTransit ? 3 : 2,
          color: dotColor,
          outlineColor: Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT).withAlpha(alpha * 0.4),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.NONE,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, isTransit ? 15000000 : 10000000)
        },
        label: f.callsign ? {
          text: f.callsign,
          font: '10px Space Mono, monospace',
          fillColor: Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT).withAlpha(alpha),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2000000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        } : undefined,
        description: JSON.stringify(f)
      });
      this.flightEntities.set(f.icao, entity);
    });

    // Draw arcs for popular corridors
    if (!isStorm) {
      this._drawCorridorArcs(arcColor);
    }
  }

  _drawCorridorArcs(arcColor) {
    const corridors = [
      { from: [72.8, 19.0], to: [55.3, 25.2], name: 'BOM-DXB' },
      { from: [-73.7, 40.6], to: [-0.4, 51.4], name: 'JFK-LHR' },
      { from: [77.1, 28.5], to: [103.9, 1.3], name: 'DEL-SIN' },
      { from: [2.5, 48.9], to: [151.1, -33.8], name: 'CDG-SYD' },
      { from: [-87.9, 41.9], to: [139.8, 35.5], name: 'ORD-NRT' },
      { from: [100.7, 13.9], to: [103.9, 1.3], name: 'BKK-SIN' },
      { from: [28.8, 41.0], to: [-73.7, 40.6], name: 'IST-JFK' },
      { from: [8.5, 47.4], to: [-73.7, 40.6], name: 'ZRH-JFK' },
      { from: [72.8, 19.0], to: [77.1, 28.5], name: 'BOM-DEL' },
      { from: [144.8, -37.6], to: [151.1, -33.8], name: 'MEL-SYD' }
    ];

    corridors.forEach(c => {
      const pts = this._buildArc(c.from[0], c.from[1], c.to[0], c.to[1], 60);
      const arc = this.globe.viewer.entities.add({
        polyline: {
          positions: pts,
          width: 1.5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            taperPower: 0.5,
            color: arcColor
          }),
          clampToGround: false
        }
      });
      this.arcEntities.push(arc);
    });
  }

  _buildArc(lon1, lat1, lon2, lat2, steps = 50) {
    const pts = [];
    const maxH = Cesium.Cartesian3.distance(
      Cesium.Cartesian3.fromDegrees(lon1, lat1),
      Cesium.Cartesian3.fromDegrees(lon2, lat2)
    ) * CONFIG.ARC_HEIGHT_FACTOR;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lon = lon1 + (lon2 - lon1) * t;
      const lat = lat1 + (lat2 - lat1) * t;
      const h = Math.sin(Math.PI * t) * maxH;
      pts.push(Cesium.Cartesian3.fromDegrees(lon, lat, h));
    }
    return pts;
  }

  findByCallsign(query) {
    const q = query.trim().toUpperCase();
    return this.rawFlights.filter(f => f.callsign && f.callsign.toUpperCase().includes(q));
  }

  getFlightsNear(lon, lat, radiusDeg = 10) {
    return this.rawFlights.filter(f =>
      Math.abs(f.lon - lon) < radiusDeg && Math.abs(f.lat - lat) < radiusDeg
    ).slice(0, 10);
  }

  setVisible(v) {
    this.visible = v;
    this.flightEntities.forEach(e => { e.show = v; });
    this.arcEntities.forEach(e => { e.show = v; });
  }
}
