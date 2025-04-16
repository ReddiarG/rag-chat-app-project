# backend/app/vector_store/create_collection.py

import asyncio
import os
import sys

from crawler import crawl_site
from ingest import ingest_collection
from app.db.database import AsyncSessionLocal
from dotenv import load_dotenv

load_dotenv()

async def create_vector_collection(collection_name: str, url: str, description: str):
    html_output_dir = os.path.join("backend", "app", "chroma_input", collection_name)
    os.makedirs(html_output_dir, exist_ok=True)

    print(f"🌐 Crawling site: {url}")
    await crawl_site(url, html_output_dir)

    print(f"🧠 Ingesting documents into Chroma for collection '{collection_name}'")
    async with AsyncSessionLocal() as db:
        await ingest_collection(
            collection_name=collection_name,
            input_dir=html_output_dir,
            description=description,
            db=db,
        )

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("USAGE")
        print("From root directory run the following command:")
        print("PYTHONPATH=backend python backend/app/vector_store/create_collection.py <collection_name> <url> <description>")
        sys.exit(1)

    collection_name = sys.argv[1]
    url = sys.argv[2]
    description = sys.argv[3]

    asyncio.run(create_vector_collection(collection_name, url, description))