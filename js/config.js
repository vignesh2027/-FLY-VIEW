const CONFIG = {
  CESIUM_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiY2Q0MjA5MC0zZGI4LTRjNWMtOTQ2Yi0wNGQ3MmU1ZWQ1ZmYiLCJpZCI6NDMzMDY3LCJpc3MiOiJodHRwczovL2lvbi5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3NzkxMDk0Mzl9.OMwIrjCSeSviKsHPthE4u1ztCWXb5Dw4XzXy4DQyqGY',
  AVIATION_API: 'eb36799a043cb49c94bea18fbba9a701',

  FLIGHT_APIS: [
    'https://api.adsb.lol/v2/all',
    'https://opendata.adsb.fi/api/v2/all',
    'https://api.airplanes.live/v2/all'
  ],
  FLIGHT_API_INDEX: 0,

  OPENSKY_URL: 'https://opensky-network.org/api/states/all',

  OTX_BASE: 'https://otx.alienvault.com/api/v1',

  NEWS_RSS_PROXY: 'https://api.rss2json.com/v1/api.json?rss_url=',
  NEWS_FEEDS: [
    'https://feeds.feedburner.com/TechCrunch',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ],

  MODES: { ATLAS: 'atlas', STORM: 'storm', TRANSIT: 'transit' },

  FLIGHT_REFRESH: 15000,
  THREAT_REFRESH: 60000,
  NEWS_REFRESH: 120000,

  MAX_FLIGHTS_DISPLAY: 800,
  ARC_HEIGHT_FACTOR: 0.15,

  COLORS: {
    FLIGHT: '#FFD700',
    FLIGHT_ARC: '#FFA500',
    THREAT: '#FF6600',
    THREAT_HIGH: '#FF2200',
    UI_TEXT: '#FFFFFF',
    BG: '#000000',
    ACCENT: '#FF6600'
  }
};
