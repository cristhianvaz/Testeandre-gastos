"""Gera os PDFs de teste (e seus gabaritos .expected.json) para validar a engine.

Uso: ../extractor/.venv/bin/python generate_sample_pdf.py
Para criar uma nova amostra basta adicionar um item em SAMPLES.
"""
import json
from dataclasses import dataclass
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

SAMPLES_DIR = Path(__file__).parent

# (data, descrição, valor, categoria esperada) — negativo = saída, positivo = entrada
Transaction = tuple[str, str, float, str]


@dataclass(frozen=True)
class Sample:
    file_stem: str
    title: str
    transactions: list[Transaction]


SAMPLES = [
    Sample(
        file_stem="extrato-teste",
        title="Extrato de Teste - 20 transacoes",
        transactions=[
            ("01/10/2026", "SALARIO EMPRESA XYZ LTDA", 8500.00, "Receitas"),
            ("02/10/2026", "ALUGUEL APARTAMENTO OUTUBRO", -2200.00, "Moradia"),
            ("03/10/2026", "SUPERMERCADO PAO DE ACUCAR", -412.37, "Alimentação"),
            ("04/10/2026", "UBER *TRIP SAO PAULO", -32.90, "Transporte"),
            ("05/10/2026", "IFOOD *RESTAURANTE SABOR", -78.50, "Alimentação"),
            ("06/10/2026", "NETFLIX.COM ASSINATURA", -55.90, "Lazer"),
            ("07/10/2026", "DROGASIL FARMACIA 1234", -89.75, "Saúde"),
            ("08/10/2026", "POSTO SHELL COMBUSTIVEL", -250.00, "Transporte"),
            ("09/10/2026", "ENEL ENERGIA ELETRICA", -187.42, "Moradia"),
            ("10/10/2026", "AMAZON MARKETPLACE BR", -349.99, "Compras"),
            ("11/10/2026", "SPOTIFY PREMIUM", -21.90, "Lazer"),
            ("12/10/2026", "PIX RECEBIDO JOAO SILVA", 150.00, "Receitas"),
            ("13/10/2026", "SMART FIT MENSALIDADE", -119.90, "Saúde"),
            ("14/10/2026", "ALURA CURSOS ONLINE", -89.00, "Educação"),
            ("15/10/2026", "VIVO FIBRA INTERNET", -129.99, "Moradia"),
            ("16/10/2026", "RESTAURANTE OUTBACK", -186.40, "Alimentação"),
            ("18/10/2026", "99APP *CORRIDA", -18.70, "Transporte"),
            ("20/10/2026", "MERCADO LIVRE COMPRA", -210.00, "Compras"),
            ("22/10/2026", "CINEMARK INGRESSOS", -64.00, "Lazer"),
            ("25/10/2026", "TARIFA PACOTE SERVICOS", -34.90, "Taxas e Tarifas"),
        ],
    ),
    Sample(
        file_stem="extrato-teste-andre-christian",
        title="Extrato de Teste - Andre e Christian",
        transactions=[
            # Sem palavra-chave conhecida: a engine deve cair no fallback "Outros".
            ("24/10/2026", "GASTO-TESTE-ANDRE", -2000.00, "Outros"),
            ("25/10/2026", "GASTO-TESTE-CHRISTIAN-WPP", -1000.00, "Outros"),
        ],
    ),
]

PRIMARY = colors.HexColor("#4F46E5")
MUTED = colors.HexColor("#6B7280")
ZEBRA = colors.HexColor("#F3F4F6")


def brl(value: float) -> str:
    formatted = f"{abs(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"-{formatted}" if value < 0 else formatted


def draw_header(pdf: canvas.Canvas, width: float, height: float) -> None:
    pdf.setFillColor(PRIMARY)
    pdf.rect(0, height - 90, width, 90, fill=1, stroke=0)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawString(40, height - 50, "Banco Exemplo S.A.")
    pdf.setFont("Helvetica", 11)
    pdf.drawString(40, height - 70, "Extrato de Conta Corrente - Outubro/2026")

    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 9)
    pdf.drawString(40, height - 110, "Cliente: Usuario de Teste    Agencia: 0001    Conta: 00000-0 (dados ficticios)")


def draw_table(pdf: canvas.Canvas, width: float, top: float, transactions: list[Transaction]) -> float:
    columns = {"data": 40, "descricao": 130, "valor": width - 40}
    y = top
    pdf.setFont("Helvetica-Bold", 10)
    pdf.setFillColor(colors.black)
    pdf.drawString(columns["data"], y, "DATA")
    pdf.drawString(columns["descricao"], y, "DESCRICAO")
    pdf.drawRightString(columns["valor"], y, "VALOR (R$)")
    y -= 8
    pdf.setStrokeColor(PRIMARY)
    pdf.line(40, y, width - 40, y)
    y -= 18

    pdf.setFont("Helvetica", 10)
    for index, (date, description, amount, _) in enumerate(transactions):
        if index % 2 == 0:
            pdf.setFillColor(ZEBRA)
            pdf.rect(40, y - 5, width - 80, 18, fill=1, stroke=0)
        pdf.setFillColor(colors.black)
        pdf.drawString(columns["data"], y, date)
        pdf.drawString(columns["descricao"], y, description)
        pdf.setFillColor(colors.HexColor("#DC2626") if amount < 0 else colors.HexColor("#059669"))
        pdf.drawRightString(columns["valor"], y, brl(amount))
        y -= 20
    return y


def draw_footer(pdf: canvas.Canvas, width: float, y: float, transactions: list[Transaction]) -> None:
    amounts = [amount for _, _, amount, _ in transactions]
    total_in = sum(a for a in amounts if a > 0)
    total_out = sum(a for a in amounts if a < 0)
    pdf.setStrokeColor(MUTED)
    pdf.line(40, y + 6, width - 40, y + 6)
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 9)
    # Rótulos sem data no início: o parser ignora estas linhas de resumo.
    pdf.drawString(40, y - 12, f"Total de entradas: R$ {brl(total_in)}")
    pdf.drawString(40, y - 26, f"Total de saidas: R$ {brl(total_out)}")
    pdf.drawString(40, y - 40, "Documento gerado para testes - nao possui valor legal.")


def write_pdf(sample: Sample) -> Path:
    output = SAMPLES_DIR / f"{sample.file_stem}.pdf"
    width, height = A4
    # invariant=1: sem data de criação embutida, o mesmo conteúdo gera o mesmo hash (detecção de duplicados).
    pdf = canvas.Canvas(str(output), pagesize=A4, invariant=1)
    pdf.setTitle(sample.title)
    draw_header(pdf, width, height)
    y = draw_table(pdf, width, height - 150, sample.transactions)
    draw_footer(pdf, width, y, sample.transactions)
    pdf.save()
    return output


def write_expected(sample: Sample) -> None:
    """Gabarito usado pelos testes de ponta a ponta do backend."""
    expected = [
        {"date": "-".join(reversed(date.split("/"))), "description": description,
         "amountCents": round(amount * 100), "category": category}
        for date, description, amount, category in sample.transactions
    ]
    output = SAMPLES_DIR / f"{sample.file_stem}.expected.json"
    output.write_text(json.dumps(expected, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    for sample in SAMPLES:
        output = write_pdf(sample)
        write_expected(sample)
        print(f"PDF gerado em {output}")


if __name__ == "__main__":
    main()
