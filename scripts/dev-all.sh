#!/usr/bin/env bash
# Sobe toda a aplicação em Docker (API + UI + túnel Cloudflare) e mostra as URLs.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null || { echo "❌ Docker não encontrado. Instale o Docker Desktop."; exit 1; }
docker info >/dev/null 2>&1 || { echo "❌ O Docker não está rodando. Abra o Docker Desktop e tente de novo."; exit 1; }
[[ -f .env ]] || echo "⚠️  .env não encontrado: o WhatsApp ficará desativado (copie .env.example para .env)."

docker compose up -d --build

echo "⏳ Aguardando o túnel da Cloudflare..."
tunnel_host=""
for _ in $(seq 1 60); do
  tunnel_host=$(curl -fsS http://127.0.0.1:2000/quicktunnel 2>/dev/null | sed -nE 's/.*"hostname":"([^"]+)".*/\1/p' || true)
  [[ -n "$tunnel_host" ]] && break
  sleep 1
done

echo
echo "════════════════════════════════════════════════════════════════════"
echo "  💸 Controle de Gastos rodando"
echo
echo "  UI:               http://localhost:5173"
echo "  API:              http://localhost:3333/api"
if [[ -n "$tunnel_host" ]]; then
  echo "  WhatsApp webhook: https://${tunnel_host}/whatsapp/webhook"
  echo
  echo "  → Cole o webhook no console da Twilio (Sandbox do WhatsApp →"
  echo "    'When a message comes in', método POST). A URL muda a cada reinício."
else
  echo "  WhatsApp webhook: túnel não respondeu; veja 'docker compose logs tunnel'"
fi
echo
echo "  Ctrl+C para parar tudo (os dados ficam salvos no volume Docker)."
echo "════════════════════════════════════════════════════════════════════"
echo

trap 'echo; echo "🛑 Parando containers..."; docker compose stop' INT TERM
docker compose logs -f --tail=0 api web tunnel &
wait $!
