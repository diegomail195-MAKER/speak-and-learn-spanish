# CLAUDE.md

## Diseño de la interfaz — reglas para cualquier cambio

- **Cada componente se adapta a su contenedor**, no solo a la pantalla: tablas, tarjetas, barras y modales usan `@container` / anchos flexibles (`min-w-0`, `flex-wrap`, `minmax()`), nunca anchos fijos que desborden. Cuando los controles dejan de caber, se reorganizan (pasan a otra fila, a un menú «More» o a tarjetas) en lugar de crear scroll horizontal.
- **Escala de espacios consistente:** 8 / 16 / 24 / 32 px (`2 / 4 / 6 / 8` en Tailwind), bordes de 1 px, esquinas de 8–12 px (20 px solo en el modal Add image). Controles de al menos 44 px de alto; botones de icono de 44 × 44 con iconos de 20 px.
- **Colores y tamaños solo desde los tokens** de `src/app/globals.css` (`paper`, `card`, `line`, `ink`, `muted`, `primary`, `primary-soft`, `lavender`, `plum`, `mango`, `coral-soft`…) y desde los componentes compartidos (`Button`, `Field`, `Panel`, `IconButton`, `Menu`, `ConfirmDialog`, `UiIcon`). No escribas colores hexadecimales sueltos en los componentes de la app.
- **Menús y ayudas emergentes** se abren con `Menu` / `IconButton`, que los colocan dentro de la pantalla (hacia arriba en la última fila, sin salirse por los bordes).
- **Verifica antes de entregar** a 1440, 1024, 768 y 390 px con contenido largo (nombres, usuarios y textos largos), varias tarjetas (primera y última), menús abiertos cerca de los bordes, navegación con teclado (foco visible) y `prefers-reduced-motion`. Comprueba que no haya scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`).
