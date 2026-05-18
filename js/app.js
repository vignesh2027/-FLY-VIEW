// Geocoder: approximate country from lat/lon using bounding boxes
const COUNTRY_BOXES = [
  { name: 'India', lat: [8, 37], lon: [68, 97], keywords: ['india', 'delhi', 'mumbai', 'bangalore'] },
  { name: 'United States', lat: [25, 49], lon: [-125, -66], keywords: ['usa', 'america', 'new york', 'los angeles'] },
  { name: 'China', lat: [18, 53], lon: [73, 135], keywords: ['china', 'beijing', 'shanghai'] },
  { name: 'Russia', lat: [41, 82], lon: [27, 180], keywords: ['russia', 'moscow'] },
  { name: 'Brazil', lat: [-34, 5], lon: [-74, -34], keywords: ['brazil', 'brasilia'] },
  { name: 'United Kingdom', lat: [49, 61], lon: [-8, 2], keywords: ['uk', 'britain', 'london'] },
  { name: 'Germany', lat: [47, 55], lon: [6, 15], keywords: ['germany', 'berlin'] },
  { name: 'France', lat: [42, 51], lon: [-5, 9], keywords: ['france', 'paris'] },
  { name: 'Japan', lat: [24, 46], lon: [123, 146], keywords: ['japan', 'tokyo'] },
  { name: 'Australia', lat: [-44, -10], lon: [113, 154], keywords: ['australia', 'sydney'] },
  { name: 'Canada', lat: [42, 84], lon: [-141, -52], keywords: ['canada', 'toronto'] },
  { name: 'Ukraine', lat: [44, 52], lon: [22, 40], keywords: ['ukraine', 'kyiv'] },
  { name: 'Pakistan', lat: [24, 37], lon: [61, 77], keywords: ['pakistan', 'islamabad'] },
  { name: 'Iran', lat: [25, 40], lon: [44, 64], keywords: ['iran', 'tehran'] },
  { name: 'Turkey', lat: [36, 42], lon: [26, 45], keywords: ['turkey', 'ankara'] },
  { name: 'Nigeria', lat: [4, 14], lon: [3, 15], keywords: ['nigeria', 'abuja'] },
  { name: 'North Korea', lat: [38, 43], lon: [124, 130], keywords: ['north korea', 'pyongyang'] },
  { name: 'South Africa', lat: [-35, -22], lon: [17, 33], keywords: ['south africa'] },
  { name: 'Mexico', lat: [15, 33], lon: [-118, -87], keywords: ['mexico'] },
  { name: 'Indonesia', lat: [-11, 6], lon: [95, 141], keywords: ['indonesia', 'jakarta'] },
  { name: 'Vietnam', lat: [8, 24], lon: [102, 110], keywords: ['vietnam', 'hanoi'] },
  { name: 'Israel', lat: [29, 34], lon: [34, 36], keywords: ['israel', 'tel aviv'] },
];

function getCountryFromCoords(lat, lon) {
  for (const c of COUNTRY_BOXES) {
    if (lat >= c.lat[0] && lat <= c.lat[1] && lon >= c.lon[0] && lon <= c.lon[1]) return c.name;
  }
  return null;
}

class OrionApp {
  constructor() {
    this.globe = null;
    this.flights = null;
    this.threats = null;
    this.news = null;
    this.gestures = null;
    this.ui = null;
    this.mode = CONFIG.MODES.ATLAS;
    this._flightTimer = null;
    this._threatTimer = null;
    this._newsTimer = null;
  }

  async init() {
    this.ui = new UIManager();
    this.ui.showLoading('BOOTING ORION SYSTEMS...');

    try {
      this.ui.showLoading('INITIALIZING GLOBE...');
      this.globe = new GlobeManager();
      await this.globe.init();

      this.flights = new FlightManager(this.globe);
      this.threats = new ThreatManager(this.globe);
      this.news = new NewsManager();
      this.gestures = new GestureManager();

      this.ui.showLoading('FETCHING FLIGHT DATA...');
      const [flightData, threatData] = await Promise.allSettled([
        this.flights.update(this.mode),
        this.threats.update(this.mode)
      ]);

      this.ui.showLoading('LOADING INTELLIGENCE FEEDS...');
      await this.news.fetchNews();

      this.ui.setMode(this.mode);
      this.ui.updateStats(
        (flightData.value || []).length,
        (threatData.value || []).length
      );

      this._bindEvents();
      this._startRefreshTimers();

      // Init gestures non-blocking
      this.gestures.init().catch(() => {});

      this.ui.hideLoading();
    } catch (err) {
      console.error('Init error:', err);
      this.ui.showLoading('ERROR: ' + err.message);
    }
  }

