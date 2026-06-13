# Hero poster

As of v7 the hero poster is a **server-rendered inline SVG** drawn in
`components/hero/HeroPoster.tsx` (a command-center floor grid, a tactical node
network, and a glowing core). It is the Largest Contentful Paint base layer and
the fallback whenever the WebGL scene cannot run, and it ships as part of the
page markup with no image request.

The raster `shipday-workspace.png` in this directory is a legacy placeholder
from v6. It is no longer referenced by the page; the inline SVG poster replaced
it. The generator `scripts/gen-hero-placeholder.mjs` still produces it but is
not part of the build.

## Changing the hero art

- To adjust the current poster, edit `components/hero/HeroPoster.tsx`.
- To use a raster illustration instead, render an `<img>` (or Next `<Image>`)
  as the base layer in `components/hero/Hero.tsx` in place of `<HeroPoster />`,
  keeping the 16:9 band and the scrim so text contrast holds over any scene
  state.
- The hero region `alt` text lives in `components/hero/Hero.tsx`; update it if
  the poster changes.
