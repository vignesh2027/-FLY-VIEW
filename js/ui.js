class UIManager {
  constructor() {
    this.panelOpen = false;
    this._toastTimer = null;
    this._tickerItems = [];
    this._tickerIndex = 0;
    this._tickerTimer = null;
  }

  showLoading(msg = 'INITIALIZING...') {
    const el = document.getElementById('loadingText');
    if (el) AnimationEngine.typewrite(el, msg, 22);
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;
    overlay.style.transition = 'opacity 0.9s ease, transform 1s ease';
    overlay.style.opacity = '0';
    overlay.style.transform = 'scale(1.04)';
    setTimeout(() => overlay.classList.add('hidden'), 900);
  }

  updateStats(flights, threats) {
    const fc = document.getElementById('statFlights');
    const tc = document.getElementById('statThreats');
    const ts = document.getElementById('statTime');
    const prev_f = parseInt(fc?.dataset.current || '0');
    const prev_t = parseInt(tc?.dataset.current || '0');

    if (fc && flights !== prev_f) {
      AnimationEngine.countTo(fc, flights, 900);
    }
    if (tc && threats !== prev_t) {
      AnimationEngine.countTo(tc, threats, 700);
    }
    if (ts) {
      const now = new Date();
      ts.textContent = now.toUTCString().slice(17, 25);
    }

    // Update mini stat cards
    const mf = document.getElementById('miniFlights');
    const mt = document.getElementById('miniThreats');
    if (mf && flights !== prev_f) AnimationEngine.countTo(mf, flights, 900);
    if (mt && threats !== prev_t) AnimationEngine.countTo(mt, threats, 700);
  }

  setMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    const badge = document.getElementById('modeBadge');
    if (badge) {
      badge.textContent = mode.toUpperCase();
      badge.className = `mode-badge mode-${mode}`;
      AnimationEngine.pulse(badge);
    }
    // Update mode description
    const desc = document.getElementById('modeDesc');
    const descriptions = {
      atlas:   'BALANCED · FLIGHTS + THREATS + INTEL',
      storm:   'THREAT LAYER DOMINANT · WAR ROOM',
      transit: 'PURE FLIGHT DENSITY · HUMAN MOVEMENT'
    };
    if (desc) {
      desc.style.opacity = '0';
      setTimeout(() => {
        desc.textContent = descriptions[mode] || '';
        desc.style.opacity = '1';
      }, 150);
    }
  }

  async openIntelPanel(data) {
    const panel = document.getElementById('intelPanel');
    if (!panel) return;
    this.panelOpen = true;
    panel.classList.add('open');
    document.body.classList.add('intel-open');

    // Header info
    const countryEl = document.getElementById('intelCountry');
    if (countryEl) AnimationEngine.typewrite(countryEl, data.country || 'UNKNOWN REGION', 30);

    document.getElementById('intelCoords').textContent =
      `${Math.abs(data.lat).toFixed(2)}°${data.lat >= 0 ? 'N' : 'S'} · ${Math.abs(data.lon).toFixed(2)}°${data.lon >= 0 ? 'E' : 'W'}`;

    // Threat severity ring
    const maxSev = data.threats?.length
      ? Math.max(...data.threats.map(t => t.severity || 0))
      : 0;
    const ringVal = document.getElementById('intelRingVal');
    const ring = document.getElementById('intelRing');
    if (ringVal) AnimationEngine.countTo(ringVal, Math.round(maxSev), 600);
    if (ring) {
      const col = maxSev >= 8 ? '#FF2200' : maxSev >= 5 ? 'var(--orange)' : 'rgba(255,255,255,0.15)';
      ring.style.setProperty('--ring-color', col);
      ring.style.borderColor = col;
      ring.style.boxShadow = maxSev >= 5 ? `0 0 20px ${col}40` : 'none';
    }

    // Meta counts
    this._setMeta('metaFlights', (data.flights || []).length);
    this._setMeta('metaAlerts',  (data.threats || []).length);
    document.getElementById('metaTime').textContent = new Date().toUTCString().slice(17, 25) + 'Z';

    // Section count badges
    this._setCount('flightCount', (data.flights || []).length);
    this._setCount('threatCount',  (data.threats || []).length);
    this._setCount('newsCount',    (data.news || []).length);

    // Render sections with stagger
    this._renderFlights(data.flights || []);
    this._renderThreats(data.threats || []);
    this._renderNews(data.news || []);
  }

  _setMeta(id, val) {
    const el = document.getElementById(id);
    if (el) AnimationEngine.countTo(el, val, 500);
  }

  _setCount(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = val;
    el.style.display = val > 0 ? 'flex' : 'none';
  }

  _renderFlights(flights) {
    const el = document.getElementById('intelFlights');
    if (!el) return;
    if (flights.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">✈</div><div class="empty-msg">No active flights in region</div></div>';
      return;
    }
    el.innerHTML = flights.slice(0, 9).map(f => `
      <div class="flight-card">
        <div class="flight-card-left">
          <div class="flight-callsign">${f.callsign || f.icao || '—'}</div>
          <div class="flight-icao">${f.icao || ''}</div>
        </div>
        <div class="flight-card-stats">
          <div class="flight-stat">
            <span class="fstat-label">ALT</span>
            <span class="fstat-val">${f.alt ? (Math.round(f.alt / 1000) + 'K') : '—'}</span>
          </div>
          <div class="flight-stat">
            <span class="fstat-label">SPD</span>
            <span class="fstat-val">${f.speed ? Math.round(f.speed) : '—'}</span>
          </div>
          <div class="flight-stat">
            <span class="fstat-label">HDG</span>
            <span class="fstat-val">${f.heading ? Math.round(f.heading) + '°' : '—'}</span>
          </div>
        </div>
        <div class="flight-dir-arrow" style="transform:rotate(${f.heading || 0}deg)">▲</div>
      </div>`).join('');
    AnimationEngine.staggerIn(Array.from(el.querySelectorAll('.flight-card')), 50);
  }

  _renderThreats(threats) {
    const el = document.getElementById('intelThreats');
    if (!el) return;
    if (threats.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">◉</div><div class="empty-msg">No active threats detected</div></div>';
      return;
    }
    el.innerHTML = threats.map(t => {
      const sev = Math.round(t.severity || 0);
      const w = (sev / 10) * 100;
      const col = sev >= 8 ? '#FF2200' : sev >= 5 ? 'var(--orange)' : '#AA4400';
      return `
      <div class="threat-card ${sev >= 8 ? 'critical' : ''}">
        <div class="threat-card-header">
          <div class="threat-type-badge" style="background:${col}20;color:${col};border-color:${col}40">${t.type || 'THREAT'}</div>
          <div class="threat-sev-num" style="color:${col}">SEV ${sev}</div>
        </div>
        <div class="threat-bar-wrap">
          <div class="threat-bar-fill" style="width:${w}%;background:${col}"></div>
        </div>
        <div class="threat-desc">${t.desc || ''}</div>
        ${t.indicators ? `<div class="threat-iocs">${t.indicators} INDICATORS OF COMPROMISE</div>` : ''}
      </div>`;
    }).join('');
    AnimationEngine.staggerIn(Array.from(el.querySelectorAll('.threat-card')), 60);
  }

  _renderNews(articles) {
    const el = document.getElementById('intelNews');
    if (!el) return;
    if (articles.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">◈</div><div class="empty-msg">No recent headlines</div></div>';
      return;
    }
    el.innerHTML = articles.slice(0, 6).map((n, i) => `
      <a class="news-card" href="${n.link || '#'}" target="_blank" rel="noopener noreferrer">
        <div class="news-card-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="news-card-body">
          <div class="news-card-title">${n.title}</div>
          <div class="news-card-meta">
            <span class="news-card-time">${this._relTime(n.pubDate)}</span>
            ${n.source ? `<span class="news-card-src">${n.source}</span>` : ''}
          </div>
        </div>
        <div class="news-card-arrow">↗</div>
      </a>`).join('');
    AnimationEngine.staggerIn(Array.from(el.querySelectorAll('.news-card')), 55);
  }

  closeIntelPanel() {
    const panel = document.getElementById('intelPanel');
    if (panel) panel.classList.remove('open');
    document.body.classList.remove('intel-open');
    this.panelOpen = false;
  }

  showFlightSearch(flights, query) {
    const panel = document.getElementById('searchResults');
    if (!panel) return;
    if (flights.length === 0) {
      panel.innerHTML = `<div class="sr-empty">◌ NO SIGNAL · "${query.toUpperCase()}" NOT FOUND</div>`;
    } else {
      panel.innerHTML = flights.slice(0, 10).map(f => `
        <div class="sr-item" data-icao="${f.icao}">
          <div class="sr-dot"></div>
          <div class="sr-callsign">${f.callsign || f.icao}</div>
          <div class="sr-detail">${f.lat.toFixed(2)}° / ${f.lon.toFixed(2)}° · ${Math.round(f.alt || 0).toLocaleString()} ft</div>
          <div class="sr-arrow">↗</div>
        </div>`).join('');
      AnimationEngine.staggerIn(Array.from(panel.querySelectorAll('.sr-item')), 40);
    }
    panel.classList.add('visible');
    setTimeout(() => panel.classList.remove('visible'), 6000);
  }

  startTicker(items) {
    this._tickerItems = items;
    this._runTicker();
  }

  _runTicker() {
    if (!this._tickerItems.length) return;
    const el = document.getElementById('tickerText');
    if (!el) return;
    const item = this._tickerItems[this._tickerIndex % this._tickerItems.length];
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    setTimeout(() => {
      el.textContent = item;
      el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 200);
    this._tickerIndex++;
    this._tickerTimer = setTimeout(() => this._runTicker(), 4000);
  }

  toast(msg, type = 'info', duration = 3500) {
    clearTimeout(this._toastTimer);
    const el = document.getElementById('toast');
    if (!el) return;
    const colors = { info: 'var(--orange)', success: 'var(--yellow)', warn: '#FF2200' };
    el.style.borderLeftColor = colors[type] || colors.info;
    el.textContent = msg;
    el.classList.add('visible');
    this._toastTimer = setTimeout(() => el.classList.remove('visible'), duration);
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
