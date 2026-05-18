class ThreatManager {
  constructor(globeManager) {
    this.globe = globeManager;
    this.threatEntities = [];
    this.threatData = [];
    this.cache = { data: null, ts: 0 };
  }

  // Country threat data seeded with realistic regions
  _getStaticThreats() {
    return [
      { country: 'Russia', lat: 55.7, lon: 37.6, severity: 9, type: 'APT', desc: 'Advanced persistent threat — critical infrastructure targeting' },
      { country: 'China', lat: 39.9, lon: 116.4, severity: 8, type: 'Espionage', desc: 'State-sponsored cyber espionage campaign active' },
      { country: 'North Korea', lat: 39.0, lon: 125.7, severity: 9, type: 'Ransomware', desc: 'Lazarus Group financial sector attacks' },
      { country: 'Iran', lat: 35.7, lon: 51.4, severity: 7, type: 'DDoS', desc: 'Hacktivist DDoS operations targeting energy sector' },
      { country: 'Brazil', lat: -15.8, lon: -47.9, severity: 5, type: 'Phishing', desc: 'Mass phishing campaign targeting banking credentials' },
      { country: 'India', lat: 28.6, lon: 77.2, severity: 4, type: 'Phishing', desc: 'UPI fraud and financial phishing surge' },
      { country: 'United States', lat: 38.9, lon: -77.0, severity: 6, type: 'Ransomware', desc: 'Healthcare ransomware incidents reported' },
      { country: 'Germany', lat: 52.5, lon: 13.4, severity: 5, type: 'APT', desc: 'Industrial espionage targeting automotive sector' },
      { country: 'Ukraine', lat: 50.4, lon: 30.5, severity: 10, type: 'Cyberwar', desc: 'Active cyberwar operations — critical systems under attack' },
      { country: 'United Kingdom', lat: 51.5, lon: -0.1, severity: 5, type: 'Phishing', desc: 'NHS credential phishing campaign detected' },
      { country: 'Nigeria', lat: 9.0, lon: 7.5, severity: 6, type: 'BEC', desc: 'Business Email Compromise operations active' },
      { country: 'Pakistan', lat: 33.7, lon: 73.0, severity: 5, type: 'Malware', desc: 'Remcos RAT distribution campaign' },
      { country: 'Turkey', lat: 39.9, lon: 32.8, severity: 4, type: 'Defacement', desc: 'Web defacement wave against government sites' },
      { country: 'Indonesia', lat: -6.2, lon: 106.8, severity: 5, type: 'Botnet', desc: 'Mirai botnet variant spreading' },
      { country: 'Vietnam', lat: 21.0, lon: 105.8, severity: 4, type: 'Cryptojacking', desc: 'Server cryptojacking campaign detected' },
      { country: 'Mexico', lat: 19.4, lon: -99.1, severity: 6, type: 'Ransomware', desc: 'Government agency ransomware attack' },
      { country: 'South Africa', lat: -25.7, lon: 28.2, severity: 5, type: 'Phishing', desc: 'Banking phishing surge reported' },
      { country: 'Israel', lat: 31.8, lon: 35.2, severity: 7, type: 'APT', desc: 'State-linked attacks on tech infrastructure' },
      { country: 'Japan', lat: 35.7, lon: 139.7, severity: 4, type: 'Phishing', desc: 'QR code phishing targeting corporate users' },
      { country: 'Canada', lat: 45.4, lon: -75.7, severity: 3, type: 'Scanning', desc: 'Port scanning campaign against critical infrastructure' }
    ];
  }

  async fetchThreats() {
    const now = Date.now();
    if (this.cache.data && now - this.cache.ts < 60000) return this.cache.data;

    // Try OTX public subscriptions feed (no-auth public pulses)
    try {
      const res = await fetch('https://otx.alienvault.com/otxapi/pulses/?limit=20&sort=-modified', {
        signal: AbortSignal.timeout(8000),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const json = await res.json();
        const parsed = this._parseOTX(json);
        if (parsed.length > 0) {
          this.cache = { data: parsed, ts: now };
          return parsed;
        }
      }
    } catch { }

    // Fallback to static realistic data
    const data = this._getStaticThreats().map(t => ({
      ...t,
      severity: Math.max(1, Math.min(10, t.severity + (Math.random() * 2 - 1))),
      indicators: Math.floor(Math.random() * 200 + 10),
      ts: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }));
    this.cache = { data, ts: now };
    return data;
  }

  _parseOTX(json) {
    const results = json.results || [];
    const threats = [];
    results.forEach(pulse => {
      if (!pulse.targeted_countries || pulse.targeted_countries.length === 0) return;
      pulse.targeted_countries.forEach(country => {
        threats.push({
          country,
          lat: 0, lon: 0,
          severity: Math.min(10, (pulse.indicator_count || 5) / 20),
          type: (pulse.tags && pulse.tags[0]) || 'Threat',
          desc: pulse.description || pulse.name,
          indicators: pulse.indicator_count || 0,
          ts: pulse.modified
        });
      });
    });
    return threats;
  }

  async update(mode) {
    const threats = await this.fetchThreats();
    this.threatData = threats;
    this._render(threats, mode);
    return threats;
  }

  _render(threats, mode) {
    const viewer = this.globe.viewer;
    this.threatEntities.forEach(e => viewer.entities.remove(e));
    this.threatEntities = [];

    const isFlight = mode === CONFIG.MODES.TRANSIT;
    if (isFlight) return;

    const isStorm = mode === CONFIG.MODES.STORM;

    threats.forEach(t => {
      if (!t.lat && !t.lon) return;
      const severity = Math.max(1, Math.min(10, t.severity));
      const alpha = isStorm ? 1.0 : 0.85;
      const size = isStorm ? severity * 9 : severity * 6;

      const color = severity >= 8
        ? Cesium.Color.fromCssColorString(CONFIG.COLORS.THREAT_HIGH).withAlpha(alpha)
        : Cesium.Color.fromCssColorString(CONFIG.COLORS.THREAT).withAlpha(alpha);

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(t.lon, t.lat, 50000 + severity * 20000),
        point: {
          pixelSize: size,
          color: color.withAlpha(0.3),
          outlineColor: color,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.NONE,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000000)
        },
        label: {
          text: `⚠ ${t.country}`,
          font: isStorm ? 'bold 12px Space Mono, monospace' : '10px Space Mono, monospace',
          fillColor: color,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -(size + 8)),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, isStorm ? 15000000 : 5000000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        description: JSON.stringify(t)
      });
      this.threatEntities.push(entity);
    });
  }

  getThreatsNear(lon, lat, radiusDeg = 15) {
    return this.threatData.filter(t =>
      t.lat && t.lon && Math.abs(t.lon - lon) < radiusDeg && Math.abs(t.lat - lat) < radiusDeg
    ).slice(0, 5);
  }

  getByCountry(countryName) {
    const q = countryName.toLowerCase();
    return this.threatData.filter(t => t.country && t.country.toLowerCase().includes(q));
  }
}
