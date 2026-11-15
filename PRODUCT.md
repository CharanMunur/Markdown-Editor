# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers documenting code and projects.

## Product Purpose

Help developers write Markdown documentation, inspect a faithful live preview, and produce polished HTML and PDF exports. The user identified export polish as the main success measure.

## Positioning

Inferred from the implementation: a browser-based Markdown workspace that combines Monaco editing, a resizable live preview, syntax-highlighted code blocks, and formatted document export.

## Operating Context

Inferred from the implementation: users work in a web browser, can switch between split, editor-only, and preview-only layouts, import Markdown or text files, and return to locally saved content.

## Capabilities and Constraints

Confirmed by the code: Monaco editor; live Markdown, GFM, and raw HTML rendering; resizable split panes; editor and preview scroll synchronization; code wrapping control; theme switching; Markdown, HTML, and print/PDF export; file import; local storage persistence; and a Markdown formatting toolbar.

Confirmed user constraints from this conversation: preserve dark and light themes; use neutral black/white surfaces rather than blue accents; use Google Sans for the website and document output; use Shiki GitHub High Contrast syntax themes; keep the dark render background black and code blocks near `#1a1a1a`; keep the preview readable and centered; and keep exported output visually aligned with the preview.

## Brand Commitments

The existing product name is “Markdown Editor.” The user specified Google Sans typography, neutral black/white theme colors, and bright GitHub High Contrast syntax highlighting. No logo or other brand asset has been confirmed.

## Evidence on Hand

The repository contains the working React application, `src/assets/markdown.md` starter content, and the user-provided `code.txt` visual reference. No customer, usage, performance, or outcome claims have been supplied.

## Product Principles

- Inferred: make writing and previewing feel like one continuous task.
- Inferred: preserve document content and formatting across preview and export.
- Inferred: keep code samples readable and easy to copy.
- Inferred: keep editing controls easy to reach without crowding the writing surface.
