# Performance review

## Scope and evidence

This review covers the local Vite app source and a production build. A live Chrome DevTools trace, request waterfall, Core Web Vitals, and accessibility snapshot could not be collected: the DevTools navigation call was blocked by the environment approval policy. The local dev server was available, but those browser measurements should be collected in an environment where Chrome DevTools MCP navigation is allowed before treating any runtime metric as a baseline.

Build evidence below comes from `npm run build` (Vite 7.3.1). It transformed 2,783 modules and completed successfully in 3.84 seconds. The emitted files include:

| Output | Transfer size (gzip) | Note |
|---|---:|---|
| Main `index` JavaScript chunk | 993.92 kB (301.86 kB) | Largest entry chunk; investigate its module composition and what is required for first interaction. |
| `markdown-vendor` JavaScript chunk | 478.13 kB (141.37 kB) | Markdown and Shiki renderer dependencies are grouped together. |
| CSS | 103.02 kB (18.02 kB) | Moderate compressed size; check which styles are needed above the fold. |

The build also emitted many individual Shiki language chunks, including several sizeable uncompressed chunks. The output alone does not establish whether all of them are requested at startup; confirm that in a production network trace before prioritizing their removal.

## Core Web Vitals summary

| Metric | Result | Rating |
|---|---|---|
| LCP | Not measured | Unknown |
| INP | Not measured | Unknown |
| CLS | Not measured | Unknown |
| FCP, TBT, Speed Index, TTFB | Not measured | Unknown |

## Findings and priorities

### 1. Reduce initial JavaScript and defer optional features — high potential impact

`App.jsx` imports both editor and preview immediately. The editor loads Monaco through `@monaco-editor/react`; the preview loads the Markdown renderer and Shiki integration. `TopBar.jsx` also statically imports PDF export (`jspdf` and `html2canvas` via `PdfExportDialog`) and print export (`print-js`). These are substantial capabilities for an editor and can increase startup download, parse, and execution work even when a visitor does not use them.

**Recommended changes:**

- Dynamically import PDF dialog/export code when the user chooses PDF export. Keep `print-js` behind the print action as well.
- Consider rendering Monaco with `React.lazy` and a Suspense fallback, or loading it when the editor view is opened. Keep the existing loading placeholder to avoid a blank pane.
- Inspect the emitted main chunk with a bundle visualizer and split only where it reduces initial required work. The measured main chunk is 993.92 kB raw / 301.86 kB gzip; the production network trace should confirm what the browser requests before interaction.

### 2. Limit syntax-highlighting language work — high potential impact

`PreviewPane.jsx` configures Shiki with 24 popular languages, and the build emits language chunks for a much broader set. This can add network and parse cost if language modules are eagerly requested. The output includes large examples such as `emacs-lisp` (790.02 kB raw / 198.84 kB gzip), `cpp` (785.49 kB raw / 53.20 kB gzip), and `markdown-vendor` (478.13 kB raw / 141.37 kB gzip). Confirm actual requests before making claims about startup transfer.

**Recommended changes:**

- Check the Network panel on a cold production load to see which language files are fetched before any fenced code is visible.
- If languages are eagerly loaded, register only the languages needed by the starter document and common usage, and dynamically load other grammars when a matching code fence is present.
- Consider rendering unrecognized or uncommon languages as plain text rather than paying the highlighting cost.

### 3. Avoid loading remote font CSS on the critical path — medium potential impact

`index.html` preconnects to Google Fonts and links a Google Sans stylesheet in the document head. This introduces third-party DNS/TLS and stylesheet work into initial rendering. Editor CSS names JetBrains Mono and Fira Code, but the page head only requests Google Sans.

**Recommended changes:**

- Verify which font families and weights are actually used in the initial view. Remove unused font requests.
- If Google Sans is required, self-host a subsetted WOFF2 where licensing allows, use `font-display: swap`, and preload only the truly critical font file. Otherwise use a system font stack.
- Check font loading and layout shifts in a trace before assigning a CLS impact.

### 4. Keep live preview work responsive for large documents — medium potential impact

`App.jsx` stores each editor change in React state, synchronously writes the full document to `localStorage` in an effect, and passes the new value to `MarkdownHooks` on every edit. Markdown parsing, raw HTML processing, and Shiki highlighting can become expensive as imported documents grow. This is a code-path risk, not a measured interaction delay.

**Recommended changes:**

- Profile typing with a large imported document and inspect INP/long tasks before changing behavior.
- If preview rendering blocks typing, debounce preview updates while keeping editor state immediate, or move markdown processing off the main thread.
- Avoid rewriting the entire saved document on every keystroke; debounce persistence and handle quota errors as the code already does.
- Consider skipping or deferring syntax highlighting while a user is actively typing.

### 5. Check production caching and compression — measurement needed

Vite creates hashed asset names, which supports long-lived immutable caching, but this repository does not configure the production host. Compression and cache headers therefore cannot be confirmed from source.

**Recommended changes:**

- Confirm the host serves hashed JS/CSS with Brotli or gzip and `Cache-Control: public, max-age=31536000, immutable`.
- Serve `index.html` with revalidation so deployments can update the asset manifest promptly.
- Inspect response headers and transferred sizes in the production Network panel.

## Codebase summary

- **Framework/build:** React 19 with Vite 7 and Tailwind CSS v4.
- **Existing optimizations:** production build minification and manual vendor chunks for React, markdown libraries, and icons; hashed output assets.
- **Largest opportunity:** reduce work needed before the editor is interactive by deferring PDF/print and evaluating Monaco/Shiki loading behavior.
- **Runtime unknowns:** LCP, INP, CLS, TTFB, resource waterfall, cache headers, accessibility, and real production transfer sizes remain unmeasured.

## Follow-up measurement

Run a cold-load trace against the production preview (and the deployed site if available), then inspect LCP breakdown, CLS culprits, render-blocking resources, network dependency graph, and all requested assets. Record desktop and mobile results separately. For interaction responsiveness, type into a short document and a large imported document; the navigation trace alone does not represent editing INP.
