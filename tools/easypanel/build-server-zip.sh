#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
OUTPUT_ZIP="$ROOT_DIR/server-easypanel.zip"

if ! command -v zip >/dev/null 2>&1; then
  echo "Erro: comando 'zip' não encontrado."
  exit 1
fi

cd "$SERVER_DIR"

npm run build

rm -f "$OUTPUT_ZIP"

zip -r "$OUTPUT_ZIP" . \
  -x ".env" \
  -x "node_modules/*" \
  -x "*.log" \
  -x ".DS_Store"

echo "Pacote gerado em: $OUTPUT_ZIP"
