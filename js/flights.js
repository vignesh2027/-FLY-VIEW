class FlightManager {
  constructor(globeManager) {
    this.globe        = globeManager;
    this.dotEntities  = new Map();  // icao → entity
    this.arcEntities  = [];
    this.trailEntities= [];
    this.rawFlights   = [];
    this.apiIndex     = 0;
    this.cache        = { data: null, ts: 0 };
    this._animTimer   = null;
    this._frameId     = null;
  }

  async fetchFlights() {
    const now = Date.now();
    if (this.cache.data && now - this.cache.ts < 10000) return this.cache.data;

    const apis = CONFIG.FLIGHT_APIS;
    for (let i = 0; i < apis.length; i++) {
      const idx = (this.apiIndex + i) % apis.length;
      try {
        const res = await fetch(apis[idx], { signal: AbortSignal.timeout(8000) });
        if (!res.ok) continue;
        const json = await res.json();
        const fl = this._parseAdsb(json);
        if (fl.length > 50) {
          this.apiIndex = idx;
          this.cache = { data: fl, ts: now };
          return fl;
        }
      } catch { continue; }
    }

    // OpenSky fallback
    try {
      const res = await fetch(CONFIG.OPENSKY_URL, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const json = await res.json();
        const fl = this._parseOpenSky(json);
        this.cache = { data: fl, ts: now };
        return fl;
      }
    } catch { }

    return this.cache.data || [];
  }

  _parseAdsb(json) {
    const arr = json.ac || json.aircraft || json.states || [];
    return arr
      .filter(a => a.lat != null && a.lon != null)
      .map(a => ({
        icao:     (a.hex || a.icao24 || '').toLowerCase(),
        callsign: (a.flight || a.callsign || '').trim(),
        lat:      parseFloat(a.lat),
        lon:      parseFloat(a.lon),
        alt:      parseFloat(a.alt_baro || a.alt_geom || a.altitude || a.geo_altitude || 0),
        speed:    parseFloat(a.gs || a.velocity || 0),
        heading:  parseFloat(a.track || a.true_track || 0),
        vspeed:   parseFloat(a.baro_rate || a.vertical_rate || 0),
        origin:   a.dep || a.origin_country || '',
        dest:     a.arr || '',
        squawk:   a.squawk || '',
        category: a.category || '',
      }))
      .filter(f => isFinite(f.lat) && isFinite(f.lon));
  }

  _parseOpenSky(json) {
    if (!json.states) return [];
    return json.states
      .filter(s => s[5] != null && s[6] != null)
      .map(s => ({
        icao:    (s[0] || '').toLowerCase(),
        callsign:(s[1] || '').trim(),
        lat:     parseFloat(s[6]),
        lon:     parseFloat(s[5]),
        alt:     parseFloat(s[13] || s[7] || 0),
        speed:   parseFloat(s[9] || 0),
        heading: parseFloat(s[10] || 0),
        vspeed:  parseFloat(s[11] || 0),
        origin:  s[2] || '',
        dest:    '',
        squawk:  s[14] || '',
        category:''
      }))
      .filter(f => isFinite(f.lat) && isFinite(f.lon));
  }

  async update(mode) {
    const flights = await this.fetchFlights();
    this.rawFlights = flights;
    this._render(flights, mode);
    return flights;
  }

  _render(flights, mode) {
    const viewer  = this.globe.viewer;
    const isStorm = mode === CONFIG.MODES.STORM;

    // Remove old entities
    this.dotEntities.forEach(e => viewer.entities.remove(e));
    this.dotEntities.clear();
    this.arcEntities.forEach(e => viewer.entities.remove(e));
    this.arcEntities = [];
    this.trailEntities.forEach(e => viewer.entities.remove(e));
    this.trailEntities = [];

    const limited   = flights.slice(0, CONFIG.MAX_FLIGHTS_DISPLAY);
    const baseAlpha = isStorm ? 0.22 : 1.0;

    // ── Draw aircraft dots ──
    limited.forEach(f => {
      const alt    = Math.max(isFinite(f.alt) ? f.alt * 0.3048 : 0, 500); // ft → m
      const speed  = f.speed || 0;
      const isHigh = alt > 9000;  // cruising altitude
      const isFast = speed > 400;

      // Colour: brighter yellow for high/fast, dimmer for ground
      const brightness = isHigh ? 1.0 : 0.55;
      const dotColor   = isHigh
        ? Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT).withAlpha(baseAlpha * brightness)
        : Cesium.Color.fromCssColorString('#FFA500').withAlpha(baseAlpha * 0.6);

      const pixelSize = isHigh
        ? (isFast ? 4 : 3)
        : 2;

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(f.lon, f.lat, alt),
        point: {
          pixelSize,
          color: dotColor,
          outlineColor: dotColor.withAlpha(0.3),
          outlineWidth: pixelSize > 3 ? 2 : 1,
          heightReference: Cesium.HeightReference.NONE,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 14000000)
        },
        label: (f.callsign && !isStorm) ? {
          text: f.callsign,
          font: '9px Space Mono,monospace',
          fillColor: Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT).withAlpha(0.9),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -13),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1800000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        } : undefined,
        description: JSON.stringify(f)
      });
      this.dotEntities.set(f.icao || Math.random().toString(36), entity);
    });

    // ── Draw corridor arcs ──
    this._drawArcs(isStorm);

    // ── Moving dot animation along corridors ──
    if (!isStorm) this._startCorridorAnimation();
  }

  _drawArcs(isStorm) {
    const viewer = this.globe.viewer;
    const corridors = this._corridorDefs();
    const alpha = isStorm ? 0.12 : 0.55;

    corridors.forEach(c => {
      const pts = this._buildArc(c.from[0], c.from[1], c.to[0], c.to[1], 80);

      // Main glow arc
      const arc = viewer.entities.add({
        polyline: {
          positions: pts,
          width: isStorm ? 0.8 : c.weight * 1.8,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            taperPower: 0.6,
            color: Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT_ARC).withAlpha(alpha)
          }),
          clampToGround: false,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 25000000)
        }
      });
      this.arcEntities.push(arc);

      // Thin core line for crisp look
      if (!isStorm) {
        const core = viewer.entities.add({
          polyline: {
            positions: pts,
            width: 0.6,
            material: new Cesium.ColorMaterialProperty(
              Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT).withAlpha(0.35)
            ),
            clampToGround: false,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000000)
          }
        });
        this.arcEntities.push(core);
      }
    });
  }

  _startCorridorAnimation() {
    cancelAnimationFrame(this._frameId);
    const viewer    = this.globe.viewer;
    const corridors = this._corridorDefs();

    // One animated traveller per corridor
    const travellers = corridors.map(c => {
      const pts = this._buildArc(c.from[0], c.from[1], c.to[0], c.to[1], 80);
      const entity = viewer.entities.add({
        position: pts[0],
        point: {
          pixelSize: 5,
          color: Cesium.Color.fromCssColorString(CONFIG.COLORS.FLIGHT).withAlpha(0.95),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 22000000)
        }
      });
      this.trailEntities.push(entity);
      return { pts, t: Math.random(), speed: c.speed || 0.0008, entity };
    });

    const animate = () => {
      travellers.forEach(tr => {
        tr.t = (tr.t + tr.speed) % 1;
        const idx = Math.floor(tr.t * (tr.pts.length - 1));
        if (tr.pts[idx]) tr.entity.position = tr.pts[idx];
      });
      this._frameId = requestAnimationFrame(animate);
    };
    this._frameId = requestAnimationFrame(animate);
  }

  _corridorDefs() {
    return [
      { from:[72.8, 19.0], to:[55.3, 25.2], weight:2.5, speed:0.0009, name:'BOM-DXB' },
      { from:[-73.7,40.6], to:[-0.4, 51.4], weight:3.0, speed:0.0007, name:'JFK-LHR' },
      { from:[77.1, 28.5], to:[103.9,  1.3], weight:2.0, speed:0.0008, name:'DEL-SIN' },
      { from:[2.5,  48.9], to:[151.1,-33.8], weight:1.5, speed:0.0005, name:'CDG-SYD' },
      { from:[-87.9,41.9], to:[139.8, 35.5], weight:1.8, speed:0.0006, name:'ORD-NRT' },
      { from:[100.7,13.9], to:[103.9,  1.3], weight:2.2, speed:0.0012, name:'BKK-SIN' },
      { from:[28.8, 41.0], to:[-73.7, 40.6], weight:2.0, speed:0.0007, name:'IST-JFK' },
      { from:[72.8, 19.0], to:[77.1,  28.5], weight:2.8, speed:0.0014, name:'BOM-DEL' },
      { from:[55.3, 25.2], to:[103.9,  1.3], weight:2.4, speed:0.0009, name:'DXB-SIN' },
      { from:[-73.7,40.6], to:[-43.2,-22.9], weight:1.6, speed:0.0008, name:'JFK-GRU' },
      { from:[2.5,  48.9], to:[77.1,  28.5], weight:1.8, speed:0.0007, name:'CDG-DEL' },
      { from:[139.8,35.5], to:[103.9,  1.3], weight:2.0, speed:0.0009, name:'NRT-SIN' },
      { from:[144.8,-37.6],to:[151.1,-33.8], weight:3.5, speed:0.0020, name:'MEL-SYD' },
      { from:[-73.7,40.6], to:[2.5,  48.9], weight:2.5, speed:0.0008, name:'JFK-CDG' },
      { from:[37.6, 55.7], to:[55.3, 25.2], weight:1.5, speed:0.0008, name:'SVO-DXB' },
    ];
  }

  _buildArc(lon1, lat1, lon2, lat2, steps = 80) {
    const pts = [];
    const dist = Cesium.Cartesian3.distance(
      Cesium.Cartesian3.fromDegrees(lon1, lat1),
      Cesium.Cartesian3.fromDegrees(lon2, lat2)
    );
    const maxH = dist * CONFIG.ARC_HEIGHT_FACTOR;

    for (let i = 0; i <= steps; i++) {
      const t   = i / steps;
      const lon = lon1 + (lon2 - lon1) * t;
      const lat = lat1 + (lat2 - lat1) * t;
      const h   = Math.sin(Math.PI * t) * maxH;
      pts.push(Cesium.Cartesian3.fromDegrees(lon, lat, Math.max(h, 2000)));
    }
    return pts;
  }

  findByCallsign(query) {
    const q = query.trim().toUpperCase();
    return this.rawFlights
      .filter(f => f.callsign && f.callsign.toUpperCase().includes(q))
      .slice(0, 15);
  }

  getFlightsNear(lon, lat, r = 10) {
    return this.rawFlights
      .filter(f => Math.abs(f.lon - lon) < r && Math.abs(f.lat - lat) < r)
      .sort((a, b) => (b.alt || 0) - (a.alt || 0))
      .slice(0, 10);
  }

  getTopCorridors() {
    return this._corridorDefs().map(c => ({
      name: c.name,
      count: Math.floor(Math.random() * 18 + 6)
    }));
  }

  destroy() {
    cancelAnimationFrame(this._frameId);
  }
}
