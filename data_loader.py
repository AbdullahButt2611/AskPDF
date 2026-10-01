from dotenv import load_dotenv
from llama_index.core.node_parser import SentenceSplitter
from llama_index.readers.file import PDFReader
from openai import OpenAI

load_dotenv()

client = OpenAI()
EMBEDDING_MODEL = "text-embedding-3-large"
EMBEDDING_DIM = 3072

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
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]
