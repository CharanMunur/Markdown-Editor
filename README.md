# Markdown Editor

A high-performance, lightweight web-based Markdown editor and live previewer built with React 19, Monaco Editor, Tailwind CSS v4, and Shadcn UI.

---

## ⚡ Features

- **Full Markdown + Raw HTML Support**:
  - Seamlessly renders embedded raw HTML (`<div>`, `<picture>`, `<span>`, `<details>`, custom styled badges, tables, and SVGs) alongside Markdown via `rehype-raw`.
  - Supports GitHub-Flavored Markdown (GFM) including task checklists, tables, autolinks, and footnotes.
- **Split & Fullscreen Layout Modes**:
  - Resizable split-pane editor and preview with draggable split divider.
  - Segmented toggleable view modes: **Split**, **Write** (Editor only), and **Preview** (Preview only) with clear active-state feedback.
- **Monaco Editor Integration**:
  - Full syntax highlighting, line numbers, word wrap, smooth scrolling, and caret animations.
  - Custom dark and light themes aligned with modern design tokens (`OKLCH`).
- **Markdown Quick Formatting Toolbar**:
  - One-click formatting tools for Bold, Italic, Strikethrough, Headings (H1–H3), Lists (bulleted, numbered, task checkboxes), Inline Code, Blockquotes, Links, Images, Tables, and Horizontal Rules.
  - Intelligent selection wrapping and cursor positioning.
- **Responsive Live Preview**:
  - Elements and code blocks dynamically scale and adapt to any pane width or split ratio without horizontal layout breaking.
  - Interactive code blocks with language syntax highlighting and 1-click copy-to-clipboard buttons.
- **Document Management & Export**:
  - **Import**: Load any `.md`, `.markdown`, or `.txt` file directly into the editor.
  - **Export Markdown**: Download document as `.md`.
  - **Export HTML**: Download clean, standalone `.html` with bundled styling.
  - **Print / PDF**: Export formatted documents directly to PDF via print styles.
  - **Clipboard Copy**: Quick one-click copy of raw Markdown text.
  - **Local Persistence**: Automatically saves work in `localStorage`.
- **Built-in Quick Reference Cheatsheet**:
  - Accessible Shadcn dialog referencing common Markdown syntax patterns.
- **Lightweight & Fast**:
  - Powered by Vite 7 and Bun with optimized chunk splitting.
  - Responsive design with dark/light theme switching.

---

## 🛠️ Tech Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Frontend Framework**: [React 19](https://react.dev/)
- **Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)
- **Styling & UI**:
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Shadcn UI](https://ui.shadcn.com/) (Radix UI primitives)
  - [Lucide Icons](https://lucide.dev/)
- **Markdown & HTML Processing**:
  - `react-markdown`
  - `remark-gfm`
  - `rehype-raw`
  - `rehype-highlight`

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Bun](https://bun.sh/) installed (recommended) or Node.js.

### Installation

```bash
# Clone the repository
git clone https://github.com/CharanMunur/Markdown-Editor.git
cd Markdown-Editor

# Install dependencies using Bun
bun install
```

### Development

```bash
bun run dev
```

### Production Build

```bash
bun run build
bun run preview
```

---

## 📁 Project Structure

```text
Markdown-Editor/
├── src/
│   ├── assets/
│   │   └── markdown.md               # Default starter template
│   ├── components/
│   │   ├── editor/
│   │   │   ├── EditorPane.jsx        # Monaco Editor wrapper & themes
│   │   │   └── EditorToolbar.jsx     # Markdown formatting action bar
│   │   ├── export/
│   │   │   └── HandleExport.jsx      # Print / PDF generation
│   │   ├── header/
│   │   │   └── TopBar.jsx            # App header, layout toggles & exports
│   │   ├── preview/
│   │   │   ├── CodeBlock.jsx         # Code fence with copy button
│   │   │   └── PreviewPane.jsx       # Markdown, HTML & GFM renderer
│   │   └── ui/                       # Shadcn UI primitives (dialog, tooltip, toggle, badge, etc.)
│   ├── providers/
│   │   └── theme/                    # Dark / light theme provider
│   ├── App.jsx                       # Main application layout & split container
│   ├── index.css                     # Design tokens & markdown styling
│   └── main.jsx
├── components.json                   # Shadcn UI configuration
├── vite.config.js                    # Vite configuration & chunk optimization
└── package.json
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
