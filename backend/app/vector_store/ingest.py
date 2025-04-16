import os
import shutil
from typing import List

from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, UnstructuredHTMLLoader
from langchain_community.vectorstores.utils import filter_complex_metadata
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from app.db.models import VectorContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from dotenv import load_dotenv
from pathlib import Path
load_dotenv()

# CONFIG
CHROMA_BASE_PATH = Path("backend",os.getenv("CHROMA_BASE_PATH")).resolve()
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME")

# HTML Chunking
def load_html_and_chunk(
    directory_path: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[Document]:
    """
    Loads and processes all HTML files in the specified directory.

    Args:
        directory_path (str): Path to the directory containing HTML files.
        chunk_size (int, optional): Size of each text chunk. Defaults to 1000.
        chunk_overlap (int, optional): Overlap between chunks. Defaults to 200.

    Returns:
        List[Document]: A list of processed Document objects.
    """
    # Initialize the DirectoryLoader with UnstructuredHTMLLoader
    loader = DirectoryLoader(
        path=directory_path,
        glob="**/*.html",
        loader_cls=lambda path: UnstructuredHTMLLoader(path, mode="single")
    )

    # Load documents from the directory
    documents = loader.load()

    # Initialize the text splitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    # Split documents into chunks
    split_docs = splitter.split_documents(documents)

    filtered_docs = filter_complex_metadata(split_docs)

    return filtered_docs


# Ingest Pipeline
async def ingest_collection(collection_name: str, input_dir: str, description: str, db: AsyncSession):
    """
    Extracts, semantically chunks, embeds, and stores HTML documents in Chroma.

    :param collection_name: Name of Chroma collection (used as folder name).
    :param input_dir: Path to directory containing HTML files.
    :param description: Optional description for logging/debugging.
    """
    chroma_path = os.path.join(CHROMA_BASE_PATH, collection_name)

    # Start fresh
    if os.path.exists(chroma_path):
        shutil.rmtree(chroma_path)

    print(f"🔍 Loading documents from: {input_dir}")
    documents = load_html_and_chunk(input_dir)

    print(f"🧠 Found {len(documents)} semantic chunks. Embedding...")

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

    Chroma.from_documents(
        documents,
        embedding=embeddings,
        persist_directory=chroma_path,
        collection_name=collection_name
    )

    if db:
        existing = await db.execute(
            select(VectorContext).where(VectorContext.chroma_collection_name == collection_name)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Collection with name '{collection_name}' already exists in DB.")

        vc = VectorContext(
            name=collection_name.replace("_", " ").title(),
            description=description,
            chroma_collection_name=collection_name
        )
        db.add(vc)
        await db.commit()

    print(f"✅ Collection '{collection_name}' ingested and stored at '{chroma_path}'.")


# EXAMPLE USAGE - 
# ONLY TO RUN THIS ingest.py module in silo
# ASSUMES ./backend/app/chroma_input/<Collection_Name>/ dir exists with .HTML files
import asyncio
from app.db.database import AsyncSessionLocal

async def main():
    collection_name = "Example_Collection_Name"
    input_dir = f"./backend/app/chroma_input/{collection_name}/" 
    description = "Description for collection created from HTML files."

    async with AsyncSessionLocal() as session:
        await ingest_collection(
            collection_name=collection_name,
            input_dir=input_dir,
            description=description,
            db=session
        )

if __name__ == "__main__":
    asyncio.run(main())