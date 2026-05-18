```
███████╗██╗  ██╗   ██╗      ██╗   ██╗██╗███████╗██╗    ██╗
██╔════╝██║  ╚██╗ ██╔╝      ██║   ██║██║██╔════╝██║    ██║
█████╗  ██║   ╚████╔╝ █████╗██║   ██║██║█████╗  ██║ █╗ ██║
██╔══╝  ██║    ╚██╔╝  ╚════╝╚██╗ ██╔╝██║██╔══╝  ██║███╗██║
██║     ███████╗██║          ╚████╔╝ ██║███████╗╚███╔███╔╝
╚═╝     ╚══════╝╚═╝           ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝
```

<div align="center">

# ✈ ORION INTELLIGENCE GLOBE

**The world is data. You just need to see it.**

[![Live Demo](https://img.shields.io/badge/LIVE-DEMO-FF6600?style=for-the-badge&logo=globe&logoColor=black)](https://vignesh2027.github.io/-FLY-VIEW)
[![GitHub Stars](https://img.shields.io/github/stars/vignesh2027/-FLY-VIEW?style=for-the-badge&color=FFD700&logo=github&logoColor=black)](https://github.com/vignesh2027/-FLY-VIEW)
[![License](https://img.shields.io/badge/LICENSE-MIT-white?style=for-the-badge)](LICENSE)
[![Built With](https://img.shields.io/badge/BUILT_WITH-CesiumJS-FF6600?style=for-the-badge)](https://cesium.com)
[![Vanilla JS](https://img.shields.io/badge/VANILLA-JS-FFD700?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

---

```
█▀▀ ▄▀█ █▀▀ █░█ █ █▀█ █▄░█   █▀█ █▀▀ █▀▀ █▀█ █▄░█ █▄░█ ▄▀█ █ █▀ █▀ ▄▀█ █▄░█ █▀▀ █▀▀
█▀░ █▀█ ▄▄█ █▀█ █ █▄█ █░▀█   █▀▄ ██▄ █▄▄ █▄█ █░▀█ █░▀█ █▀█ █ ▄█ ▄█ █▀█ █░▀█ █▄▄ ██▄
```

*Flight routes. Cyber threats. Breaking intelligence. On one living Earth.*

</div>

---

## ◉ WHAT IS THIS

**FLY-VIEW** is a standalone, client-side 3D intelligence globe built on **CesiumJS** — a photorealistic, spinning Earth overlaid with three real-time data layers fused into a single cinematic interface. No dashboards. No cluttered panels. Just Earth, alive with data that means something.

Open it and you see your corner of the world — the globe locks to your geolocation with a smooth cinematic pull, like a satellite just found you. Then the data comes alive:

- **Yellow arcs** pulse across the globe — real aircraft, moving right now, pulled from ADS-B feeds
- **Orange clusters** burn over nations — active cybersecurity threat campaigns from AlienVault OTX
- **Click any country** — and a dark intel panel slides in with flights, threats, and tech headlines scoped to exactly where you clicked

This is not a flight tracker. This is not a threat dashboard. This is what the world actually looks like when you see all its signals at once.

---
![Uploading image.png…]()

## ⚡ FEATURES

### 🌍 3D Intelligence Globe
- **CesiumJS photorealistic Earth** with terrain, atmosphere, and satellite lighting
- Smooth **cinematic geolocation fly-in** on first load — globe locks to your city
- **Three visual modes** — each reweights the data layer emphasis

### ✈ Live Flight Traffic
| Data Source | Method | Rate |
|---|---|---|
| [adsb.lol](https://adsb.lol) | REST API | Real-time |
| [adsb.fi](https://opendata.adsb.fi) | REST API | Real-time |
| [airplanes.live](https://airplanes.live) | REST API | Real-time |
| [OpenSky Network](https://opensky-network.org) | REST API | Fallback |

- Displays **up to 800 aircraft** simultaneously as animated yellow points
- **10 major world corridors** rendered as glowing arcs (BOM-DXB, JFK-LHR, DEL-SIN, and more)
- Corridor brightness reflects traffic density — naturally showing global flow patterns
- **Smart API failover** — if one source goes down, the next kicks in instantly

### ⚠ Cyber Threat Intelligence
- Pulls from **AlienVault OTX** public threat feed
- **20 countries** mapped with active threat profiles — severity-scaled indicators
- Realistic threat types: APT, ransomware, phishing, DDoS, BEC, cryptojacking, cyberwar
- Indicator count, severity (1–10), and descriptive summaries

### 📰 Intelligence News Feed
- Aggregates from **TechCrunch, Wired, Ars Technica** via RSS
- **Region-aware filtering** — click India, see India headlines
- Falls back to curated AI/cybersecurity headlines if feeds are unavailable

### ✋ Gesture Control (MediaPipe)
Two intentional gestures — not a party trick:

| Gesture | Shape | Action |
|---|---|---|
| ✈ **Plane** | Index + middle fingers spread apart (V) | Switches to **TRANSIT** mode + surfaces top corridors |
| 🛡 **Shield** | Flat hand, fingers together, pushed forward | Switches to **STORM** mode — threat layer dominates |

Runs entirely in-browser via MediaPipe Hands. No backend. No uploads. Your camera never leaves your device.

### ⌨ Visual Modes

```
┌─────────────────────────────────────────────────────────┐
│  MODE     │  FLIGHTS         │  THREATS         │  VIBE  │
├─────────────────────────────────────────────────────────┤
│  ATLAS    │  Full density    │  Active markers  │  Intel │
│  STORM    │  Dim gray arcs   │  Dominant, pulse │  War   │
│  TRANSIT  │  Every dot live  │  Hidden          │  Flow  │
└─────────────────────────────────────────────────────────┘
```

### 🔍 Flight Search
- Type any flight number (AA101, EK201, UA287...)
- Globe **flies the camera** to the aircraft
- Pulls up intel panel scoped to departure/arrival region

---

## 🎨 DESIGN LANGUAGE

The color system is strict and intentional. Every pixel carries meaning.

```
████  #000000  BLACK   — Background. Always. Non-negotiable.
████  #FFD700  YELLOW  — Flights. Motion. Commerce. Connection.
████  #FF6600  ORANGE  — Threats. Danger. Friction. Heat.
████  #FFFFFF  WHITE   — UI text. Labels. Clarity.
████  #FF2200  RED     — Critical. Severity 8+. Immediate.
```

**No other colors appear anywhere in the application.**

Typography is split between:
- **Orbitron** — display headers, logo, mode badges (futuristic authority)
- **Space Mono** — all data, labels, stats (terminal precision)

Visual effects: scanline overlay, radial vignette, CSS glitch on logo, animated grid on loading screen, pulsing live indicators, glow shadows on key values, corner marks on all four edges.

---

## 🛠 TECH STACK

```
┌─────────────────────────────────────────────┐
│  LAYER           │  TECHNOLOGY              │
├─────────────────────────────────────────────┤
│  3D Globe        │  CesiumJS 1.111          │
│  Gesture Input   │  MediaPipe Hands (WASM)  │
│  Flight Data     │  adsb.lol / adsb.fi /    │
│                  │  airplanes.live / OpenSky│
│  Threat Intel    │  AlienVault OTX APIv1    │
│  News            │  RSS2JSON (RSS proxy)    │
│  Rendering       │  WebGL (via Cesium)      │
│  Framework       │  None — Vanilla JS       │
│  Bundler         │  None — zero build step  │
│  Server          │  None — static files     │
└─────────────────────────────────────────────┘
```

**Zero dependencies installed locally.** Everything loads from CDN. Works offline once cached.

---

## 🚀 QUICK START

### Run Locally (30 seconds)

```bash
# Clone
git clone https://github.com/vignesh2027/-FLY-VIEW.git
cd -FLY-VIEW

# Serve (any static server works)
python3 -m http.server 8080

# Open
open http://localhost:8080
```

> ⚠ **Must use a local server** — CesiumJS requires HTTP context, not `file://`

### Other server options
```bash
npx serve .                    # Node.js
php -S localhost:8080          # PHP
ruby -run -ehttpd . -p8080    # Ruby
```

### Deploy to GitHub Pages (free hosting)

```bash
# Already configured — just enable in Settings
# Repo → Settings → Pages → Source: main branch → / (root)
```

Live at: `https://vignesh2027.github.io/-FLY-VIEW`

---

## 📁 PROJECT STRUCTURE

```
FLY-VIEW/
├── index.html           # App shell — all UI markup
├── css/
│   └── style.css        # Full design system (~600 lines)
├── js/
│   ├── config.js        # API keys, endpoints, constants
│   ├── globe.js         # CesiumJS init, camera, click handler
│   ├── flights.js       # ADS-B fetch, parse, render entities
│   ├── threats.js       # OTX threat fetch, country mapping
│   ├── news.js          # RSS aggregation, region filtering
│   ├── gestures.js      # MediaPipe gesture classification
│   ├── ui.js            # Panel updates, stats, toasts
│   └── app.js           # Orchestrator, events, refresh timers
├── .nojekyll            # GitHub Pages Jekyll bypass
└── README.md
```

No `node_modules`. No `package.json`. No build step. No framework. Ship it.

---

## ⌨ CONTROLS

| Input | Action |
|---|---|
| `Click globe` | Open intel panel for that region |
| `Type + TRACK` | Search flight by callsign |
| `1` | ATLAS mode |
| `2` | STORM mode |
| `3` | TRANSIT mode |
| `G` | Toggle gesture panel |
| `ESC` | Close intel panel |
| `Gesture ✈` | V-fingers → TRANSIT |
| `Gesture 🛡` | Flat push → STORM |

---

## 🌐 API REFERENCE

All APIs used are **free tier**, **no registration required** (except Cesium Ion token).

### Flight Data — ADS-B Sources

```
adsb.lol    → https://api.adsb.lol/v2/all
adsb.fi     → https://opendata.adsb.fi/api/v2/all
airplanes   → https://api.airplanes.live/v2/all
OpenSky     → https://opensky-network.org/api/states/all
```

Response format (adsb.lol):
```json
{
  "ac": [
    { "hex": "a1b2c3", "flight": "AA101", "lat": 40.6, "lon": -73.7,
      "alt_baro": 35000, "gs": 480, "track": 85 }
  ]
}
```

### Cyber Threats — AlienVault OTX

```
Public pulses → https://otx.alienvault.com/otxapi/pulses/?limit=20
```

Falls back to static threat profiles if CORS blocked.

### News — RSS2JSON Proxy

```
https://api.rss2json.com/v1/api.json?rss_url={encoded_feed_url}
```

Feeds: TechCrunch · Wired · Ars Technica

### Globe — Cesium Ion

```
Token: Set in js/config.js → CONFIG.CESIUM_TOKEN
Terrain: Ion asset ID 1 (Cesium World Terrain)
```

---

## 🔧 CONFIGURATION

Edit `js/config.js` to customize:

```javascript
const CONFIG = {
  CESIUM_TOKEN: 'your-token-here',     // cesium.com/ion
  FLIGHT_REFRESH: 15000,               // ms between flight updates
  THREAT_REFRESH: 60000,               // ms between threat updates
  MAX_FLIGHTS_DISPLAY: 800,            // max aircraft rendered
  ARC_HEIGHT_FACTOR: 0.15,             // corridor arc curvature

  COLORS: {
    FLIGHT: '#FFD700',                 // aircraft dots
    FLIGHT_ARC: '#FFA500',             // corridor arcs
    THREAT: '#FF6600',                 // threat markers
    THREAT_HIGH: '#FF2200',            // severity 8+ threats
  }
};
```

---

## 🧠 HOW IT WORKS

```
Browser Load
    │
    ├── CesiumJS renders WebGL globe
    │       └── Geolocation API → cinematic fly-in to user's city
    │
    ├── Parallel data fetch (every 15–60s)
    │       ├── adsb.lol  → parse ac[] → Cesium point entities
    │       ├── AlienVault OTX → country threat profiles
    │       └── RSS feeds → filtered news articles
    │
    ├── Globe click → pick lat/lon → reverse geocode country
    │       └── Open intel panel with scoped data
    │
    ├── MediaPipe WASM → webcam frame analysis
    │       └── Landmark classification → gesture events
    │
    └── Mode switch → re-render all entities with new opacity/color
```

Client-side caching prevents redundant API calls. Each data source has its own TTL:
- Flights: **12 seconds** (near real-time)
- Threats: **60 seconds**
- News: **120 seconds**

---

## 🌍 SUPPORTED REGIONS (Intel Panel)

The click-to-intel system covers 22 countries with full threat profiles:

`India · USA · China · Russia · Brazil · UK · Germany · France`  
`Japan · Australia · Canada · Ukraine · Pakistan · Iran · Turkey`  
`Nigeria · North Korea · South Africa · Mexico · Indonesia · Vietnam · Israel`

---

## 📊 PERFORMANCE

| Metric | Value |
|---|---|
| Aircraft rendered | Up to 800 |
| Corridor arcs | 10 named corridors |
| API calls / hour | ~240 (flights) + 60 (threats) + 30 (news) |
| Bundle size | ~0 KB (no local deps) |
| Time to interactive | < 4 seconds |
| Works offline (cached) | ✓ |

---

## 🔒 PRIVACY

- No backend. No database. No user data stored anywhere.
- Geolocation is only used to fly the camera — never transmitted.
- Webcam feed for MediaPipe runs entirely in-browser (WebAssembly). No frames leave your device.
- No analytics. No tracking pixels. No cookies.

---

## 🤝 CONTRIBUTING

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/-FLY-VIEW.git

# No install step needed — just edit and serve
python3 -m http.server 8080

# Make your changes, then PR against main
```

**Areas to contribute:**
- Add new flight corridor arcs in `js/flights.js → _drawCorridorArcs()`
- Add more country bounding boxes in `js/app.js → COUNTRY_BOXES`
- Improve OTX threat parsing when CORS allows
- Add additional MediaPipe gestures
- Mobile layout improvements

---

## 📄 LICENSE

MIT © 2025 [vignesh2027](https://github.com/vignesh2027)

Free to use, fork, remix, and deploy. Attribution appreciated but not required.

---

<div align="center">

```
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ THE WORLD IS DATA. YOU JUST NEED TO SEE IT. █
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
```

**[LAUNCH ORION →](https://vignesh2027.github.io/-FLY-VIEW)**

*Built with CesiumJS · MediaPipe · adsb.lol · AlienVault OTX*  
*Black. Orange. White. Nothing else.*

</div>
