class ThreatManager {
  constructor(globeManager) {
    this.globe = globeManager;
    this.threatEntities = [];
    this.pulseEntities  = [];
    this.threatData     = [];
    this.pulseData      = [];  // raw OTX pulses for feed
    this.cache          = { data: null, ts: 0 };
    this._pulseTimer    = null;
  }

  // Authenticated OTX headers
  _headers() {
    return { 'X-OTX-API-KEY': CONFIG.OTX_KEY, 'Accept': 'application/json' };
  }

  async fetchThreats() {
    const now = Date.now();
    if (this.cache.data && now - this.cache.ts < CONFIG.THREAT_REFRESH) return this.cache.data;

    // Try subscribed pulses (authenticated)
    try {
      const res = await fetch(
        `${CONFIG.OTX_BASE}/pulses/subscribed?limit=40&modified_since=${this._since(24)}`,
        { headers: this._headers(), signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const json = await res.json();
        this.pulseData = json.results || [];
        const parsed = this._parseOTXPulses(this.pulseData);
        if (parsed.length > 0) {
          this.cache = { data: parsed, ts: now };
          window.dispatchEvent(new CustomEvent('otxPulses', { detail: this.pulseData }));
          return parsed;
        }
      }
    } catch { }

    // Try activity feed
    try {
      const res = await fetch(
        `${CONFIG.OTX_BASE}/pulses/activity?limit=30`,
        { headers: this._headers(), signal: AbortSignal.timeout(10000) }
      );
      if (res.ok) {
        const json = await res.json();
        this.pulseData = json.results || [];
        const parsed = this._parseOTXPulses(this.pulseData);
        if (parsed.length > 0) {
          this.cache = { data: parsed, ts: now };
          window.dispatchEvent(new CustomEvent('otxPulses', { detail: this.pulseData }));
          return parsed;
        }
      }
    } catch { }

    // Fallback: rich static threat data
    const data = this._staticThreats();
    this.cache = { data, ts: now };
    return data;
  }

  _since(hours) {
    return new Date(Date.now() - hours * 3600000).toISOString().slice(0, 19);
  }

  _parseOTXPulses(pulses) {
    const countryCoords = this._coordsMap();
    const threats = [];

    pulses.forEach(p => {
      const countries = p.targeted_countries || [];
      const tags = p.tags || [];
      const type = this._classifyType(p.name, tags);
      const sev = this._calcSeverity(p);

      if (countries.length === 0) {
        // Use author country if available
        const fallback = this._geoFromName(p.name);
        if (fallback) countries.push(fallback);
      }

      countries.forEach(country => {
        const coords = countryCoords[country] || countryCoords[this._normalise(country)];
        if (!coords) return;
        threats.push({
          country,
          lat: coords[0] + (Math.random() - 0.5) * 2,
          lon: coords[1] + (Math.random() - 0.5) * 2,
          severity: sev,
          type,
          desc: p.description || p.name,
          indicators: p.indicator_count || 0,
          ts: p.modified || p.created,
          pulseId: p.id,
          pulseName: p.name,
          tags: tags.slice(0, 4)
        });
      });
    });

    // De-duplicate by country — keep highest severity
    const map = new Map();
    threats.forEach(t => {
      const key = t.country;
      if (!map.has(key) || map.get(key).severity < t.severity) map.set(key, t);
    });
    return Array.from(map.values()).sort((a, b) => b.severity - a.severity);
  }

  _calcSeverity(pulse) {
    let s = 3;
    const ioc = pulse.indicator_count || 0;
    if (ioc > 500) s += 4;
    else if (ioc > 200) s += 3;
    else if (ioc > 50)  s += 2;
    else if (ioc > 10)  s += 1;
    const tags = (pulse.tags || []).join(' ').toLowerCase();
    if (tags.includes('ransomware') || tags.includes('apt')) s += 2;
    if (tags.includes('critical') || tags.includes('government')) s += 1;
    // Modified recency boost
    const age = (Date.now() - new Date(pulse.modified || pulse.created).getTime()) / 3600000;
    if (age < 6) s += 1;
    return Math.min(10, Math.max(1, s));
  }

  _classifyType(name, tags) {
    const txt = `${name} ${tags.join(' ')}`.toLowerCase();
    if (txt.includes('ransomware')) return 'RANSOMWARE';
    if (txt.includes('apt') || txt.includes('espionage')) return 'APT';
    if (txt.includes('phishing')) return 'PHISHING';
    if (txt.includes('ddos')) return 'DDoS';
    if (txt.includes('malware') || txt.includes('trojan')) return 'MALWARE';
    if (txt.includes('botnet')) return 'BOTNET';
    if (txt.includes('crypto')) return 'CRYPTOJACKING';
    if (txt.includes('worm') || txt.includes('exploit')) return 'EXPLOIT';
    if (txt.includes('supply chain')) return 'SUPPLY CHAIN';
    if (txt.includes('zero-day') || txt.includes('0-day')) return 'ZERO-DAY';
    return 'THREAT';
  }

  _geoFromName(name) {
    const n = name.toLowerCase();
    const map = { 'russia':'Russia','china':'China','iran':'Iran','north korea':'North Korea','ukraine':'Ukraine','india':'India','usa':'United States','united states':'United States' };
    for (const [k, v] of Object.entries(map)) { if (n.includes(k)) return v; }
    return null;
  }

  _normalise(s) {
    return s.trim().replace(/^\w/, c => c.toUpperCase());
  }

  _staticThreats() {
    return [
      { country:'Russia',       lat:55.7, lon:37.6,   severity:9.2, type:'APT',           desc:'Sandworm & Cozy Bear active — targeting critical infrastructure across NATO states', indicators:840, ts:new Date(Date.now()-3600000).toISOString() },
      { country:'China',        lat:39.9, lon:116.4,  severity:8.8, type:'ESPIONAGE',      desc:'APT41 spear-phishing campaign against telecom and semiconductor firms', indicators:560, ts:new Date(Date.now()-5400000).toISOString() },
      { country:'North Korea',  lat:39.0, lon:125.7,  severity:9.5, type:'RANSOMWARE',     desc:'Lazarus Group targeting SWIFT banking nodes — $50M+ theft operation active', indicators:320, ts:new Date(Date.now()-1800000).toISOString() },
      { country:'Iran',         lat:35.7, lon:51.4,   severity:7.4, type:'DDoS',           desc:'Charming Kitten DDoS ops against Israeli and US energy infrastructure', indicators:210, ts:new Date(Date.now()-7200000).toISOString() },
      { country:'Ukraine',      lat:50.4, lon:30.5,   severity:10,  type:'CYBERWAR',       desc:'Continuous destructive wiper attacks on civilian and military networks', indicators:1200,ts:new Date(Date.now()-900000).toISOString() },
      { country:'Brazil',       lat:-15.8,lon:-47.9,  severity:5.2, type:'PHISHING',       desc:'Mass credential harvest targeting Pix instant payment users — 2M+ attempts', indicators:180, ts:new Date(Date.now()-10800000).toISOString() },
      { country:'India',        lat:28.6, lon:77.2,   severity:4.8, type:'PHISHING',       desc:'UPI fraud and impersonation of NPCI — surge in financial phishing', indicators:145, ts:new Date(Date.now()-14400000).toISOString() },
      { country:'United States',lat:38.9, lon:-77.0,  severity:6.5, type:'RANSOMWARE',     desc:'BlackBasta group deploying against US hospital networks — 3 incidents today', indicators:390, ts:new Date(Date.now()-3200000).toISOString() },
      { country:'Germany',      lat:52.5, lon:13.4,   severity:5.6, type:'APT',            desc:'Industrial espionage campaign targeting auto & defence sector via spear-phish', indicators:95,  ts:new Date(Date.now()-18000000).toISOString() },
      { country:'United Kingdom',lat:51.5,lon:-0.1,   severity:5.1, type:'PHISHING',       desc:'NHS credential phishing — fake patient portal domains mass-registered', indicators:88,  ts:new Date(Date.now()-21600000).toISOString() },
      { country:'Nigeria',      lat:9.0,  lon:7.5,    severity:6.1, type:'BEC',            desc:'BEC fraud ring — wire-transfer fraud targeting US and EU corporates', indicators:220, ts:new Date(Date.now()-5000000).toISOString() },
      { country:'Israel',       lat:31.8, lon:35.2,   severity:7.2, type:'APT',            desc:'Hacktivist coalition launching coordinated attacks on tech infrastructure', indicators:310, ts:new Date(Date.now()-4200000).toISOString() },
      { country:'South Korea',  lat:37.5, lon:127.0,  severity:5.8, type:'MALWARE',        desc:'Kimsuky group distributing trojanised policy research documents', indicators:170, ts:new Date(Date.now()-9000000).toISOString() },
      { country:'UAE',          lat:24.4, lon:54.4,   severity:4.5, type:'SCANNING',       desc:'Mass port scanning from UAE exit nodes targeting Gulf energy firms', indicators:65,  ts:new Date(Date.now()-28800000).toISOString() },
      { country:'Pakistan',     lat:33.7, lon:73.0,   severity:4.9, type:'MALWARE',        desc:'Transparent Tribe deploying Crimson RAT against Indian government targets', indicators:130, ts:new Date(Date.now()-12600000).toISOString() },
      { country:'Indonesia',    lat:-6.2, lon:106.8,  severity:4.7, type:'BOTNET',         desc:'Mirai variant C2 nodes detected — 40k+ compromised IoT devices', indicators:95,  ts:new Date(Date.now()-16200000).toISOString() },
      { country:'Vietnam',      lat:21.0, lon:105.8,  severity:4.2, type:'CRYPTOJACKING',  desc:'XMRig mass deployment via unpatched WebLogic and Exchange servers', indicators:75,  ts:new Date(Date.now()-22000000).toISOString() },
      { country:'Mexico',       lat:19.4, lon:-99.1,  severity:5.7, type:'RANSOMWARE',     desc:'Ransomware attack on federal government payroll systems — 6 agencies affected', indicators:160, ts:new Date(Date.now()-7800000).toISOString() },
      { country:'Turkey',       lat:39.9, lon:32.8,   severity:4.3, type:'DEFACEMENT',     desc:'Hacktivist web defacement wave — 200+ .gov.tr sites targeted', indicators:55,  ts:new Date(Date.now()-32000000).toISOString() },
      { country:'Saudi Arabia', lat:24.7, lon:46.7,   severity:5.0, type:'APT',            desc:'OilRig group deploying new implant against energy sector VPNs', indicators:110, ts:new Date(Date.now()-11000000).toISOString() },
    ];
  }

  _coordsMap() {
    return {
      'Russia':[55.7,37.6],'China':[39.9,116.4],'North Korea':[39.0,125.7],'Iran':[35.7,51.4],
      'Ukraine':[50.4,30.5],'Brazil':[-15.8,-47.9],'India':[28.6,77.2],'United States':[38.9,-77.0],
      'Germany':[52.5,13.4],'United Kingdom':[51.5,-0.1],'Nigeria':[9.0,7.5],'Israel':[31.8,35.2],
      'South Korea':[37.5,127.0],'UAE':[24.4,54.4],'Pakistan':[33.7,73.0],'Indonesia':[-6.2,106.8],
      'Vietnam':[21.0,105.8],'Mexico':[19.4,-99.1],'Turkey':[39.9,32.8],'Saudi Arabia':[24.7,46.7],
      'France':[48.8,2.3],'Japan':[35.7,139.7],'Australia':[-35.3,149.1],'Canada':[45.4,-75.7],
      'Singapore':[1.3,103.8],'Thailand':[13.7,100.5],'South Africa':[-25.7,28.2],
    };
  }

  async update(mode) {
    const threats = await this.fetchThreats();
    this.threatData = threats;
    this._render(threats, mode);
    return threats;
  }

  _render(threats, mode) {
    const viewer = this.globe.viewer;
    [...this.threatEntities, ...this.pulseEntities].forEach(e => viewer.entities.remove(e));
    this.threatEntities = [];
    this.pulseEntities  = [];

    if (mode === CONFIG.MODES.TRANSIT) return;

    const isStorm = mode === CONFIG.MODES.STORM;

    threats.forEach(t => {
      if (!t.lat || !t.lon) return;
      const sev   = Math.max(1, Math.min(10, t.severity));
      const isCrit = sev >= 8;
      const alpha  = isStorm ? 1.0 : 0.85;
      const dotSz  = isStorm ? sev * 9 : sev * 5.5;

      const baseColor = isCrit
        ? Cesium.Color.fromCssColorString(CONFIG.COLORS.THREAT_HIGH)
        : Cesium.Color.fromCssColorString(CONFIG.COLORS.THREAT);

      const dot = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(t.lon, t.lat, 30000 + sev * 15000),
        point: {
          pixelSize: dotSz,
          color: baseColor.withAlpha(alpha * 0.25),
          outlineColor: baseColor.withAlpha(alpha),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.NONE,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 22000000)
        },
        label: {
          text: `⚠ ${t.country}\n${t.type}`,
          font: isStorm ? 'bold 11px Space Mono,monospace' : '9px Space Mono,monospace',
          fillColor: baseColor.withAlpha(alpha),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -(dotSz + 10)),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, isStorm ? 18000000 : 6000000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        description: JSON.stringify(t)
      });
      this.threatEntities.push(dot);

      // Pulse ring for critical threats
      if (isCrit && isStorm) {
        const ring = viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(t.lon, t.lat, 0),
          ellipse: {
            semiMajorAxis: 400000 + sev * 60000,
            semiMinorAxis: 400000 + sev * 60000,
            height: 0,
            material: baseColor.withAlpha(0.07),
            outline: true,
            outlineColor: baseColor.withAlpha(0.4),
            outlineWidth: 1
          }
        });
        this.pulseEntities.push(ring);
      }
    });
  }

  getThreatsNear(lon, lat, r = 15) {
    return this.threatData.filter(t =>
      t.lat && t.lon && Math.abs(t.lon - lon) < r && Math.abs(t.lat - lat) < r
    ).slice(0, 6);
  }

  getByCountry(name) {
    const q = name.toLowerCase();
    return this.threatData.filter(t => t.country && t.country.toLowerCase().includes(q));
  }

  getLatestPulses(n = 20) {
    return this.pulseData.slice(0, n);
  }
}
