import os

import requests
from dotenv import load_dotenv
from llama_index.core.node_parser import SentenceSplitter
from llama_index.readers.file import PDFReader

load_dotenv()

EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 3072
EMBED_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBEDDING_MODEL}:batchEmbedContents"
EMBED_BATCH_SIZE = 100  # Gemini caps requests per batchEmbedContents call

splitter = SentenceSplitter(chunk_size=1000, chunk_overlap=200)

def load_and_chunk_pdf(file_path):
    docs = PDFReader().load_data(file_path)
    texts = [doc.text for doc in docs if getattr(doc, "text", None)]
    chunks = []

    for text in texts:
        split_texts = splitter.split_text(text)
        chunks.extend(split_texts)

    return chunks

def embed_texts(texts):
    vectors = []
    for i in range(0, len(texts), EMBED_BATCH_SIZE):
        batch = texts[i:i + EMBED_BATCH_SIZE]
        response = requests.post(
            EMBED_URL,
            headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"]},
            json={
                "requests": [
                    {
                        "model": f"models/{EMBEDDING_MODEL}",
                        "content": {"parts": [{"text": text}]},
                        "outputDimensionality": EMBEDDING_DIM,
                    }
                    for text in batch
                ]
            },
            timeout=60,
        )
        response.raise_for_status()
        vectors.extend(item["values"] for item in response.json()["embeddings"])
    return vectors
