#!/bin/bash

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || exit 1

if [ ! -d "node_modules" ]; then
  echo "Instalando requisitos (uma única vez)..."
  npm install --omit=dev || {
    echo "Falha ao instalar dependências."
    read -r -p "Pressione Enter para fechar..." _
    exit 1
  }
fi

clear
node src/index.mjs
STATUS=$?

echo
read -r -p "Pressione Enter para fechar..." _
exit $STATUS
