const COUNTRY_BOXES = [
  { name: 'India',         lat: [8,  37], lon: [68,  97], kw: ['india','delhi','mumbai','bangalore','chennai'] },
  { name: 'United States', lat: [25, 49], lon: [-125,-66], kw: ['usa','america','new york','los angeles','washington'] },
  { name: 'China',         lat: [18, 53], lon: [73, 135],  kw: ['china','beijing','shanghai','hong kong'] },
  { name: 'Russia',        lat: [41, 82], lon: [27, 180],  kw: ['russia','moscow','kremlin'] },
  { name: 'Brazil',        lat: [-34, 5], lon: [-74,-34],  kw: ['brazil','brasilia','sao paulo'] },
  { name: 'United Kingdom',lat: [49, 61], lon: [-8,  2],   kw: ['uk','britain','london','england'] },
  { name: 'Germany',       lat: [47, 55], lon: [6,  15],   kw: ['germany','berlin','frankfurt'] },
  { name: 'France',        lat: [42, 51], lon: [-5,  9],   kw: ['france','paris'] },
  { name: 'Japan',         lat: [24, 46], lon: [123,146],  kw: ['japan','tokyo','osaka'] },
  { name: 'Australia',     lat: [-44,-10],lon: [113,154],  kw: ['australia','sydney','melbourne'] },
  { name: 'Canada',        lat: [42, 84], lon: [-141,-52], kw: ['canada','toronto','vancouver'] },
  { name: 'Ukraine',       lat: [44, 52], lon: [22,  40],  kw: ['ukraine','kyiv'] },
  { name: 'Pakistan',      lat: [24, 37], lon: [61,  77],  kw: ['pakistan','islamabad','karachi'] },
  { name: 'Iran',          lat: [25, 40], lon: [44,  64],  kw: ['iran','tehran'] },
  { name: 'Turkey',        lat: [36, 42], lon: [26,  45],  kw: ['turkey','ankara','istanbul'] },
  { name: 'Nigeria',       lat: [4,  14], lon: [3,   15],  kw: ['nigeria','abuja','lagos'] },
  { name: 'North Korea',   lat: [38, 43], lon: [124,130],  kw: ['north korea','pyongyang'] },
  { name: 'South Africa',  lat: [-35,-22],lon: [17,  33],  kw: ['south africa','johannesburg'] },
  { name: 'Mexico',        lat: [15, 33], lon: [-118,-87], kw: ['mexico','mexico city'] },
  { name: 'Indonesia',     lat: [-11, 6], lon: [95, 141],  kw: ['indonesia','jakarta','bali'] },
  { name: 'Vietnam',       lat: [8,  24], lon: [102,110],  kw: ['vietnam','hanoi','ho chi minh'] },
  { name: 'Israel',        lat: [29, 34], lon: [34,  36],  kw: ['israel','tel aviv','jerusalem'] },
  { name: 'UAE',           lat: [22, 26], lon: [51,  56],  kw: ['uae','dubai','abu dhabi','emirates'] },
  { name: 'Saudi Arabia',  lat: [16, 32], lon: [34,  56],  kw: ['saudi','riyadh','jeddah'] },
  { name: 'South Korea',   lat: [34, 38], lon: [126,130],  kw: ['korea','seoul','busan'] },
  { name: 'Singapore',     lat: [1,  2],  lon: [103,105],  kw: ['singapore'] },
  { name: 'Thailand',      lat: [5,  21], lon: [97, 106],  kw: ['thailand','bangkok'] },
];

function getCountryFromCoords(lat, lon) {
  for (const c of COUNTRY_BOXES) {
    if (lat >= c.lat[0] && lat <= c.lat[1] && lon >= c.lon[0] && lon <= c.lon[1]) return c.name;
  }
  return null;
}

class OrionApp {
  constructor() {
    this.globe   = null;
    this.flights = null;
    this.threats = null;
    this.news    = null;
    this.ui      = null;
    this.mode    = CONFIG.MODES.ATLAS;
    this._timers = [];
  }

  async init() {
    this.ui = new UIManager();
    this.ui.showLoading('BOOTING ORION SYSTEMS...');

    try {
      this.ui.showLoading('RENDERING GLOBE...');
      this.globe = new GlobeManager();
      await this.globe.init();

      this.flights = new FlightManager(this.globe);
      this.threats = new ThreatManager(this.globe);
      this.news    = new NewsManager();

      this.ui.showLoading('ACQUIRING FLIGHT DATA...');
      const [flightResult, threatResult] = await Promise.allSettled([
        this.flights.update(this.mode),
        this.threats.update(this.mode)
      ]);

      this.ui.showLoading('LOADING INTELLIGENCE FEEDS...');
      await this.news.fetchNews();

      this.ui.setMode(this.mode);
      const fc = (flightResult.value || []).length;
      const tc = (threatResult.value || []).length;
      this.ui.updateStats(fc, tc);

      this._buildTicker(flightResult.value || [], threatResult.value || []);
      this._bindEvents();
      this._startTimers();
      this._updateCorridorList();

      this.ui.toast('ORION ONLINE · ' + fc.toLocaleString() + ' AIRCRAFT TRACKED', 'success', 4000);
      this.ui.hideLoading();

    } catch (err) {
      console.error(err);
      this.ui.showLoading('ERROR — ' + err.message);
    }
  }

