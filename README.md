# The Cannon Feed

A dark-themed Arsenal FC news dashboard that aggregates articles from multiple sources and auto-updates every hour via GitHub Actions.

**Live site:** https://ns-dhaliwal.github.io/arsenal

![The Cannon Feed](https://img.shields.io/badge/Arsenal-The%20Cannon%20Feed-EF0107?style=for-the-badge)

## Features

- Aggregates Arsenal news from 4 sources: Arsenal.com, BBC Sport, The Guardian, Sky Sports
- Filter articles by source with tab navigation
- Card layout with article images, summaries and relative timestamps
- Auto-updates every hour via a GitHub Actions cron job
- Deployed to GitHub Pages

## How it works

```
GitHub Actions (hourly cron)
  └─ scripts/fetch_rss.py        # Fetches RSS feeds, writes public/data.json
  └─ git commit & push to main
  └─ deploy.yml triggers          # Rebuilds React app and deploys to Pages
```

## RSS Sources

| Source | Feed |
|--------|------|
| Arsenal.com | `https://www.arsenal.com/rss.xml` |
| BBC Sport | `https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml` |
| The Guardian | `https://www.theguardian.com/football/arsenal/rss` |
| Sky Sports | `https://www.skysports.com/rss/12040` |

## Local development

```bash
npm install --legacy-peer-deps
npm start
```

To run the RSS fetcher locally (requires outbound access to the feed URLs):

```bash
python3 scripts/fetch_rss.py
```

## GitHub Actions workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `fetch-rss.yml` | Hourly cron + manual | Fetches feeds, commits `public/data.json` |
| `deploy.yml` | Push to `main` | Builds React app, deploys to GitHub Pages |

## Setup (for forks)

1. Enable GitHub Pages: **Settings → Pages → Source: GitHub Actions**
2. Update `homepage` in `package.json` to match your Pages URL
3. Trigger the fetch workflow manually from the Actions tab to populate articles immediately
