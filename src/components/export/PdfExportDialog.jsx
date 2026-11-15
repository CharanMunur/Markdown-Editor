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
    if (isExporting || !previewRef?.current) return;

    let wrapper;
    try {
      setIsExporting(true);
      const cleanBaseName = fileName.trim().replace(/\.pdf$/i, "") || "document";
      const cleanFileName = `${cleanBaseName}.pdf`;

      // 1. Offscreen container for high-fidelity export
      // Keep the live DOM hidden; html2canvas makes it visible in its own clone.
      wrapper = document.createElement("div");
      wrapper.id = "pdf-export-capture";
      wrapper.style.position = "fixed";
      wrapper.style.left = "0";
      wrapper.style.top = "0";
      wrapper.style.zIndex = "-9999";
      wrapper.style.opacity = "0";
      wrapper.style.pointerEvents = "none";
      const baseWidthPx = currentDims.width;
      wrapper.style.width = `${baseWidthPx}px`;
      wrapper.style.backgroundColor = theme === "dark" ? "#0c0c0c" : "#ffffff";
      wrapper.style.color = theme === "dark" ? "#ededed" : "#0d0d0d";
      wrapper.style.fontFamily = "'Google Sans', sans-serif";
      wrapper.style.boxSizing = "border-box";
      wrapper.style.padding = `${Math.round(marginNum * 3.78)}px`;

      wrapper.className = `${theme} markdown-preview pdf-preview-sheet`;
      wrapper.setAttribute("data-pdf-theme", theme);

      // 2. Clone preview node
      const clone = previewRef.current.cloneNode(true);
      clone.style.width = "100%";
      clone.style.maxWidth = "100%";
      clone.style.margin = "0";
      clone.style.padding = "0";
      clone.style.fontFamily = "'Google Sans', sans-serif";
      clone.style.backgroundColor = "transparent";
      clone.style.color = "inherit";

      // Remove copy buttons
      clone.querySelectorAll(".markdown-code-copy").forEach((el) => el.remove());

      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      // 3. Render high-res canvas (without oklab issues)
      const canvas = await html2canvas(wrapper, {
        scale: 2, // 2x retina crispness
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === "dark" ? "#0c0c0c" : "#ffffff",
        logging: false,
        windowWidth: baseWidthPx,
        onclone: (clonedDocument) => {
          const clonedWrapper = clonedDocument.getElementById(wrapper.id);
          if (clonedWrapper) clonedWrapper.style.opacity = "1";
        },
      });

      // 4. Paginate the captured sheet without cutting code blocks across pages.
      const isPortrait = orientation === "portrait";
      const pageWidthMm = format === "a4" ? (isPortrait ? 210 : 297) : (isPortrait ? 215.9 : 279.4);
      const pageHeightMm = format === "a4" ? (isPortrait ? 297 : 210) : (isPortrait ? 279.4 : 215.9);

      const doc = new jsPDF({
        orientation,
        unit: "mm",
        format,
      });

      const wrapperBounds = wrapper.getBoundingClientRect();
      const canvasScaleY = canvas.height / wrapperBounds.height;
      const pageHeightPx = (canvas.width * pageHeightMm) / pageWidthMm;
      const pageMarginPx = Math.round(marginNum * 3.78) * canvasScaleY;
      const millimetersPerPixel = pageWidthMm / canvas.width;
      const backgroundColor = theme === "dark" ? [12, 12, 12] : [255, 255, 255];
      const blocksToKeepTogether = Array.from(
        wrapper.querySelectorAll(
          ".markdown-code-card, .markdown-table-card, blockquote, h1, h2, h3, h4, h5, h6"
        )
      ).map((element) => {
        const bounds = element.getBoundingClientRect();
        let top = bounds.top;
        const previousElement = element.previousElementSibling;
        if (
          element.classList.contains("markdown-code-card") &&
          previousElement &&
          /^H[1-6]$/.test(previousElement.tagName)
        ) {
          const previousBounds = previousElement.getBoundingClientRect();
          if (bounds.top - previousBounds.bottom <= 96) top = previousBounds.top;
        }
        return {
          top: (top - wrapperBounds.top) * canvasScaleY,
          bottom: (bounds.bottom - wrapperBounds.top) * canvasScaleY,
        };
      });

      let sourceY = 0;
      let pageIndex = 0;
      while (sourceY < canvas.height) {
        const topInsetPx = pageIndex === 0 ? 0 : pageMarginPx;
        const availableHeightPx = pageHeightPx - topInsetPx - pageMarginPx;
        let pageEnd = Math.min(canvas.height, sourceY + availableHeightPx);

        if (pageEnd < canvas.height) {
          const breakBefore = blocksToKeepTogether
            .filter((block) =>
              block.top < pageEnd &&
              block.bottom > pageEnd &&
              block.bottom - block.top <= availableHeightPx &&
              block.top - sourceY >= availableHeightPx * 0.2
            )
            .reduce((earliest, block) => Math.min(earliest, block.top), pageEnd);

          if (breakBefore < pageEnd) pageEnd = Math.floor(breakBefore);
        }

        // If a block is taller than a printable page, split it rather than loop forever.
        if (pageEnd <= sourceY) pageEnd = Math.min(canvas.height, sourceY + availableHeightPx);
        const sliceHeight = Math.max(1, Math.ceil(pageEnd - sourceY));
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        pageCanvas.getContext("2d").drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        doc.setFillColor(...backgroundColor);
        doc.rect(0, 0, pageWidthMm, pageHeightMm, "F");
        doc.addImage(
          pageCanvas.toDataURL("image/png"),
          "PNG",
          0,
          topInsetPx * millimetersPerPixel,
          pageWidthMm,
          sliceHeight * millimetersPerPixel,
          undefined,
          "FAST"
        );

        sourceY = pageEnd;
        pageIndex += 1;
        if (sourceY < canvas.height) doc.addPage();
      }

      // 5. Universal direct file download via Blob URL
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
      wrapper?.remove();
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
                Review the page, then download your document.
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
                <Badge variant="outline" className="font-mono text-[10px] font-normal py-0 px-1.5 h-5">
                  {marginNum}mm margin
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn(
                    "font-mono text-[10px] py-0 px-1.5 h-5 capitalize",
                    theme === "dark" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-800"
                  )}
                >
                  {theme} theme
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
            <div className="flex-1 overflow-auto p-6 sm:p-8 flex justify-center items-start">
              {/* Scaled paper wrapper */}
              <div
                style={{
                  width: `${currentDims.width * zoom}px`,
                  minHeight: `${currentDims.height * zoom}px`,
                }}
                className="relative transition-all duration-150 shrink-0 mb-8"
              >
                {/* Physical paper sheet with explicit data-pdf-theme and inline colors */}
                <div
                  data-pdf-theme={theme}
                  style={{
                    width: `${currentDims.width}px`,
                    minHeight: `${currentDims.height}px`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    padding: `${Math.round(marginNum * 3.78)}px`,
                    boxSizing: "border-box",
                    fontFamily: "'Google Sans', sans-serif",
                    backgroundColor: theme === "dark" ? "#0c0c0c" : "#ffffff",
                    color: theme === "dark" ? "#ededed" : "#0d0d0d",
                  }}
                  className={cn(
                    "markdown-preview pdf-preview-sheet shadow-2xl rounded-sm border border-border/80 absolute top-0 left-0 transition-colors duration-150",
                    theme === "dark"
                      ? "dark bg-[#0c0c0c] text-[#ededed]"
                      : "light bg-white text-[#0d0d0d]"
                  )}
                >
                  <article
                    className="markdown-body text-sm leading-relaxed"
                    style={{
                      fontFamily: "'Google Sans', sans-serif",
                      backgroundColor: "transparent",
                      color: "inherit",
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
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
                    className="pr-12 text-sm font-medium h-9 rounded-md border-border bg-background focus-visible:ring-2 focus-visible:ring-ring/20"
                  />
                  <Badge
                    variant="outline"
                    className="absolute right-2 font-mono text-[10px] font-semibold text-muted-foreground bg-muted/60 select-none py-0 px-1.5 h-5 pointer-events-none"
                  >
                    .pdf
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">PDF file</p>
                  <p className="truncate text-xs font-medium text-foreground">
                    {(fileName.trim().replace(/\.pdf$/i, "") || "document")}.pdf
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">Browser download</span>
              </div>

              <Separator className="!my-1" />

              <section className="space-y-3" aria-labelledby="pdf-page-setup">
                <div>
                  <h3 id="pdf-page-setup" className="text-sm font-medium text-foreground">Page setup</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Choose the paper size and layout.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Paper size</Label>
                  <ToggleGroup type="single" value={format} onValueChange={(val) => val && setFormat(val)} className="grid w-full grid-cols-2 gap-1 rounded-md border border-border bg-muted/50 p-1">
                    <ToggleGroupItem value="a4" className="h-8 rounded-sm text-xs cursor-pointer data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">A4</ToggleGroupItem>
                    <ToggleGroupItem value="letter" className="h-8 rounded-sm text-xs cursor-pointer data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">US Letter</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Orientation</Label>
                  <ToggleGroup type="single" value={orientation} onValueChange={(val) => val && setOrientation(val)} className="grid w-full grid-cols-2 gap-1 rounded-md border border-border bg-muted/50 p-1">
                    <ToggleGroupItem value="portrait" className="h-8 rounded-sm text-xs cursor-pointer data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">Portrait</ToggleGroupItem>
                    <ToggleGroupItem value="landscape" className="h-8 rounded-sm text-xs cursor-pointer data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">Landscape</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Margins</Label>
                  <ToggleGroup type="single" value={margins} onValueChange={(val) => val && setMargins(val)} className="grid w-full grid-cols-3 gap-1 rounded-md border border-border bg-muted/50 p-1">
                    {["10", "15", "20"].map((value) => (
                      <ToggleGroupItem key={value} value={value} className="h-8 rounded-sm text-xs cursor-pointer data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">
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
                  <ToggleGroup type="single" value={theme} onValueChange={(val) => val && setTheme(val)} className="grid w-full grid-cols-2 gap-1 rounded-md border border-border bg-muted/50 p-1">
                    <ToggleGroupItem value="light" className="text-xs h-8 flex items-center justify-center gap-1.5 rounded-sm cursor-pointer data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">
                      <Sun className="size-3.5" /><span>Light</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="dark" className="text-xs h-8 flex items-center justify-center gap-1.5 rounded-sm cursor-pointer data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-xs">
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
                disabled={isExporting}
                className="h-8.5 px-4 text-xs rounded-lg cursor-pointer inline-flex items-center gap-1.5 font-medium"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Generating…</span>
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
