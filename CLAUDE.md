# CLAUDE.md

## Mapa del código (Graphify) — consultarlo SIEMPRE primero

Este repositorio tiene un mapa del código generado con [Graphify](https://github.com/Graphify-Labs/graphify) en `graphify-out/` (`graph.json` + `GRAPH_REPORT.md`).

**Regla:** antes de leer, buscar (grep/glob) o abrir cualquier archivo del código, consultá el mapa:

- `graphify query "<pregunta>"` — subgrafo con los archivos y líneas relevantes.
- `graphify explain "<símbolo o archivo>"` — qué es y con qué se conecta.
- `graphify path "<A>" "<B>"` — cómo se relacionan dos piezas.
- `graphify affected "<símbolo>"` — qué se rompe si cambiás algo.
- `graphify-out/GRAPH_REPORT.md` — vista general (comunidades y nodos centrales) para revisar la arquitectura.

Leé archivos completos solo cuando el mapa ya te señaló dónde mirar. Incluí esta regla en el prompt de cualquier subagente que explore código.

### Cómo regenerar el mapa

- Si falta la herramienta: `pip install "graphifyy[sql]"` (versión usada: 0.9.112) (en sesiones en la nube lo instala solo el hook de inicio, `.claude/hooks/graphify-setup.sh`).
- Después de cambiar código: `graphify update .` (solo AST, sin costo de API). El hook de inicio también lo corre al abrir sesión.
- Reconstrucción completa (después de refactors grandes o si el mapa queda raro):
  `graphify extract . --code-only --force && graphify cluster-only .`
- Ver el grafo interactivo: `graphify cluster-only .` genera `graphify-out/graph.html` (no se versiona).
- Los nombres de las comunidades están en `graphify-out/.graphify_labels.json`; si aparecen nombres de archivo en lugar de nombres descriptivos, se pueden editar ahí y volver a correr `graphify cluster-only .`.
- Commiteá `graphify-out/` actualizado junto con los cambios de código. Un diff grande en `graph.json` es normal.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
