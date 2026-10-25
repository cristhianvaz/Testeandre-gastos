from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path

from .extractors import ExtractorUnavailableError, OcrExtractor, PageTextExtractor, TextLayerExtractor

# Abaixo deste número de caracteres úteis consideramos que a página é uma imagem.
MIN_CHARS_PER_PAGE = 20


@dataclass
class ExtractionResult:
    method: str
    pages: list[str]
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


class ExtractionPipeline:
    """Tenta cada extrator em ordem até obter texto suficiente."""

    def __init__(self, extractors: list[PageTextExtractor] | None = None) -> None:
        self._extractors = extractors or [TextLayerExtractor(), OcrExtractor()]

    def run(self, pdf_path: Path) -> ExtractionResult:
        if not pdf_path.is_file():
            raise FileNotFoundError(f"Arquivo não encontrado: {pdf_path}")

        warnings: list[str] = []
        for extractor in self._extractors:
            try:
                pages = extractor.extract(pdf_path)
            except ExtractorUnavailableError as exc:
                warnings.append(str(exc))
                continue

            if self._has_enough_text(pages):
                return ExtractionResult(method=extractor.name, pages=pages, warnings=warnings)
            warnings.append(f"Extrator '{extractor.name}' não encontrou texto suficiente")

        raise ValueError("Não foi possível extrair texto do PDF. " + " | ".join(warnings))

    @staticmethod
    def _has_enough_text(pages: list[str]) -> bool:
        return bool(pages) and all(len(page.strip()) >= MIN_CHARS_PER_PAGE for page in pages)
