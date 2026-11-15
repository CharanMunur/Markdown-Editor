import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  X,
  Sun,
  Moon,
  Loader2,
  FileDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

// shadcn UI component imports
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Standard 96 DPI pixel dimensions for paper formats
const PAGE_DIMENSIONS = {
  a4: {
    portrait: { width: 794, height: 1123, label: "210 × 297 mm" },
    landscape: { width: 1123, height: 794, label: "297 × 210 mm" },
  },
  letter: {
    portrait: { width: 816, height: 1056, label: "8.5 × 11 in" },
    landscape: { width: 1056, height: 816, label: "11 × 8.5 in" },
  },
};

const getPdfPageSize = (format, orientation) => {
  const isPortrait = orientation === "portrait";
  return format === "a4"
    ? { width: isPortrait ? 210 : 297, height: isPortrait ? 297 : 210 }
    : { width: isPortrait ? 215.9 : 279.4, height: isPortrait ? 279.4 : 215.9 };
};

async function renderPdfPages({ previewElement, format, orientation, theme, margins }) {
  const dims = PAGE_DIMENSIONS[format][orientation];
  const pageSize = getPdfPageSize(format, orientation);
  const wrapper = document.createElement("div");
  wrapper.id = `pdf-export-capture-${Date.now()}`;
  wrapper.style.position = "fixed";
  wrapper.style.left = "0";
  wrapper.style.top = "0";
  wrapper.style.zIndex = "-9999";
  wrapper.style.opacity = "0";
  wrapper.style.pointerEvents = "none";
  wrapper.style.width = `${dims.width}px`;
  wrapper.style.backgroundColor = theme === "dark" ? "#0c0c0c" : "#ffffff";
  wrapper.style.color = theme === "dark" ? "#ededed" : "#0d0d0d";
  wrapper.style.fontFamily = "'Google Sans', sans-serif";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.padding = `${Math.round(margins * 3.78)}px`;
  wrapper.className = `${theme} markdown-preview pdf-preview-sheet`;
  wrapper.setAttribute("data-pdf-theme", theme);

  const clone = previewElement.cloneNode(true);
  clone.style.width = "100%";
  clone.style.maxWidth = "100%";
  clone.style.height = "auto";
  clone.style.minHeight = "0";
  clone.style.overflow = "visible";
  clone.style.margin = "0";
  clone.style.padding = "0";
  clone.style.fontFamily = "'Google Sans', sans-serif";
  clone.style.backgroundColor = "transparent";
  clone.style.color = "inherit";
  clone.querySelectorAll(".markdown-code-copy").forEach((button) => button.remove());
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    let layout = { wrapperHeight: 0, breakUnits: [] };
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: theme === "dark" ? "#0c0c0c" : "#ffffff",
      logging: false,
      windowWidth: dims.width,
      onclone: (clonedDocument) => {
        const clonedWrapper = clonedDocument.getElementById(wrapper.id);
        if (!clonedWrapper) return;
        clonedWrapper.style.opacity = "1";
        const wrapperBounds = clonedWrapper.getBoundingClientRect();
        const toRelativeBounds = (element) => {
          const bounds = element.getBoundingClientRect();
          return {
            top: bounds.top - wrapperBounds.top,
            bottom: bounds.bottom - wrapperBounds.top,
          };
        };
        const breakUnits = [];
        const markdownBody = clonedWrapper.querySelector(".markdown-body") || clonedWrapper;

        markdownBody.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
          const bounds = toRelativeBounds(heading);
          breakUnits.push({ ...bounds, moveTo: bounds.top });
        });

        markdownBody.querySelectorAll(".markdown-table-card, blockquote").forEach((element) => {
          const bounds = toRelativeBounds(element);
          breakUnits.push({ ...bounds, moveTo: bounds.top });
        });

        markdownBody.querySelectorAll(".markdown-code-card").forEach((card) => {
          const cardBounds = toRelativeBounds(card);
          let groupTop = cardBounds.top;
          let previous = card.previousElementSibling;
          while (previous && /^(H[1-6]|P)$/.test(previous.tagName)) {
            const previousBounds = toRelativeBounds(previous);
            if (groupTop - previousBounds.bottom > 96) break;
            groupTop = previousBounds.top;
            previous = previous.previousElementSibling;
          }

          const header = card.querySelector(".markdown-code-header");
          const pre = card.querySelector("pre");
          const code = pre?.querySelector("code");
          const headerBottom = header ? toRelativeBounds(header).bottom : cardBounds.top;
          const headerUnit = { top: groupTop, bottom: headerBottom, moveTo: groupTop };
          breakUnits.push(headerUnit);

          if (code) {
            const lines = Array.from(code.querySelectorAll(":scope > .line"));
            lines.forEach((line) => {
              const bounds = toRelativeBounds(line);
              breakUnits.push({ ...bounds, moveTo: bounds.top });
            });
          }

          breakUnits.push({ ...cardBounds, top: groupTop, moveTo: groupTop, kind: "code-card" });
        });

        layout = { wrapperHeight: wrapperBounds.height, breakUnits };
      },
    });

    const canvasScaleY = canvas.height / Math.max(layout.wrapperHeight, 1);
    const pageHeightPx = Math.ceil((canvas.width * pageSize.height) / pageSize.width);
    const marginPx = Math.round(margins * 3.78) * canvasScaleY;
    const backgroundColor = theme === "dark" ? "#0c0c0c" : "#ffffff";
    const maxContentHeight = pageHeightPx - marginPx * 2;
    const breakUnits = layout.breakUnits.map((unit) => ({
      top: unit.top * canvasScaleY,
      bottom: unit.bottom * canvasScaleY,
      moveTo: unit.moveTo * canvasScaleY,
      kind: unit.kind,
    }));
    const pages = [];
    let sourceY = 0;
    let pageIndex = 0;

    while (sourceY < canvas.height) {
      const topInset = pageIndex === 0 ? 0 : marginPx;
      const availableHeight = Math.max(1, Math.floor(pageHeightPx - topInset - marginPx));
      let pageEnd = Math.min(canvas.height, sourceY + availableHeight);

      if (pageEnd < canvas.height) {
        const crossingUnits = breakUnits.filter((unit) => {
          const height = unit.bottom - unit.top;
          if (unit.top >= pageEnd || unit.bottom <= pageEnd || height <= 0) return false;
          if (unit.kind === "code-card") return height <= maxContentHeight;
          return height <= availableHeight;
        });
        if (crossingUnits.length) {
          pageEnd = Math.floor(Math.min(...crossingUnits.map((unit) => unit.moveTo)));
        }
      }

      if (pageEnd <= sourceY) pageEnd = Math.min(canvas.height, sourceY + availableHeight);
      const sliceHeight = Math.max(1, Math.ceil(pageEnd - sourceY));
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;
      const context = pageCanvas.getContext("2d");
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      context.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeight,
        0,
        Math.round(topInset),
        canvas.width,
        sliceHeight
      );
      pages.push(pageCanvas.toDataURL("image/png"));
      sourceY = pageEnd;
      pageIndex += 1;
    }

    return { pages, pageSize };
  } finally {
    wrapper.remove();
  }
}

