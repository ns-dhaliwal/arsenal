#!/usr/bin/env python3
"""Fetch RSS feeds from Arsenal news sources and write to public/data.json."""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError
import xml.etree.ElementTree as ET

FEEDS = [
    {
        "source": "arsenal",
        "name": "Arsenal.com",
        "url": "https://www.arsenal.com/rss.xml",
    },
    {
        "source": "bbc",
        "name": "BBC Sport Arsenal",
        "url": "https://feeds.bbci.co.uk/sport/football/teams/arsenal/rss.xml",
    },
    {
        "source": "guardian",
        "name": "The Guardian Arsenal",
        "url": "https://www.theguardian.com/football/arsenal/rss",
    },
    {
        "source": "sky",
        "name": "Sky Sports Arsenal",
        "url": "https://www.skysports.com/rss/12040",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; CannonFeed/1.0; +https://github.com/ns-dhaliwal/arsenal)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

NS = {
    "media": "http://search.yahoo.com/mrss/",
    "content": "http://purl.org/rss/1.0/modules/content/",
    "dc": "http://purl.org/dc/elements/1.1/",
}


def strip_html(text: str) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def parse_date(date_str: str) -> str | None:
    if not date_str:
        return None
    formats = [
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S GMT",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%dT%H:%M:%SZ",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except ValueError:
            continue
    return None


def find_image(item) -> str | None:
    # media:content
    media = item.find("media:content", NS)
    if media is not None:
        url = media.get("url")
        if url:
            return url

    # media:thumbnail
    thumb = item.find("media:thumbnail", NS)
    if thumb is not None:
        url = thumb.get("url")
        if url:
            return url

    # enclosure
    enclosure = item.find("enclosure")
    if enclosure is not None:
        enc_type = enclosure.get("type", "")
        if "image" in enc_type:
            return enclosure.get("url")

    # try extracting from description
    desc = item.findtext("description") or ""
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', desc)
    if match:
        return match.group(1)

    return None


def fetch_feed(feed: dict) -> list[dict]:
    articles = []
    try:
        req = Request(feed["url"], headers=HEADERS)
        with urlopen(req, timeout=15) as resp:
            content = resp.read()
        root = ET.fromstring(content)
        channel = root.find("channel") or root

        for item in channel.findall("item"):
            title = strip_html(item.findtext("title") or "")
            link = item.findtext("link") or ""
            if not title or not link:
                continue

            summary_raw = item.findtext("description") or item.find(
                "content:encoded", NS
            )
            if hasattr(summary_raw, "text"):
                summary_raw = summary_raw.text or ""
            summary = strip_html(summary_raw or "")[:400]

            pub_date = parse_date(
                item.findtext("pubDate") or item.findtext("dc:date", namespaces=NS) or ""
            )

            image = find_image(item)

            articles.append(
                {
                    "source": feed["source"],
                    "title": title,
                    "link": link.strip(),
                    "summary": summary,
                    "published": pub_date,
                    "image": image,
                }
            )

        print(f"  ✓ {feed['name']}: {len(articles)} articles")
    except (URLError, ET.ParseError, Exception) as e:
        print(f"  ✗ {feed['name']}: {e}", file=sys.stderr)

    return articles


def main():
    print("Fetching Arsenal RSS feeds...")
    all_articles = []

    for feed in FEEDS:
        articles = fetch_feed(feed)
        all_articles.extend(articles)

    # Sort by published date descending, nulls last
    all_articles.sort(
        key=lambda a: a["published"] or "0000", reverse=True
    )

    # Deduplicate by URL
    seen = set()
    unique = []
    for a in all_articles:
        if a["link"] not in seen:
            seen.add(a["link"])
            unique.append(a)

    output = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "articles": unique,
    }

    out_path = Path(__file__).parent.parent / "public" / "data.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
    print(f"\nWrote {len(unique)} articles to {out_path}")


if __name__ == "__main__":
    main()
