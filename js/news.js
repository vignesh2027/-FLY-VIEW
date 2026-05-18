class NewsManager {
  constructor() {
    this.articles = [];
    this.cache = { data: null, ts: 0 };
  }

  async fetchNews(topic = '') {
    const now = Date.now();
    if (this.cache.data && now - this.cache.ts < 120000 && !topic) return this.cache.data;

    const feeds = CONFIG.NEWS_FEEDS;
    const allArticles = [];

    for (const feed of feeds) {
      try {
        const url = `${CONFIG.NEWS_RSS_PROXY}${encodeURIComponent(feed)}&count=10&api_key=public`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) continue;
        const json = await res.json();
        if (json.items) {
          json.items.forEach(item => {
            allArticles.push({
              title: item.title,
              link: item.link,
              pubDate: item.pubDate,
              thumbnail: item.thumbnail,
              description: item.description ? item.description.replace(/<[^>]+>/g, '').slice(0, 200) : ''
            });
          });
        }
      } catch { continue; }
    }

    if (allArticles.length > 0) {
      allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      this.articles = allArticles;
      this.cache = { data: allArticles, ts: now };
      return allArticles;
    }

    return this._getFallbackNews();
  }

  _getFallbackNews() {
    return [
      { title: 'Global AI adoption accelerates across enterprise sectors', link: '#', pubDate: new Date().toISOString(), description: 'Enterprise AI spending reaches new highs as companies race to integrate LLMs into core workflows.' },
      { title: 'Cybersecurity spending to exceed $300B in 2025', link: '#', pubDate: new Date().toISOString(), description: 'Ransomware threats and nation-state attacks drive record investment in defensive capabilities.' },
      { title: 'OpenAI, Anthropic, Google in race for next-gen reasoning models', link: '#', pubDate: new Date().toISOString(), description: 'The AI frontier models are pushing reasoning capabilities beyond human-level benchmarks.' },
      { title: 'Aviation industry embraces AI for predictive maintenance', link: '#', pubDate: new Date().toISOString(), description: 'Major airlines deploy machine learning to predict component failures before they happen.' },
      { title: 'Quantum computing threatens current encryption standards', link: '#', pubDate: new Date().toISOString(), description: 'NIST finalizes post-quantum cryptography standards as quantum supremacy milestones are reached.' },
      { title: 'Satellite internet reaches 1B users globally', link: '#', pubDate: new Date().toISOString(), description: 'Low-Earth orbit constellations reshape global connectivity, especially in underserved regions.' }
    ];
  }

  filterByRegion(regionKeywords) {
    if (!regionKeywords || regionKeywords.length === 0) return this.articles.slice(0, 6);
    const kws = regionKeywords.map(k => k.toLowerCase());
    const scored = this.articles.map(a => {
      const txt = `${a.title} ${a.description}`.toLowerCase();
      const score = kws.reduce((s, k) => s + (txt.includes(k) ? 1 : 0), 0);
      return { ...a, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const relevant = scored.filter(a => a.score > 0).slice(0, 3);
    const rest = scored.filter(a => a.score === 0).slice(0, 3 - relevant.length);
    return [...relevant, ...rest].slice(0, 6);
  }
}
