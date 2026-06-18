import React, { useState, useEffect } from 'react';
import './App.css';

const SOURCE_LABELS = {
  arsenal: 'Arsenal.com',
  bbc: 'BBC Sport',
  guardian: 'The Guardian',
  sky: 'Sky Sports',
};

const SOURCE_CSS = {
  arsenal: 'source-arsenal',
  bbc: 'source-bbc',
  guardian: 'source-guardian',
  sky: 'source-sky',
};

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function NewsCard({ article }) {
  const srcClass = SOURCE_CSS[article.source] || 'source-default';
  const srcLabel = SOURCE_LABELS[article.source] || article.source;

  return (
    <a className="news-card" href={article.link} target="_blank" rel="noopener noreferrer">
      {article.image ? (
        <img className="news-card-image" src={article.image} alt="" loading="lazy" onError={e => { e.target.style.display='none'; }} />
      ) : (
        <div className="news-card-image-placeholder">⚽</div>
      )}
      <div className="news-card-body">
        <div className="news-card-meta">
          <span className={`news-card-source ${srcClass}`}>{srcLabel}</span>
          <span className="news-card-date">{formatDate(article.published)}</span>
        </div>
        <div className="news-card-title">{article.title}</div>
        {article.summary && <div className="news-card-summary">{article.summary}</div>}
      </div>
      <div className="news-card-footer">
        <span className="news-card-read">Read Article</span>
        <span className="news-card-arrow">→</span>
      </div>
    </a>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data.json?t=${Date.now()}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const allArticles = data?.articles || [];
  const filtered = activeFilter === 'all' ? allArticles : allArticles.filter(a => a.source === activeFilter);

  const sourceCounts = allArticles.reduce((acc, a) => {
    acc[a.source] = (acc[a.source] || 0) + 1;
    return acc;
  }, {});

  const filters = [
    { key: 'all', label: `All (${allArticles.length})` },
    ...Object.keys(sourceCounts).map(k => ({ key: k, label: `${SOURCE_LABELS[k] || k} (${sourceCounts[k]})` })),
  ];

  const lastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <span className="header-cannon">🔴</span>
            <div>
              <div className="header-title">The Cannon Feed</div>
              <div className="header-subtitle">Arsenal FC · Live News Dashboard</div>
            </div>
          </div>
          <div className="header-meta">
            {lastUpdated && (
              <div className="header-updated">Updated <span>{lastUpdated}</span></div>
            )}
          </div>
        </div>
      </header>

      <div className="filter-bar">
        <div className="filter-bar-inner">
          {filters.map(f => (
            <button
              key={f.key}
              className={`filter-btn ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <main className="main">
        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading the latest Arsenal news...</div>
          </div>
        )}

        {error && (
          <div className="loading">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Could not load feed</div>
            <div className="empty-state-sub">{error}</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">{allArticles.length}</div>
                <div className="stat-label">Articles</div>
              </div>
              {Object.entries(sourceCounts).map(([src, count]) => (
                <div className="stat-item" key={src}>
                  <div className="stat-value">{count}</div>
                  <div className="stat-label">{SOURCE_LABELS[src] || src}</div>
                </div>
              ))}
            </div>

            <div className="grid">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">⚽</div>
                  <div className="empty-state-title">No articles yet</div>
                  <div className="empty-state-sub">The feed will populate when the GitHub Action runs for the first time.</div>
                </div>
              ) : (
                filtered.map((article, i) => <NewsCard key={article.link || i} article={article} />)
              )}
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="footer-text">
          The Cannon Feed · Aggregating Arsenal news from Arsenal.com, BBC Sport, The Guardian &amp; Sky Sports · Auto-updated every hour via GitHub Actions
        </div>
      </footer>
    </>
  );
}
