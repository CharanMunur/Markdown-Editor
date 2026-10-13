import React, { useState, useRef } from "react";
import ModeToggle from "../mode-toggle";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
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
  ChevronDown,
  Columns2,
  PanelLeftClose,
  PanelRightClose,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { FieldLabel } from "../ui/field";
import handleExport from "../export/HandleExport";
import { ImGithub } from "react-icons/im";

const TopBar = ({
  value,
  onReset,
  previewRef,
  syncEnabled,
  onToggleSync,
  onImportFile,
  viewMode,
  onViewModeChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const fileInputRef = useRef(null);

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
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 820px; margin: 40px auto; padding: 0 24px; line-height: 1.6; color: #24292f; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { font-family: monospace; background: #afb8c133; padding: 0.2em 0.4em; border-radius: 4px; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #d0d7de; margin: 0; padding-left: 1em; color: #57609a; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #d0d7de; padding: 6px 13px; text-align: left; }
    th { background: #f6f8fa; }
  </style>
</head>
<body>
  ${previewRef?.current ? previewRef.current.innerHTML : value}
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
    // If clicking the current active mode, toggle back to both (or toggle off)
    if (viewMode === mode) {
      onViewModeChange("both");
    } else {
      onViewModeChange(mode);
    }
  };

  const viewModes = [
    {
      id: "both",
      label: "Split",
      icon: <Columns2 className="size-3.5" />,
      tooltip: viewMode === "both" ? "Click to toggle single view" : "Switch to Split View",
    },
    {
      id: "editor",
      label: "Write",
      icon: <PanelRightClose className="size-3.5" />,
      tooltip: viewMode === "editor" ? "Exit Write mode (Split)" : "Editor Only",
    },
    {
      id: "preview",
      label: "Preview",
      icon: <PanelLeftClose className="size-3.5" />,
      tooltip: viewMode === "preview" ? "Exit Preview mode (Split)" : "Preview Only",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border/80 bg-card/90 px-4 py-2 text-foreground shadow-2xs backdrop-blur-md select-none transition-colors">
        {/* Left Side: Brand and view layout segmented tab controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <FileCode className="h-4 w-4" />
            </div>

            <span className="text-sm font-semibold tracking-tight text-foreground">
              Markdown Editor
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/CharanMunur/Markdown-Editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Repository"
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <ImGithub className="size-4" />
                </a>
              </TooltipTrigger>
              <TooltipContent>View GitHub Repository</TooltipContent>
            </Tooltip>
          </div>

          {/* Clean Segmented Tab Control with obvious active state */}
          <div className="hidden sm:flex items-center rounded-lg border border-border/80 bg-muted/50 p-1 shadow-inner">
            {viewModes.map((mode) => {
              const isActive = viewMode === mode.id;
              return (
                <Tooltip key={mode.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleToggleMode(mode.id)}
                      className={`relative flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer ${
                        isActive
                          ? "bg-background text-foreground shadow-xs ring-1 ring-border/50 font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                      }`}
                      aria-pressed={isActive}
                    >
                      <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                        {mode.icon}
                      </span>
                      <span className="hidden md:inline">{mode.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-primary rounded-full md:hidden" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{mode.tooltip}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Right Side: Primary Actions */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.markdown,.txt"
            className="hidden"
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer gap-1.5 font-normal h-8"
              >
                <Upload className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Import</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import local .md or .txt file</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="cursor-pointer gap-1.5 font-normal h-8"
              >
                <RotateCcwIcon className="size-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset editor to starter template</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!value}
                className={`cursor-pointer gap-1.5 font-normal h-8 transition-colors ${
                  copied ? "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400" : ""
                }`}
              >
                {copied ? (
                  <Check className="size-3.5 text-green-500" />
                ) : (
                  <Copy className="size-3.5 text-muted-foreground" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy Markdown content</TooltipContent>
          </Tooltip>

          {/* Export Dropdown with enhanced options and styling */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="cursor-pointer gap-1.5 h-8 font-medium shadow-xs"
              >
                <Download className="size-3.5" />
                <span>Export</span>
                <ChevronDown className="size-3 opacity-70 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-54 p-1.5 shadow-lg">
              <DropdownMenuItem
                onClick={handleDownloadMarkdown}
                className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileCode className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Markdown (.md)</span>
                  <span className="text-[10px] text-muted-foreground">Standard markdown file</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleDownloadHtml}
                className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Standalone HTML</span>
                  <span className="text-[10px] text-muted-foreground">Self-contained .html page</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1" />

              <DropdownMenuItem
                onClick={() => handleExport(previewRef)}
                className="cursor-pointer gap-2.5 py-2 px-2.5 rounded-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-500">
                  <Printer className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-xs">Print / PDF</span>
                  <span className="text-[10px] text-muted-foreground">Direct printer & PDF save</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-1 h-5 w-px bg-border/80" />

          {/* Sync Scroll Toggle */}
          <div className="hidden lg:flex items-center gap-2 px-1">
            <FieldLabel htmlFor="switch-sync" className="text-xs text-muted-foreground cursor-pointer font-normal select-none">
              Sync Scroll
            </FieldLabel>
            <Switch
              id="switch-sync"
              checked={syncEnabled}
              onCheckedChange={onToggleSync}
            />
          </div>

          {/* Cheatsheet Dialog Trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowCheatSheet(true)}
                className="cursor-pointer text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <HelpCircle className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Markdown Quick Reference</TooltipContent>
          </Tooltip>

          {/* Dark / Light Mode Toggle */}
          <ModeToggle />
        </div>
      </header>

      {/* Shadcn Dialog Component for Syntax CheatSheet */}
      <Dialog open={showCheatSheet} onOpenChange={setShowCheatSheet}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="size-5 text-primary" />
              Markdown Quick Reference
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2 text-xs">
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <span className="font-semibold text-foreground flex items-center justify-between">
                Headers
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">#</Badge>
              </span>
              <p className="font-mono text-muted-foreground"># Header 1<br/>## Header 2<br/>### Header 3</p>
            </div>
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <span className="font-semibold text-foreground flex items-center justify-between">
                Emphasis
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">**</Badge>
              </span>
              <p className="font-mono text-muted-foreground">**bold text**<br/>*italic text*<br/>~~strikethrough~~</p>
            </div>
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <span className="font-semibold text-foreground flex items-center justify-between">
                Lists & Tasks
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">-</Badge>
              </span>
              <p className="font-mono text-muted-foreground">- Bullet list<br/>1. Numbered list<br/>- [ ] Task checkbox</p>
            </div>
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <span className="font-semibold text-foreground flex items-center justify-between">
                Links & Images
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">[]()</Badge>
              </span>
              <p className="font-mono text-muted-foreground">[Link](url)<br/>![Alt](image_url)</p>
            </div>
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <span className="font-semibold text-foreground flex items-center justify-between">
                Code
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">```</Badge>
              </span>
              <p className="font-mono text-muted-foreground">`inline code`<br/>```lang<br/>code block<br/>```</p>
            </div>
            <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-2.5">
              <span className="font-semibold text-foreground flex items-center justify-between">
                Quotes & Rules
                <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">&gt;</Badge>
              </span>
              <p className="font-mono text-muted-foreground">&gt; Blockquote line<br/>--- (Horizontal rule)</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopBar;
