class UIManager {
  constructor() {
    this.panelOpen = false;
    this.currentMode = CONFIG.MODES.ATLAS;
  }

  showLoading(msg = 'INITIALIZING...') {
    const el = document.getElementById('loadingText');
    if (el) el.textContent = msg;
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  updateStats(flights, threats) {
    const fc = document.getElementById('statFlights');
    const tc = document.getElementById('statThreats');
    const ts = document.getElementById('statTime');
    if (fc) fc.textContent = flights.toLocaleString();
    if (tc) tc.textContent = threats;
    if (ts) ts.textContent = new Date().toUTCString().slice(17, 25) + ' UTC';
  }

  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    const badge = document.getElementById('modeBadge');
    if (badge) {
      badge.textContent = mode.toUpperCase();
      badge.className = `mode-badge mode-${mode}`;
    }
  }

  async openIntelPanel(data) {
    const panel = document.getElementById('intelPanel');
    if (!panel) return;
    this.panelOpen = true;
    panel.classList.add('open');

    document.getElementById('intelCountry').textContent = data.country || 'UNKNOWN REGION';
    document.getElementById('intelCoords').textContent =
      `${data.lat.toFixed(2)}°N ${data.lon.toFixed(2)}°E`;

    // Flights
    const flightList = document.getElementById('intelFlights');
    if (flightList && data.flights) {
      flightList.innerHTML = data.flights.length === 0
        ? '<li class="empty">No active flights detected</li>'
        : data.flights.slice(0, 8).map(f =>
            `<li><span class="tag tag-yellow">${f.callsign || f.icao}</span>
             <span class="detail">${f.alt ? Math.round(f.alt / 100) * 100 + 'ft' : '—'}
             · ${f.speed ? Math.round(f.speed) + 'kts' : '—'}</span></li>`
          ).join('');
    }

    // Threats
    const threatList = document.getElementById('intelThreats');
    if (threatList && data.threats) {
      threatList.innerHTML = data.threats.length === 0
        ? '<li class="empty">No active threats detected</li>'
        : data.threats.map(t =>
            `<li><span class="tag tag-orange sev-${Math.round(t.severity)}">[SEV ${Math.round(t.severity)}] ${t.type}</span>
             <p class="threat-desc">${t.desc}</p></li>`
          ).join('');
    }

    // News
    const newsList = document.getElementById('intelNews');
    if (newsList && data.news) {
      newsList.innerHTML = data.news.slice(0, 5).map(n =>
        `<li><a href="${n.link}" target="_blank" rel="noopener">${n.title}</a>
         <span class="news-date">${this._relTime(n.pubDate)}</span></li>`
      ).join('');
    }
  }

  closeIntelPanel() {
    const panel = document.getElementById('intelPanel');
    if (panel) panel.classList.remove('open');
    this.panelOpen = false;
  }

  showFlightSearch(flights, query) {
    const panel = document.getElementById('searchResults');
    if (!panel) return;
    if (flights.length === 0) {
      panel.innerHTML = `<div class="sr-empty">NO FLIGHTS MATCHING "${query.toUpperCase()}"</div>`;
    } else {
      panel.innerHTML = flights.slice(0, 10).map(f =>
        `<div class="sr-item" data-icao="${f.icao}">
          <span class="callsign">${f.callsign || f.icao}</span>
          <span class="detail">${f.lat.toFixed(2)}° ${f.lon.toFixed(2)}° · ${Math.round(f.alt || 0)}ft</span>
        </div>`
      ).join('');
    }
    panel.classList.add('visible');
    setTimeout(() => panel.classList.remove('visible'), 5000);
  }

  showGestureHint(gesture) {
    const el = document.getElementById('gestureHint');
    if (!el) return;
    const hints = {
      plane: '✈ ROUTE SUGGESTIONS ACTIVATED',
      shield: '🛡 STORM MODE ACTIVATED'
    };
    el.textContent = hints[gesture] || gesture;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2500);
  }

  _relTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
}
