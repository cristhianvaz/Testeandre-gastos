# 💸 Controle de Gastos

Importa extratos bancários / faturas em **PDF**, extrai as transações (texto nativo ou **OCR**),
**categoriza automaticamente** e armazena em **SQLite**. Dashboard em **React**.

## Como rodar (Docker — recomendado)

Pré-requisito: Docker Desktop aberto. Copie `.env.example` para `.env` com as credenciais da Twilio.

```bash
npm run dev:all    # API + UI + túnel Cloudflare; imprime as URLs (Ctrl+C para parar)
npm run dev:down   # remove os containers (o volume com o SQLite é mantido)
```

O script mostra a URL pública `https://<aleatório>.trycloudflare.com/whatsapp/webhook`.
Cole-a no Console da Twilio → *Messaging → Try it out → WhatsApp Sandbox* →
**When a message comes in** (POST). A URL de Quick Tunnel **muda a cada reinício** do container `tunnel`.

No Docker o OCR (Tesseract + português) já vem instalado.

### WhatsApp

- Envie um **PDF** → recebe "Recebi seu PDF…" e, em seguida, o resumo categorizado do extrato.
- Envie **resumo** → totais gerais por categoria.
- Qualquer outro texto → instruções.

O webhook valida o header `X-Twilio-Signature`; requisições sem assinatura válida recebem 403.

## Como rodar (local, sem Docker)

Pré-requisitos: Node ≥ 20.11, Python ≥ 3.10.

```bash
npm run setup   # instala deps Node (raiz, backend, frontend) + venv Python do extrator
npm run dev     # API em :3333 e frontend em http://localhost:5173
```

Abra http://localhost:5173 e arraste `samples/extrato-teste.pdf` para a área de upload.

**OCR (opcional, para PDFs escaneados):** `brew install tesseract tesseract-lang`.
Sem o Tesseract, PDFs digitais continuam funcionando (leitura da camada de texto).

## Testes

```bash
npm test            # unitários + ponta a ponta (Python → parser → categorização → SQLite)
npm run sample:pdf  # regenera samples/extrato-teste.pdf e o gabarito .expected.json
```

## Arquitetura

```
teste-gastos/
├── extractor/          Python — só extrai texto do PDF (SRP)
│   ├── extract.py        CLI: PDF → JSON { method, pages, warnings }
│   └── pdf_extractor/    Strategy: TextLayerExtractor → fallback OcrExtractor
├── backend/            Node.js + Express + better-sqlite3
│   └── src/
│       ├── domain/       Regras puras: categorias, dinheiro (centavos), erros
│       ├── services/     StatementParser, CategorizationService,
│       │                 ImportStatementService (caso de uso), PythonPdfTextExtractor (adaptador)
│       ├── repositories/ Acesso ao SQLite (SQL isolado aqui)
│       ├── controllers/  HTTP ↔ casos de uso, validação de entrada
│       ├── database/     Conexão + migrações versionadas (PRAGMA user_version)
│       └── app.js        Composition root (injeção de dependências)
├── frontend/           React + Vite (sem libs de gráfico — barras em HTML/CSS)
└── samples/            PDF de teste com 20 transações + gabarito
```

Fluxo de importação: `upload → hash SHA-256 (bloqueia duplicado) → Python extrai texto →
parser reconhece linhas "DD/MM[/AAAA] DESCRIÇÃO VALOR [D|C]" → categorizador → transação SQL atômica`.

Decisões principais:

- **Valores em centavos (inteiros)** — sem erros de ponto flutuante.
- **Categorização por palavra-chave mais específica**: "UBER EATS" (Alimentação) vence "UBER" (Transporte);
  casamento por palavra inteira e sem acentos. Sem regra → Receitas (crédito) ou Outros (débito).
- **Correção manual** pela tabela: a transação fica marcada como `manual`.
- **Dependências invertidas**: o caso de uso recebe extrator/parser/categorizador por construtor,
  então trocar o OCR, o banco ou o parser não altera o fluxo.

### Ensinando novas regras

Edite `backend/src/domain/categories.js` e adicione palavras-chave à categoria desejada.

## API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/statements` | upload (multipart, campo `file`) |
| GET | `/api/statements` | extratos importados |
| DELETE | `/api/statements/:id` | remove extrato e suas transações |
| GET | `/api/transactions?month=AAAA-MM&categoryId=&type=expense\|income&search=` | lista |
| GET | `/api/transactions/summary?month=AAAA-MM` | totais, por categoria e por mês |
| PATCH | `/api/transactions/:id/category` | `{ "categoryId": "lazer" }` |
| GET | `/api/categories` | categorias disponíveis |