  _buildTicker(flights, threats) {
    const items = [
      `${flights.length.toLocaleString()} AIRCRAFT AIRBORNE GLOBALLY`,
      `${threats.length} ACTIVE CYBER THREAT ZONES`,
      'CLICK ANY REGION FOR INTELLIGENCE BRIEFING',
      'DATA: ADSB.LOL · ADSB.FI · AIRPLANES.LIVE',
      'THREATS: ALIENVAULT OTX · NEWS: TECHCRUNCH · WIRED',
      'KEYS: [1] ATLAS  [2] STORM  [3] TRANSIT  [ESC] CLOSE',
    ];
    if (threats.length > 0) {
      const top = threats.sort((a, b) => b.severity - a.severity)[0];
      items.unshift(`⚠ HIGH SEVERITY: ${top.type} DETECTED IN ${top.country?.toUpperCase() || 'UNKNOWN'}`);
    }
    this.ui.startTicker(items);
  }

  _bindEvents() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setMode(btn.dataset.mode));
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === '1') this._setMode(CONFIG.MODES.ATLAS);
      if (e.key === '2') this._setMode(CONFIG.MODES.STORM);
      if (e.key === '3') this._setMode(CONFIG.MODES.TRANSIT);
      if (e.key === 'Escape') this.ui.closeIntelPanel();
      if (e.key === 'r' || e.key === 'R') this._forceRefresh();
    });

    // Globe click
    window.addEventListener('globeClick', async e => {
      const { lon, lat } = e.detail;
      await this._openIntelForCoords(lon, lat);
    });

    // Search
    const input = document.getElementById('searchInput');
    const btn   = document.getElementById('searchBtn');
    if (input && btn) {
      const doSearch = () => {
        const q = input.value.trim();
        if (!q) return;
        const matches = this.flights.findByCallsign(q);
        this.ui.showFlightSearch(matches, q);
        if (matches.length > 0) {
          this.globe.flyTo(matches[0].lon, matches[0].lat, 2500000, 2.5);
        }
      };
      btn.addEventListener('click', doSearch);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

      // Clear on escape inside input
      input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; input.blur(); }
      });
    }

    // Close panel button
    const close = document.getElementById('intelClose');
    if (close) close.addEventListener('click', () => this.ui.closeIntelPanel());

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this._forceRefresh());
  }

  _setMode(mode) {
    if (!Object.values(CONFIG.MODES).includes(mode)) return;
    this.mode = mode;
    this.ui.setMode(mode);
    this.globe.setMode(mode);
    this.flights.update(mode);
    this.threats.update(mode);
  }

  async _forceRefresh() {
    const btn = document.getElementById('refreshBtn');
    if (btn) { btn.textContent = '↻'; btn.style.animation = 'spin 0.8s linear'; }
    const [fl, th] = await Promise.allSettled([
      this.flights.update(this.mode),
      this.threats.update(this.mode)
    ]);
    this.ui.updateStats((fl.value||[]).length, (th.value||[]).length);
    this.ui.toast('DATA REFRESHED · ' + new Date().toUTCString().slice(17, 25) + 'Z', 'success');
    this._updateCorridorList();
    if (btn) { btn.textContent = '↻'; btn.style.animation = ''; }
  }

  async _openIntelForCoords(lon, lat) {
    const country    = getCountryFromCoords(lat, lon);
    const nearFlights = this.flights.getFlightsNear(lon, lat);
    const nearThreats = country
      ? this.threats.getByCountry(country)
      : this.threats.getThreatsNear(lon, lat);
    const keywords = country ? country.toLowerCase().split(' ') : [];
    const nearNews  = this.news.filterByRegion(keywords);

    await this.ui.openIntelPanel({
      country: country || `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? 'E' : 'W'}`,
      lat, lon,
      flights: nearFlights,
      threats: nearThreats,
      news:    nearNews
    });
  }

  _updateCorridorList() {
    const el = document.getElementById('corridorList');
    if (!el) return;
    const corridors = [
      { name: 'BOM → DXB', count: Math.floor(Math.random() * 18 + 8) },
      { name: 'JFK → LHR', count: Math.floor(Math.random() * 22 + 12) },
      { name: 'DEL → SIN', count: Math.floor(Math.random() * 14 + 6) },
      { name: 'BKK → SIN', count: Math.floor(Math.random() * 20 + 10) },
      { name: 'CDG → SYD', count: Math.floor(Math.random() * 8  + 4) },
    ];
    el.innerHTML = corridors.map(c => `
      <div class="corridor-item">
        <span class="corridor-name">${c.name}</span>
        <div class="corridor-bar-wrap">
          <div class="corridor-bar" style="width:${(c.count / 30) * 100}%"></div>
        </div>
        <span class="corridor-count">${c.count}</span>
      </div>`).join('');
    AnimationEngine.staggerIn(Array.from(el.querySelectorAll('.corridor-item')), 80);
  }

  _startTimers() {
    this._timers.push(setInterval(async () => {
      const [fl, th] = await Promise.allSettled([
        this.flights.update(this.mode),
        this.threats.update(this.mode)
      ]);
      const fc = (fl.value||[]).length;
      const tc = (th.value||[]).length;
      this.ui.updateStats(fc, tc);
      this._updateCorridorList();
    }, CONFIG.FLIGHT_REFRESH));

    this._timers.push(setInterval(() => {
      this.news.fetchNews();
    }, CONFIG.NEWS_REFRESH));

    // Live clock tick
    this._timers.push(setInterval(() => {
      const ts = document.getElementById('statTime');
      if (ts) ts.textContent = new Date().toUTCString().slice(17, 25);
    }, 1000));
  }
}

window.addEventListener('load', async () => {
  const app = new OrionApp();
  window.__orion = app;
  await app.init();
});
