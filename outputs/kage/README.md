# Kage — personal portfolio

Kage is a single-page, scroll-driven Three.js portfolio. It uses local HTML, CSS, JavaScript, generated transparent WebP foreground layers, SVG project illustrations, and a vendored Three.js runtime. It has no build step or remote font, image, analytics, or tracker dependencies.

The `Blogs` link opens `blogs/index.html`, a read-only list of two articles with their own full pages: an About Me template and a C debugging note. `blogs/writing-room.html` is a local drafting desk with Markdown preview, browser-local autosave, and Markdown export. The site is static: there is no server login or publishing API. Visitors cannot change the published article files through the writing room, but the writing-room URL itself is not password-protected.

## Preview

Serve this directory over HTTP so the browser can load the JavaScript modules:

```sh
python3 -m http.server 4173 --directory .
```

Then open `http://localhost:4173`.

## Replace the portfolio placeholders

Edit [index.html](./index.html) before publishing:

- Replace `YOUR NAME`, `[YOUR ROLE / TITLE]`, and the hero statement.
- Replace the biography, values, project titles, years, descriptions, tool lists, and verified outcomes.
- Fill in skill categories, experience, education, achievements, and the CV link.
- Replace the email and GitHub / LinkedIn destinations with the owner's real details.
- Replace the closing philosophy, signature, and copyright name.

The placeholder copy is intentionally explicit because no owner biography or project data was supplied. Project artwork is original scene illustration, not a representation of real projects. Replace it with project imagery when available.

## Runtime

Three.js `0.186.1` is stored in `vendor/` with its MIT license in `vendor/THREE-LICENSE.txt`. The page uses relative asset paths for repository-subpath hosting. The foreground `.webp` files preserve transparency and are generated from the small script at `../../work/generate_assets.py` in this workspace.
