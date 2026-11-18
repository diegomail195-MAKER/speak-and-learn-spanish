#!/usr/bin/env bash
# Prepara Graphify al iniciar una sesión de Claude Code.
# - En sesiones en la nube (efímeras) lo instala si falta.
# - Si el mapa quedó viejo respecto del código, lo actualiza (solo AST, sin costo de API).
# Nunca bloquea el inicio de la sesión.
cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0

if ! command -v graphify >/dev/null 2>&1; then
  if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
    pip install -q "graphifyy[sql]" >/dev/null 2>&1 || true
  fi
fi

command -v graphify >/dev/null 2>&1 || exit 0

if [ -f graphify-out/graph.json ]; then
  graphify update . >/dev/null 2>&1 || true
fi
exit 0
