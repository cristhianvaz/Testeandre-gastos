"""Estratégias de extração de texto de PDFs.

Cada extrator implementa o mesmo contrato (`PageTextExtractor`), o que permite
adicionar novas estratégias sem alterar o pipeline (Open/Closed).
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path


class ExtractorUnavailableError(RuntimeError):
    """Dependência de sistema ausente para uma estratégia de extração."""


class PageTextExtractor(ABC):
    name: str

    @abstractmethod
    def extract(self, pdf_path: Path) -> list[str]:
        """Retorna o texto de cada página, na ordem."""


class TextLayerExtractor(PageTextExtractor):
    """Lê a camada de texto nativa do PDF (rápido e preciso para PDFs digitais)."""

    name = "text-layer"

    def extract(self, pdf_path: Path) -> list[str]:
        import pdfplumber

        with pdfplumber.open(pdf_path) as pdf:
            return [page.extract_text(layout=False) or "" for page in pdf.pages]


class OcrExtractor(PageTextExtractor):
    """Rasteriza as páginas e aplica OCR (para PDFs escaneados/imagens)."""

    name = "ocr"

    def __init__(self, language: str = "por", dpi: int = 300) -> None:
        self._language = language
        self._dpi = dpi

    def extract(self, pdf_path: Path) -> list[str]:
        try:
            import pytesseract
            from pdf2image import convert_from_path

            pytesseract.get_tesseract_version()
        except Exception as exc:  # noqa: BLE001 - qualquer falha aqui = OCR indisponível
            raise ExtractorUnavailableError(
                "OCR indisponível: instale o Tesseract (brew install tesseract tesseract-lang)"
            ) from exc

        images = convert_from_path(str(pdf_path), dpi=self._dpi)
        language = self._resolve_language(pytesseract)
        return [pytesseract.image_to_string(image, lang=language) for image in images]

    def _resolve_language(self, pytesseract) -> str:
        available = set(pytesseract.get_languages(config=""))
        return self._language if self._language in available else "eng"