export function PdfExportDialog({
  open,
  onOpenChange,
  previewRef,
  isDarkMode: defaultDark = false,
}) {
  const [fileName, setFileName] = useState("document");
  const [format, setFormat] = useState("a4"); // 'a4' | 'letter'
  const [orientation, setOrientation] = useState("portrait"); // 'portrait' | 'landscape'
  const [theme, setTheme] = useState(defaultDark ? "dark" : "light");
  const [margins, setMargins] = useState("15"); // string for ToggleGroup: "10", "15", "20"
  const [zoom, setZoom] = useState(0.95); // Default to 95% per user request
  const [isExporting, setIsExporting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewPages, setPreviewPages] = useState([]);
  const [isPreviewRendering, setIsPreviewRendering] = useState(false);
  const previewContainerRef = useRef(null);

  const currentDims = PAGE_DIMENSIONS[format][orientation];
  const marginNum = Number(margins) || 15;

  // Sync theme initially when dialog opens
  useEffect(() => {
    if (open) {
      setTheme(defaultDark ? "dark" : "light");
      setZoom(0.95);
      if (previewRef?.current) {
        setPreviewHtml(previewRef.current.innerHTML);
      }
      document.body.style.pointerEvents = "";
    }
  }, [open, defaultDark, previewRef]);

  useEffect(() => {
    if (!open || !previewRef?.current) {
      setPreviewPages([]);
      return undefined;
    }

    let isActive = true;
    setIsPreviewRendering(true);
    setPreviewPages([]);
    renderPdfPages({
      previewElement: previewRef.current,
      format,
      orientation,
      theme,
      margins: marginNum,
    })
      .then(({ pages }) => {
        if (isActive) setPreviewPages(pages);
      })
      .catch((error) => {
        console.error("PDF preview rendering failed:", error);
      })
      .finally(() => {
        if (isActive) setIsPreviewRendering(false);
      });

    return () => {
      isActive = false;
    };
  }, [open, previewRef, format, orientation, theme, marginNum, previewHtml]);

  const handleClose = () => {
    document.body.style.pointerEvents = "";
    onOpenChange(false);
  };

  const handleFit = () => {
    if (!previewContainerRef.current) return;
    const containerWidth = previewContainerRef.current.clientWidth - 48;
    const fitScale = Math.min(1.2, Math.max(0.4, containerWidth / currentDims.width));
    setZoom(Number(fitScale.toFixed(2)));
  };

  const handleExport = async (e) => {
    e?.preventDefault();
    if (isExporting || isPreviewRendering || previewPages.length === 0) return;

    try {
      setIsExporting(true);
      const cleanBaseName = fileName.trim().replace(/\.pdf$/i, "") || "document";
      const cleanFileName = `${cleanBaseName}.pdf`;
      const pageSize = getPdfPageSize(format, orientation);
      const doc = new jsPDF({
        orientation,
        unit: "mm",
        format,
      });
      previewPages.forEach((page, index) => {
        if (index > 0) doc.addPage();
        doc.addImage(page, "PNG", 0, 0, pageSize.width, pageSize.height, undefined, "FAST");
      });

      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);

      handleClose();
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsExporting(false);
      document.body.style.pointerEvents = "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent
        className="w-[96vw] max-w-6xl sm:max-w-6xl md:max-w-6xl h-[90vh] max-h-[880px] p-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl flex flex-col pointer-events-auto"
        showCloseButton={false}
      >
        {/* Header Bar using shadcn DialogHeader */}
        <DialogHeader className="flex flex-row items-center justify-between px-5 py-3.5 border-b border-border bg-background select-none shrink-0 gap-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground border border-border">
              <FileDown className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
                Export as PDF
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground">
                Review the paginated document before downloading.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            className="rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </Button>
        </DialogHeader>

        {/* Studio Workspace: Split Preview & Controls */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left: Live Document Sheet Preview Workspace */}
          <div
            ref={previewContainerRef}
            className={cn(
              "flex-1 min-w-0 min-h-[250px] flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-border transition-colors duration-200",
              theme === "dark" ? "bg-[#141414]" : "bg-muted/40"
            )}
          >
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border/70 bg-background/80 text-xs text-muted-foreground select-none shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground tracking-tight text-xs">
                  {format.toUpperCase()} · {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  ({currentDims.label})
                </span>
                <Badge variant="outline" className="rounded-md font-mono text-[10px] font-normal py-0 px-1.5 h-5">
                  {marginNum}mm margin
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-mono text-[10px] py-0 px-1.5 h-5 capitalize",
                    "rounded-md",
                    theme === "dark" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-800"
                  )}
                >
                  {theme} theme
                </Badge>
                <Badge variant="outline" className="h-5 rounded-md px-1.5 font-mono text-[10px] font-normal">
                  {isPreviewRendering ? "Preparing pages…" : `${previewPages.length} ${previewPages.length === 1 ? "page" : "pages"}`}
                </Badge>
              </div>

              {/* Zoom controls with shadcn buttons */}
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/80">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setZoom((z) => Math.max(0.3, Number((z - 0.05).toFixed(2))))}
                      className="cursor-pointer"
                    >
                      <ZoomOut className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom Out (-5%)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setZoom(0.95)}
                      className="px-2 font-mono text-[11px] font-medium text-foreground cursor-pointer"
                    >
                      {Math.round(zoom * 100)}%
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset to 95%</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setZoom((z) => Math.min(1.5, Number((z + 0.05).toFixed(2))))}
                      className="cursor-pointer"
                    >
                      <ZoomIn className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom In (+5%)</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={handleFit}
                      className="cursor-pointer"
                    >
                      <Maximize2 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fit to Window</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Scrollable Stage Area */}
            <div className="flex-1 overflow-auto p-6 sm:p-8">
              <div className="flex min-h-full flex-col items-center gap-6 pb-4">
                {isPreviewRendering ? (
                  <div className="flex min-h-48 items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Preparing page preview…
                  </div>
                ) : (
                  previewPages.map((page, index) => (
                    <div
                      key={`${format}-${orientation}-${theme}-${margins}-${index}`}
                      className="relative shrink-0 transition-[width,height] duration-150"
                      style={{
                        width: `${currentDims.width * zoom}px`,
                        height: `${currentDims.height * zoom}px`,
                      }}
                    >
                      <img
                        src={page}
                        alt={`PDF page ${index + 1}`}
                        className="absolute left-0 top-0 border border-border/80 shadow-xl"
                        style={{
                          width: `${currentDims.width}px`,
                          height: `${currentDims.height}px`,
                          transform: `scale(${zoom})`,
                          transformOrigin: "top left",
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls & Settings Sidebar */}
          <div className="w-full max-h-[44vh] md:max-h-none md:w-[340px] bg-card flex flex-col overflow-hidden shrink-0">
            <form onSubmit={handleExport} className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="pdf-filename" className="text-sm font-medium text-foreground">
                  File name
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="pdf-filename"
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="document"
                    className="pr-12 text-sm font-medium h-9 rounded-lg border-border bg-background focus-visible:ring-2 focus-visible:ring-ring/20"
                  />
                  <Badge
                    variant="outline"
                    className="absolute right-2 rounded-md font-mono text-[10px] font-semibold text-muted-foreground bg-muted/60 select-none py-0 px-1.5 h-5 pointer-events-none"
                  >
                    .pdf
                  </Badge>
                </div>
              </div>

              <Separator className="!my-1" />

              <section className="space-y-3" aria-labelledby="pdf-page-setup">
                <div>
                  <h3 id="pdf-page-setup" className="text-sm font-medium text-foreground">Page setup</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Choose the paper size and layout.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Paper size</Label>
                  <ToggleGroup type="single" value={format} onValueChange={(val) => val && setFormat(val)} className="grid w-full grid-cols-2 gap-1 rounded-md bg-muted/70 p-1">
                    <ToggleGroupItem value="a4" className="h-8 rounded-md text-xs cursor-pointer transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">A4</ToggleGroupItem>
                    <ToggleGroupItem value="letter" className="h-8 rounded-md text-xs cursor-pointer transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">US Letter</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Orientation</Label>
                  <ToggleGroup type="single" value={orientation} onValueChange={(val) => val && setOrientation(val)} className="grid w-full grid-cols-2 gap-1 rounded-md bg-muted/70 p-1">
                    <ToggleGroupItem value="portrait" className="h-8 rounded-md text-xs cursor-pointer transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">Portrait</ToggleGroupItem>
                    <ToggleGroupItem value="landscape" className="h-8 rounded-md text-xs cursor-pointer transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">Landscape</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Margins</Label>
                  <ToggleGroup type="single" value={margins} onValueChange={(val) => val && setMargins(val)} className="grid w-full grid-cols-3 gap-1 rounded-md bg-muted/70 p-1">
                    {["10", "15", "20"].map((value) => (
                      <ToggleGroupItem key={value} value={value} className="h-8 rounded-md text-xs cursor-pointer transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                        {value}mm
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </section>

              <Separator className="!my-1" />

              <section className="space-y-3" aria-labelledby="pdf-appearance">
                <div>
                  <h3 id="pdf-appearance" className="text-sm font-medium text-foreground">Appearance</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Choose a theme for the exported document.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Document theme</Label>
                  <ToggleGroup type="single" value={theme} onValueChange={(val) => val && setTheme(val)} className="grid w-full grid-cols-2 gap-1 rounded-md bg-muted/70 p-1">
                    <ToggleGroupItem value="light" className="text-xs h-8 flex items-center justify-center gap-1.5 rounded-md cursor-pointer transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                      <Sun className="size-3.5" /><span>Light</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dark" className="text-xs h-8 flex items-center justify-center gap-1.5 rounded-md cursor-pointer transition-colors data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
                      <Moon className="size-3.5" /><span>Dark</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </section>
            </form>

            {/* Footer Buttons with shadcn Button */}
            <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                className="h-8.5 px-3.5 text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || isPreviewRendering || previewPages.length === 0}
                className="h-8.5 px-4 text-xs rounded-lg cursor-pointer inline-flex items-center gap-1.5 font-medium"
              >
                {isExporting || isPreviewRendering ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{isExporting ? "Generating…" : "Preparing…"}</span>
                  </>
                ) : (
                  <>
                    <Download className="size-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
