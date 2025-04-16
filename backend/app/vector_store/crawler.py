# backend/app/vector_store/crawler.py

import os
import requests
from xml.etree import ElementTree
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
import asyncio

from typing import List


def fetch_urls_from_sitemap(sitemap_url: str) -> List[str]:
    try:
        response = requests.get(sitemap_url)
        response.raise_for_status()
        root = ElementTree.fromstring(response.content)
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        return [loc.text for loc in root.findall('.//ns:loc', namespace)]
    except Exception:
        return []


async def crawl_urls(urls: List[str], output_dir: str, max_concurrent: int = 5):
    os.makedirs(output_dir, exist_ok=True)

    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=["--disable-gpu", "--disable-dev-shm-usage", "--no-sandbox"],
    )
    crawl_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
    crawler = AsyncWebCrawler(config=browser_config)
    await crawler.start()

    try:
        for i in range(0, len(urls), max_concurrent):
            batch = urls[i:i + max_concurrent]
            tasks = [
                crawler.arun(url=url, config=crawl_config, session_id=f"session_{i+j}")
                for j, url in enumerate(batch)
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for url, result in zip(batch, results):
                if hasattr(result, 'success') and result.success:
                    html = getattr(result, 'content', '') or getattr(result, 'html', '') or getattr(result, 'text', '')
                    if html:
                        filename = url.replace("https://", "").replace("http://", "").replace("/", "_")[:200] + ".html"
                        with open(os.path.join(output_dir, filename), "w", encoding="utf-8") as f:
                            f.write(html)
    finally:
        await crawler.close()


async def crawl_site(main_url: str, output_dir: str, max_concurrent: int = 5):
    # Try sitemap first
    sitemap_url = main_url.rstrip("/") + "/sitemap.xml"
    urls = fetch_urls_from_sitemap(sitemap_url)

    if not urls:
        urls = [main_url]  # fallback to main page only or use another strategy

    await crawl_urls(urls, output_dir=output_dir, max_concurrent=max_concurrent)