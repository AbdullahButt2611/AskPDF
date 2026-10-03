import re
import unicodedata
from pathlib import Path

from llama_index.core.node_parser import SentenceSplitter
from pypdf import PdfReader

# Smaller, focused passages retrieve more precisely and keep prompts short for small local models
_splitter = SentenceSplitter(chunk_size=512, chunk_overlap=64)

# Wide runs of spaces in layout-mode text are table column gaps; justified prose stays below this
_COLUMN_GAP = re.compile(r" {6,}")
_SPACE_RUN = re.compile(r" {2,}")
_UNDECODABLE_CHARS = re.compile(r"[\ud800-\udfff�]")
_EXTRA_BLANK_LINES = re.compile(r"\n{3,}")
_MIN_CHUNK_CHARS = 20


def load_and_chunk_pdf(pdf_path: Path) -> list[str]:
    chunks: list[str] = []
    for page in PdfReader(pdf_path).pages:
        # Layout mode keeps words on their lines; the default mode puts many PDFs one word per line
        text = _clean_text(page.extract_text(extraction_mode="layout"))
        if text:
            chunks.extend(_splitter.split_text(text))
    # Drops fragments such as a page that only holds its page number
    return [chunk for chunk in chunks if len(chunk) >= _MIN_CHUNK_CHARS]


def _clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)  # Also turns ligatures like "ﬂ" into plain letters
    text = _UNDECODABLE_CHARS.sub("", text)
    lines = [_SPACE_RUN.sub(" ", _COLUMN_GAP.sub(" | ", line.strip())) for line in text.splitlines()]
    return _EXTRA_BLANK_LINES.sub("\n\n", "\n".join(lines)).strip()
