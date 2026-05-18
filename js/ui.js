class UIManager {
  constructor() {
    this.panelOpen = false;
  }

  showLoading(msg = 'INITIALIZING...') {
    const el = document.getElementById('loadingText');
    if (el) el.textContent = msg;
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      setTimeout(() => overlay.classList.add('hidden'), 300);
    }
  }

  updateStats(flights, threats) {
    const fc = document.getElementById('statFlights');
    const tc = document.getElementById('statThreats');
    const ts = document.getElementById('statTime');
    if (fc) fc.textContent = flights.toLocaleString();
    if (tc) tc.textContent = threats;
    if (ts) {
      const now = new Date();
      ts.textContent = now.toUTCString().slice(17, 25);
    }
  }

  setMode(mode) {
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

    // Header
    document.getElementById('intelCountry').textContent = data.country || 'UNKNOWN REGION';
    document.getElementById('intelCoords').textContent =
      `${Math.abs(data.lat).toFixed(2)}°${data.lat >= 0 ? 'N' : 'S'} · ${Math.abs(data.lon).toFixed(2)}°${data.lon >= 0 ? 'E' : 'W'}`;

    // Threat ring
    const maxSev = data.threats && data.threats.length
      ? Math.max(...data.threats.map(t => t.severity || 0))
      : 0;
    const ringEl = document.getElementById('intelRingVal');
    const ring = document.getElementById('intelRing');
    if (ringEl) ringEl.textContent = maxSev ? Math.round(maxSev) : '—';
    if (ring) {
      ring.style.borderColor = maxSev >= 8 ? '#FF2200' : maxSev >= 5 ? 'var(--orange)' : 'var(--border)';
    }

    // Meta
    const mf = document.getElementById('metaFlights');
    const ma = document.getElementById('metaAlerts');
    const mt = document.getElementById('metaTime');
    if (mf) mf.textContent = (data.flights || []).length;
    if (ma) ma.textContent = (data.threats || []).length;
    if (mt) mt.textContent = new Date().toUTCString().slice(17, 25) + 'Z';

    // Count badges
    const fc = document.getElementById('flightCount');
    const tc = document.getElementById('threatCount');
    const nc = document.getElementById('newsCount');
    if (fc) fc.textContent = (data.flights || []).length;
    if (tc) tc.textContent = (data.threats || []).length;
    if (nc) nc.textContent = (data.news || []).length;

    // Flights
    const flightEl = document.getElementById('intelFlights');
    if (flightEl) {
      if (!data.flights || data.flights.length === 0) {
        flightEl.innerHTML = '<div style="font-size:0.6rem;color:rgba(255,255,255,0.2);padding:12px;letter-spacing:0.1em">No active flights detected in region</div>';
      } else {
        flightEl.innerHTML = data.flights.slice(0, 8).map(f => `
          <div class="flight-item">
            <div class="flight-callsign">${f.callsign || f.icao || '—'}</div>
            <div class="flight-details">
              <div class="flight-alt">ALT ${f.alt ? Math.round(f.alt / 100) * 100 + ' ft' : '—'}</div>
              <div class="flight-speed">SPD ${f.speed ? Math.round(f.speed) + ' kts' : '—'} · HDG ${f.heading ? Math.round(f.heading) + '°' : '—'}</div>
            </div>
            <div class="flight-arrow">▶</div>
          </div>`).join('');
      }
    }

    // Threats
    const threatEl = document.getElementById('intelThreats');
    if (threatEl) {
      if (!data.threats || data.threats.length === 0) {
        threatEl.innerHTML = '<div style="font-size:0.6rem;color:rgba(255,255,255,0.2);padding:12px;letter-spacing:0.1em">No active threats detected</div>';
      } else {
        threatEl.innerHTML = data.threats.map(t => {
          const sev = Math.round(t.severity || 0);
          const isCrit = sev >= 8;
          return `
          <div class="threat-item ${isCrit ? 'critical' : ''}">
            <div class="threat-header">
              <div class="threat-sev">SEV ${sev}</div>
              <div class="threat-type">${t.type || 'UNKNOWN'}</div>
              ${t.indicators ? `<div class="threat-indicators">${t.indicators} IOCs</div>` : ''}
            </div>
            <div class="threat-desc">${t.desc || ''}</div>
          </div>`;
        }).join('');
      }
    }

    // News
    const newsEl = document.getElementById('intelNews');
    if (newsEl && data.news) {
      if (data.news.length === 0) {
        newsEl.innerHTML = '<div style="font-size:0.6rem;color:rgba(255,255,255,0.2);padding:12px;letter-spacing:0.1em">No recent headlines</div>';
      } else {
        newsEl.innerHTML = data.news.slice(0, 6).map(n => `
          <div class="news-item">
            <a href="${n.link || '#'}" target="_blank" rel="noopener noreferrer">${n.title}</a>
            <div class="news-meta">
              <div class="news-date">${this._relTime(n.pubDate)}</div>
              ${n.source ? `<div class="news-source">${n.source}</div>` : ''}
            </div>
          </div>`).join('');
      }
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
      panel.innerHTML = `<div class="sr-empty">NO SIGNAL · "${query.toUpperCase()}" NOT FOUND</div>`;
    } else {
      panel.innerHTML = flights.slice(0, 10).map(f => `
        <div class="sr-item" data-icao="${f.icao}">
          <div class="sr-icon">✈</div>
          <div class="callsign">${f.callsign || f.icao}</div>
          <div class="sr-detail">${f.lat.toFixed(2)}° / ${f.lon.toFixed(2)}° · ${Math.round(f.alt || 0).toLocaleString()} ft</div>
          <div class="sr-arrow">▶</div>
        </div>`).join('');
    }
    panel.classList.add('visible');
    setTimeout(() => panel.classList.remove('visible'), 6000);
  }

  showGestureHint(gesture) {
    const el = document.getElementById('gestureHint');
    if (!el) return;
    const hints = {
      plane:  { icon: '✈', text: 'TRANSIT MODE — FLIGHT DENSITY' },
      shield: { icon: '🛡', text: 'STORM MODE — THREAT LAYER ACTIVE' }
    };
    const h = hints[gesture] || { icon: '◉', text: gesture.toUpperCase() };
    const icon = el.querySelector('.hint-icon');
    const text = el.querySelector('.hint-text');
    if (icon) icon.textContent = h.icon;
    if (text) text.textContent = h.text;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), 2800);
  }

  toast(msg, duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    setTimeout(() => el.classList.remove('visible'), duration);
  }

  _relTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diff)) return '';
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'JUST NOW';
    if (m < 60) return `${m}M AGO`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}H AGO`;
    return `${Math.floor(h / 24)}D AGO`;
  }
}
