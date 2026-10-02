from pathlib import Path

from llama_index.core.node_parser import SentenceSplitter
from llama_index.readers.file import PDFReader

_splitter = SentenceSplitter(chunk_size=1000, chunk_overlap=200)


def load_and_chunk_pdf(pdf_path: Path) -> list[str]:
    pages = PDFReader().load_data(pdf_path)
    chunks: list[str] = []
    for page in pages:
        if page.text:
            chunks.extend(_splitter.split_text(page.text))
    return chunks
