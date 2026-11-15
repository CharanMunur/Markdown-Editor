import React, { useEffect, useState, useRef } from "react";
import { flushSync } from "react-dom";
import ModeToggle from "../mode-toggle";
import { Switch } from "../ui/switch";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Check,
  Copy,
  Download,
  RotateCcwIcon,
  Upload,
  FileCode,
  FileText,
  Printer,
  WrapText,
  ChevronDown,
  Columns2,
  PanelLeftClose,
  PanelRightClose,
  HelpCircle,
  Folder,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FieldLabel } from "../ui/field";
import handleExport from "../export/HandleExport";
import { PdfExportDialog } from "../export/PdfExportDialog";
import { ImGithub } from "react-icons/im";

const TopBar = ({
  value,
  onReset,
  previewRef,
  syncEnabled,
  onToggleSync,
  wrapCode,
  onToggleCodeWrap,
  onImportFile,
  viewMode,
  onViewModeChange,
  onResetSplit,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!exportMenuOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-slot="dropdown-menu-trigger"], [data-slot="dropdown-menu-content"]')) return;
      setExportMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer, true);
  }, [exportMenuOpen]);

  const handleCopy = async () => {
    const text = value ?? "";
    if (!text) return;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
        return;
      } catch {}
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([value ?? ""], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHtml = () => {
    const themeClass = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const previewClone = previewRef?.current?.cloneNode(true);
    if (previewClone && previewRef?.current) {
      const copiedStyles = [
        "color", "background-color", "font-family", "font-size", "font-weight", "font-style",
        "line-height", "letter-spacing", "text-align", "text-decoration", "text-transform",
        "white-space", "overflow-wrap", "word-break", "display", "vertical-align",
        "list-style-type", "list-style-position", "margin-top", "margin-right", "margin-bottom",
        "margin-left", "padding-top", "padding-right", "padding-bottom", "padding-left",
        "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
        "border-color", "border-style", "border-radius", "border-collapse", "max-width",
        "opacity", "box-sizing", "overflow-x", "overflow-y", "gap", "align-items", "justify-content",
      ];
      const originalNodes = [previewRef.current, ...previewRef.current.querySelectorAll("*")];
      const clonedNodes = [previewClone, ...previewClone.querySelectorAll("*")];
      originalNodes.forEach((node, index) => {
        const computed = window.getComputedStyle(node);
        for (const property of copiedStyles) {
          clonedNodes[index].style.setProperty(property, computed.getPropertyValue(property));
        }
      });
      previewClone.style.setProperty("box-sizing", "border-box");
      previewClone.style.setProperty("width", "100%");
      previewClone.style.setProperty("max-width", "48rem", "important");
      previewClone.style.setProperty("margin-left", "auto", "important");
      previewClone.style.setProperty("margin-right", "auto", "important");
      previewClone.querySelectorAll(".markdown-code-copy").forEach((button) => {
        button.style.setProperty("opacity", "1", "important");
        button.style.setProperty("pointer-events", "auto", "important");
      });
    }
    const appStyles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules, (rule) => rule.cssText).join("\n");
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("\n");
    const htmlContent = `<!DOCTYPE html>
<html lang="en" class="${themeClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet">
  <style>${appStyles}
    body, .markdown-body { font-family: "Google Sans", sans-serif; }
    body { margin: 0; min-height: 100vh; }
    main.markdown-preview { min-height: 100vh; width: 100%; }
  </style>
</head>
<body>
  <main class="markdown-preview">
    ${previewClone ? previewClone.outerHTML : value}
  </main>
  <script>
    document.addEventListener("click", async (event) => {
      const button = event.target.closest(".markdown-code-copy");
      if (!button) return;
      const code = button.closest(".markdown-code-card")?.querySelector("pre")?.innerText;
      if (code == null) return;
      try {
        await navigator.clipboard.writeText(code);
        button.setAttribute("aria-label", "Copied");
        setTimeout(() => button.setAttribute("aria-label", "Copy code"), 1400);
      } catch (error) {
        const field = document.createElement("textarea");
        field.value = code;
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        field.remove();
      }
    });
  <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "document.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        onImportFile?.(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleToggleMode = (mode) => {
    if (mode === "both") {
      onViewModeChange("both");
      onResetSplit?.();
      return;
    }

    if (viewMode === mode) {
      onViewModeChange("both");
      onResetSplit?.();
    } else {
      onViewModeChange(mode);
    }
  };

  const runExportAction = (action) => {
    flushSync(() => setExportMenuOpen(false));
    action();
  };

  const viewModes = [
    {
      id: "both",
      label: "Split",
      icon: <Columns2 className="size-3.5" />,
      tooltip: viewMode === "both" ? "Currently in Split view" : "Split view",
    },
    {
      id: "editor",
      label: "Write",
      icon: <PanelRightClose className="size-3.5" />,
      tooltip: viewMode === "editor" ? "Exit Write mode" : "Editor only",
    },
    {
      id: "preview",
      label: "Preview",
      icon: <PanelLeftClose className="size-3.5" />,
      tooltip: viewMode === "preview" ? "Exit Preview mode" : "Preview only",
    },
  ];

  return (
    <>
      {/* ── TopBar shell ───────────────────────────────────────────── */}
      <header className="topbar sticky top-0 z-20 flex h-12 w-full items-center border-b border-border bg-card px-3 select-none">

        {/* ── LEFT: Brand ──────────────────────────────────────────── */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {/* Logo mark */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileCode className="h-3.5 w-3.5" />
          </div>

          {/* Wordmark */}
          <span className="hidden sm:block text-[13px] font-semibold tracking-tight text-foreground leading-none whitespace-nowrap">
            Markdown Editor
          </span>

          {/* GitHub link — icon only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href="https://github.com/CharanMunur/Markdown-Editor"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className="topbar-icon-btn ml-0.5"
              >
                <ImGithub className="size-3.5" />
              </a>
            </TooltipTrigger>
            <TooltipContent>View on GitHub</TooltipContent>
          </Tooltip>
        </div>

        {/* ── CENTER: View-mode switcher ────────────────────────────── */}
        <div className="flex items-center">
          <div className="topbar-seg" role="group" aria-label="View mode">
            {viewModes.map((mode) => {
              const isActive = viewMode === mode.id;
              return (
                <Tooltip key={mode.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToggleMode(mode.id)}
                      aria-pressed={isActive}
                      className={`topbar-seg-btn${isActive ? " topbar-seg-btn--active" : ""}`}
                    >
                      <span className="topbar-seg-icon">{mode.icon}</span>
                      <span className="hidden md:inline">{mode.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{mode.tooltip}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Actions ───────────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.markdown,.txt"
            className="hidden"
          />

          {/* Import */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="topbar-action-btn"
                aria-label="Import file"
              >
                <Upload className="size-3.5" />
                <span className="hidden lg:inline">Import</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Import .md or .txt file</TooltipContent>
          </Tooltip>

          {/* Reset */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onReset}
                className="topbar-action-btn"
                aria-label="Reset to starter template"
              >
                <RotateCcwIcon className="size-3.5" />
                <span className="hidden lg:inline">Reset</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Reset to starter template</TooltipContent>
          </Tooltip>

          {/* Copy */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!value}
                className={`topbar-action-btn${copied ? " topbar-action-btn--success" : ""}`}
                aria-label={copied ? "Copied" : "Copy Markdown"}
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy Markdown source</TooltipContent>
          </Tooltip>

          {/* Export — primary CTA */}
          <DropdownMenu open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="topbar-export-btn"
                aria-label="Export document"
              >
                <Download className="size-3.5" />
                <span>Export</span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="export-menu"
              onPointerDownOutside={() => setExportMenuOpen(false)}
            >
              {/* Panel header */}
              <div className="export-menu-header">
                <Download className="size-3" />
                <span>Export as</span>
              </div>

              {/* Markdown */}
              <DropdownMenuItem
                onSelect={() => runExportAction(handleDownloadMarkdown)}
                className="export-menu-item"
              >
                <div className="export-menu-icon">
                  <FileCode className="size-3.5" />
                </div>
                <div className="export-menu-text">
                  <div className="export-menu-label">
                    <span>Markdown</span>
                    <span className="export-menu-ext">.md</span>
                  </div>
                  <span className="export-menu-sub">Raw source · viewer handles styling</span>
                </div>
              </DropdownMenuItem>

              {/* HTML */}
              <DropdownMenuItem
                onSelect={() => runExportAction(handleDownloadHtml)}
                className="export-menu-item"
              >
                <div className="export-menu-icon">
                  <FileText className="size-3.5" />
                </div>
                <div className="export-menu-text">
                  <div className="export-menu-label">
                    <span>HTML</span>
                    <span className="export-menu-ext">.html</span>
                  </div>
                  <span className="export-menu-sub">Self-contained · styles baked in</span>
                </div>
              </DropdownMenuItem>

              {/* Divider + print section */}
              <div className="export-menu-section-label">Print</div>

              {/* PDF */}
              <DropdownMenuItem
                onSelect={() => {
                  setExportMenuOpen(false);
                  setTimeout(() => {
                    document.body.style.pointerEvents = "";
                    setShowPdfDialog(true);
                  }, 80);
                }}
                className="export-menu-item"
              >
                <div className="export-menu-icon">
                  <Printer className="size-3.5" />
                </div>
                <div className="export-menu-text">
                  <div className="export-menu-label">
                    <span>PDF Document</span>
                    <span className="export-menu-ext">PDF</span>
                  </div>
                  <span className="export-menu-sub">Custom PDF studio · preview & export</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* ── Separator ── */}
          <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

          {/* Wrap toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onToggleCodeWrap(!wrapCode)}
                aria-pressed={wrapCode}
                aria-label={`Code wrap ${wrapCode ? "on" : "off"}`}
                className={`topbar-icon-btn${wrapCode ? " topbar-icon-btn--active" : ""}`}
              >
                <WrapText className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>{wrapCode ? "Disable code wrapping" : "Wrap long code lines"}</TooltipContent>
          </Tooltip>

          {/* Sync scroll — compact label + switch */}
          <div className="hidden xl:flex items-center gap-1.5 px-1">
            <FieldLabel
              htmlFor="switch-sync"
              className="text-[11px] text-muted-foreground cursor-pointer font-normal select-none leading-none whitespace-nowrap"
            >
              Sync
            </FieldLabel>
            <Switch
              id="switch-sync"
              checked={syncEnabled}
              onCheckedChange={onToggleSync}
            />
          </div>

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setShowCheatSheet(true)}
                className="topbar-icon-btn"
                aria-label="Markdown quick reference"
              >
                <HelpCircle className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Markdown quick reference</TooltipContent>
          </Tooltip>

          {/* Theme toggle */}
          <ModeToggle />
        </div>
      </header>

      {/* ── Cheat-sheet dialog ──────────────────────────────────────── */}
      <Dialog open={showCheatSheet} onOpenChange={setShowCheatSheet}>
        <DialogContent className="cheatsheet-dialog">
          {/* Header */}
          <DialogHeader className="cheatsheet-header">
            <div className="cheatsheet-header-icon">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <DialogTitle className="cheatsheet-title">
                Markdown Quick Reference
              </DialogTitle>
              <p className="cheatsheet-subtitle">
                Common syntax for formatting your document
              </p>
            </div>
          </DialogHeader>

          {/* Grid of syntax cards */}
          <div className="cheatsheet-grid">
            {[
              {
                category: "Structure",
                title: "Headings",
                syntax: "# H1\n## H2\n### H3",
                hint: "Use # through ###### for 6 levels",
                token: "#",
              },
              {
                category: "Structure",
                title: "Horizontal Rule",
                syntax: "---\n***\n___",
                hint: "Three or more hyphens, asterisks, or underscores",
                token: "---",
              },
              {
                category: "Inline",
                title: "Emphasis",
                syntax: "**bold**\n*italic*\n~~strikethrough~~\n`inline code`",
                hint: "Nest to combine bold + italic",
                token: "**",
              },
              {
                category: "Inline",
                title: "Links & Images",
                syntax: "[Label](https://url)\n![Alt text](image.png)\n[ref]: https://url",
                hint: "Images use the same syntax with a leading !",
                token: "[]()",
              },
              {
                category: "Blocks",
                title: "Lists",
                syntax: "- Unordered item\n  - Nested item\n1. Ordered item\n- [ ] Task\n- [x] Done",
                hint: "Indent 2+ spaces to nest",
                token: "-  1.",
              },
              {
                category: "Blocks",
                title: "Blockquote",
                syntax: "> First level\n>> Nested quote\n>\n> New paragraph",
                hint: "Use >> to nest quotes",
                token: ">",
              },
              {
                category: "Code",
                title: "Code Blocks",
                syntax: "```js\nconst x = 1;\n```\n\n`inline`",
                hint: "Add a language name for syntax highlighting",
                token: "```",
              },
              {
                category: "Blocks",
                title: "Tables",
                syntax: "| Col A | Col B |\n|-------|-------|\n| val   | val   |",
                hint: "Use :--- ----: :---: for alignment",
                token: "| |",
              },
            ].map(({ category, title, syntax, hint, token }) => (
              <div key={title} className="cheatsheet-card">
                <div className="cheatsheet-card-header">
                  <div className="cheatsheet-card-title">{title}</div>
                  <code className="cheatsheet-token">{token}</code>
                </div>
                <pre className="cheatsheet-syntax">{syntax}</pre>
                <p className="cheatsheet-hint">{hint}</p>
              </div>
            ))}
          </div>

          {/* Footer tip */}
          <div className="cheatsheet-footer">
            <span className="cheatsheet-footer-label">GFM</span>
            <span>GitHub Flavored Markdown is fully supported — tables, task lists, and auto-links included.</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Custom PDF Export Studio Dialog ───────────────────────────── */}
      <PdfExportDialog
        open={showPdfDialog}
        onOpenChange={setShowPdfDialog}
        previewRef={previewRef}
        isDarkMode={document.documentElement.classList.contains("dark")}
      />
    </>
  );
};

export default TopBar;