  _bindEvents() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this._setMode(btn.dataset.mode));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === '1') this._setMode(CONFIG.MODES.ATLAS);
      if (e.key === '2') this._setMode(CONFIG.MODES.STORM);
      if (e.key === '3') this._setMode(CONFIG.MODES.TRANSIT);
      if (e.key === 'Escape') { this.ui.closeIntelPanel(); }
      if (e.key === 'g' || e.key === 'G') this.gestures.toggle();
    });

    // Globe click
    window.addEventListener('globeClick', async (e) => {
      const { lon, lat } = e.detail;
      await this._openIntelForCoords(lon, lat);
    });

    // Search
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    if (searchInput && searchBtn) {
      const doSearch = async () => {
        const q = searchInput.value.trim();
        if (!q) return;
        const matches = this.flights.findByCallsign(q);
        this.ui.showFlightSearch(matches, q);
        if (matches.length > 0) {
          const f = matches[0];
          this.globe.flyTo(f.lon, f.lat, 2000000, 2.5);
          // If two flights found, draw route arc
          if (matches.length >= 2) {
            const f2 = matches[1];
            this.globe.flyAlongRoute(f.lon, f.lat, f2.lon, f2.lat);
          }
        }
      };
      searchBtn.addEventListener('click', doSearch);
      searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
    }

    // Close panel
    const closeBtn = document.getElementById('intelClose');
    if (closeBtn) closeBtn.addEventListener('click', () => this.ui.closeIntelPanel());

    // Gesture events
    window.addEventListener('gesture', (e) => this._handleGesture(e.detail.type));

    // Gesture toggle button
    const gestureBtn = document.getElementById('gestureToggle');
    if (gestureBtn) gestureBtn.addEventListener('click', () => this.gestures.toggle());
  }

  _setMode(mode) {
    if (!Object.values(CONFIG.MODES).includes(mode)) return;
    this.mode = mode;
    this.ui.setMode(mode);
    this.globe.setMode(mode);
    this.flights.update(mode);
    this.threats.update(mode);
  }

  _handleGesture(type) {
    this.ui.showGestureHint(type);
    if (type === 'plane') {
      this._setMode(CONFIG.MODES.TRANSIT);
      this._suggestTopRoutes();
    } else if (type === 'shield') {
      this._setMode(CONFIG.MODES.STORM);
    }
  }

  _suggestTopRoutes() {
    const statusEl = document.getElementById('gestureStatus');
    if (statusEl) statusEl.textContent = 'TOP CORRIDORS: BOM-DXB · JFK-LHR · DEL-SIN · CDG-SYD · BKK-SIN';
  }

  async _openIntelForCoords(lon, lat) {
    const country = getCountryFromCoords(lat, lon);
    const nearFlights = this.flights.getFlightsNear(lon, lat);
    const nearThreats = country
      ? this.threats.getByCountry(country)
      : this.threats.getThreatsNear(lon, lat);
    const keywords = country ? [country.toLowerCase()] : [];
    const nearNews = this.news.filterByRegion(keywords);

    await this.ui.openIntelPanel({
      country: country || `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`,
      lat, lon,
      flights: nearFlights,
      threats: nearThreats,
      news: nearNews
    });
  }

  _startRefreshTimers() {
    this._flightTimer = setInterval(() => {
      this.flights.update(this.mode).then(f => {
        this.ui.updateStats(f.length, this.threats.threatData.length);
      });
    }, CONFIG.FLIGHT_REFRESH);

    this._threatTimer = setInterval(() => {
      this.threats.update(this.mode);
    }, CONFIG.THREAT_REFRESH);

    this._newsTimer = setInterval(() => {
      this.news.fetchNews();
    }, CONFIG.NEWS_REFRESH);

    // Live clock
    setInterval(() => {
      this.ui.updateStats(
        this.flights.rawFlights.length,
        this.threats.threatData.length
      );
    }, 1000);
  }
}

// Boot
window.addEventListener('load', async () => {
  const app = new OrionApp();
  window.__orion = app;
  await app.init();
});
