class LiveFeedManager {
  constructor() {
    this._items   = [];
    this._el      = null;
    this._paused  = false;
    this._maxItems= 120;
    this._interval= null;
  }

  init() {
    this._el = document.getElementById('feedList');
    if (!this._el) return;

    // Pause scroll on hover
    this._el.addEventListener('mouseenter', () => { this._paused = true; });
    this._el.addEventListener('mouseleave', () => { this._paused = false; });

    const toggleBtn = document.getElementById('feedToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const panel = document.getElementById('feedPanel');
        if (!panel) return;
        const collapsed = panel.classList.toggle('collapsed');
        toggleBtn.textContent = collapsed ? '▲' : '▼';
      });
    }

    // Seed with placeholder entries
    this._seed();

    // Auto-generate events every 3–8 seconds
    this._scheduleNext();
  }

  _seed() {
    const seeds = [
      { type:'flight',  msg:'✈ AA101 departed JFK → LHR at FL380, 540 kts' },
      { type:'flight',  msg:'✈ EK203 crossing Arabian Sea at FL410' },
      { type:'threat',  msg:'⚠ New OTX pulse — Ransomware campaign targeting EU healthcare' },
      { type:'flight',  msg:'✈ IndiGo 6E-214 BOM→DEL airborne, FL280' },
      { type:'threat',  msg:'⚠ APT activity detected — 840 new indicators from Russia' },
      { type:'flight',  msg:'✈ SQ321 SIN→LHR passing over India at FL390' },
      { type:'news',    msg:'◈ AI governance framework draft released — EU Parliament vote pending' },
      { type:'threat',  msg:'⚠ North Korea Lazarus: SWIFT network scanning detected' },
      { type:'flight',  msg:'✈ QF1 SYD→DXB airborne, 14h 25m flight time' },
      { type:'system',  msg:'◉ ADSB.LOL feeding 9,847 aircraft globally' },
    ];
    seeds.forEach((s, i) => {
      setTimeout(() => this._push(s.type, s.msg, true), i * 200);
    });
  }

  ingestFlights(flights) {
    if (!flights || flights.length === 0) return;
    const top = flights
      .filter(f => f.callsign && f.alt > 20000)
      .sort((a, b) => b.alt - a.alt)
      .slice(0, 3);
    top.forEach(f => {
      this._push('flight',
        `✈ ${f.callsign} ${f.origin ? f.origin + ' → ' : ''}at FL${Math.round((f.alt / 100))} · ${Math.round(f.speed || 0)} kts · ${f.lat.toFixed(1)}° ${f.lon.toFixed(1)}°`
      );
    });
    // Random mid-pack flight
    const rnd = flights[Math.floor(Math.random() * Math.min(100, flights.length))];
    if (rnd?.callsign) {
      this._push('flight', `✈ ${rnd.callsign} tracked — heading ${Math.round(rnd.heading || 0)}° at ${Math.round(rnd.alt || 0).toLocaleString()} ft`);
    }
  }

  ingestThreats(threats) {
    if (!threats || threats.length === 0) return;
    threats.slice(0, 2).forEach(t => {
      const age = t.ts ? this._relTime(t.ts) : 'RECENT';
      this._push('threat',
        `⚠ [SEV ${Math.round(t.severity)}] ${t.type} — ${t.country} — ${t.desc?.slice(0, 80)}${t.desc?.length > 80 ? '...' : ''} · ${age}`
      );
    });
  }

  ingestOTXPulses(pulses) {
    pulses.slice(0, 3).forEach(p => {
      const ioc = p.indicator_count || 0;
      const countries = (p.targeted_countries || []).slice(0, 3).join(', ') || 'GLOBAL';
      this._push('threat',
        `⚠ OTX PULSE · "${p.name?.slice(0, 60)}" · ${ioc} IOCs · Targeting: ${countries}`
      );
    });
  }

  ingestNews(articles) {
    articles.slice(0, 3).forEach(a => {
      this._push('news', `◈ ${a.title?.slice(0, 90)}${a.title?.length > 90 ? '...' : ''}`);
    });
  }

  _push(type, msg, silent = false) {
    const now    = new Date();
    const timeStr= now.toUTCString().slice(17, 25);

    const item = { type, msg, time: timeStr, id: Date.now() + Math.random() };
    this._items.unshift(item);
    if (this._items.length > this._maxItems) this._items.pop();

    if (this._el && !silent) this._renderTop(item);
    else if (this._el && silent) this._renderTop(item, true);
  }

  _renderTop(item, instant = false) {
    const el   = this._el;
    const div  = document.createElement('div');
    div.className = `feed-item feed-${item.type}`;
    div.innerHTML = `
      <span class="feed-time">${item.time}</span>
      <span class="feed-msg">${item.msg}</span>`;

    if (!instant) {
      div.style.opacity = '0';
      div.style.transform = 'translateY(-6px)';
    }

    el.insertBefore(div, el.firstChild);

    if (!instant) {
      requestAnimationFrame(() => {
        div.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        div.style.opacity = '1';
        div.style.transform = 'translateY(0)';
      });
    }

    // Trim DOM to keep it fast
    while (el.children.length > this._maxItems) {
      el.removeChild(el.lastChild);
    }

    // Auto-scroll to top unless paused
    if (!this._paused) el.scrollTop = 0;
  }

  _scheduleNext() {
    const delay = 3000 + Math.random() * 5000;
    this._interval = setTimeout(() => {
      this._autoEvent();
      this._scheduleNext();
    }, delay);
  }

  _autoEvent() {
    const events = [
      () => {
        const callsigns = ['BA112','LH441','AF447','TK1','EK203','QR7','SQ21','CX234','AI102','UA901'];
        const cs = callsigns[Math.floor(Math.random() * callsigns.length)];
        const fl = Math.floor(Math.random() * 200 + 280);
        const kts= Math.floor(Math.random() * 120 + 420);
        this._push('flight', `✈ ${cs} cruising FL${fl} · ${kts} kts · on route`);
      },
      () => {
        const types = ['RANSOMWARE','PHISHING','APT','BOTNET','DDoS','MALWARE','ZERO-DAY'];
        const countries = ['United States','Germany','India','Brazil','Russia','China','Ukraine','United Kingdom'];
        const t = types[Math.floor(Math.random() * types.length)];
        const c = countries[Math.floor(Math.random() * countries.length)];
        const ioc = Math.floor(Math.random() * 400 + 20);
        this._push('threat', `⚠ ${t} CAMPAIGN — ${c} · ${ioc} new indicators logged`);
      },
      () => {
        const total = Math.floor(Math.random() * 2000 + 8000);
        this._push('system', `◉ GLOBAL COVERAGE · ${total.toLocaleString()} aircraft tracked · ${Math.floor(Math.random()*5+2)} feeds active`);
      },
      () => {
        const headlines = [
          'AI chip export controls tightened — NVIDIA H100 restricted to 5 new nations',
          'Anthropic raises $2B Series E — Claude 5 development accelerates',
          'Cybersecurity budget hits all-time high — $300B projected for 2025',
          'Global aviation hits post-pandemic record — 4.8B passengers in Q1',
          'OpenAI o3 model surpasses human baseline on ARC-AGI benchmark',
          'EU Cyber Solidarity Act enters enforcement phase',
          'Boeing 777X receives FAA certification — first deliveries Q3',
          'Satellite internet reaches 2B+ connected users milestone',
          'CISA issues emergency directive — critical infrastructure at risk',
          'India aviation: IndiGo orders 500 A320neos — largest single order in Asia',
        ];
        const h = headlines[Math.floor(Math.random() * headlines.length)];
        this._push('news', `◈ ${h}`);
      },
      () => {
        const airports = [['JFK','LHR'],['BOM','DXB'],['DEL','SIN'],['CDG','JFK'],['NRT','SFO'],['SYD','LAX'],['IST','ORD'],['DXB','BKK']];
        const pair = airports[Math.floor(Math.random() * airports.length)];
        const count= Math.floor(Math.random() * 18 + 4);
        this._push('flight', `✈ CORRIDOR ${pair[0]}→${pair[1]} · ${count} active flights · density ${count > 14 ? 'HIGH' : 'NORMAL'}`);
      }
    ];
    const fn = events[Math.floor(Math.random() * events.length)];
    fn();
  }

  _relTime(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'JUST NOW';
    if (m < 60) return `${m}M AGO`;
    return `${Math.floor(m / 60)}H AGO`;
  }
}
