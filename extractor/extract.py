"""CLI de extração: `python extract.py <arquivo.pdf>` -> JSON no stdout.

Contrato com o backend Node:
  sucesso -> exit 0, stdout: {"method": "...", "pages": ["..."], "warnings": [...]}
  falha   -> exit 1, stderr: {"error": "mensagem"}
"""
import json
import sys
from pathlib import Path

from pdf_extractor import ExtractionPipeline


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(json.dumps({"error": "uso: extract.py <arquivo.pdf>"}), file=sys.stderr)
        return 1

    try:
        result = ExtractionPipeline().run(Path(argv[1]))
    except Exception as exc:  # noqa: BLE001 - fronteira do processo
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 1

    print(json.dumps(result.to_dict(), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
