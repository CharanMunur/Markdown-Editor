import React, { useCallback, useEffect, useRef, useState } from "react";
import TopBar from "./components/header/TopBar";
import EditorPane from "./components/editor/EditorPane";
import PreviewPane from "./components/preview/PreviewPane";
import { TooltipProvider } from "./components/ui/tooltip";
import defaultMarkdown from "./assets/markdown.md?raw";

const STORAGE_KEY = "markdown-editor:content";

const App = () => {
  const MIN_EDITOR_WIDTH = 20;
  const MAX_EDITOR_WIDTH = 80;

  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return defaultMarkdown;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ?? defaultMarkdown;
    } catch {
      return defaultMarkdown;
    }
  });

  const [syncEnabled, setSyncEnabled] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState("both"); // 'both' | 'editor' | 'preview'

  const splitContainerRef = useRef(null);
  const previewRef = useRef(null);
  const previewViewportRef = useRef(null);
  const monacoEditorRef = useRef(null);

  const clampEditorWidth = useCallback((nextWidth) => {
    return Math.max(MIN_EDITOR_WIDTH, Math.min(MAX_EDITOR_WIDTH, nextWidth));
  }, []);

  const updateWidthFromPointer = useCallback(
    (clientX) => {
      const container = splitContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;

      const nextPercent = ((clientX - rect.left) / rect.width) * 100;
      setEditorWidth(clampEditorWidth(nextPercent));
    },
    [clampEditorWidth]
  );

  const handleResizeStart = useCallback(
    (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      setIsResizing(true);
      updateWidthFromPointer(event.clientX);
    },
    [updateWidthFromPointer]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event) => {
      updateWidthFromPointer(event.clientX);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isResizing, updateWidthFromPointer]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value ?? "");
    } catch {
      // Ignore storage failures
    }
  }, [value]);

  const handleEditorSync = (ratio) => {
    if (!syncEnabled) return;
    const el = previewViewportRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const target = (ratio || 0) * max;
    requestAnimationFrame(() => {
      el.scrollTop = target;
    });
  };

  const handleEditorReady = (editor) => {
    monacoEditorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <TopBar
          value={value}
          onReset={() => setValue(defaultMarkdown)}
          previewRef={previewRef}
          syncEnabled={syncEnabled}
          onToggleSync={setSyncEnabled}
          onImportFile={setValue}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div
          ref={splitContainerRef}
          className={`flex flex-1 min-h-0 relative ${isResizing ? "select-none" : ""}`}
        >
          {/* Editor Pane */}
          {(viewMode === "both" || viewMode === "editor") && (
            <div
              className="h-full min-w-0 shrink-0"
              style={{
                width: viewMode === "both" ? `${editorWidth}%` : "100%",
              }}
            >
              <EditorPane
                value={value}
                onChange={setValue}
                syncEnabled={syncEnabled}
                onSyncScroll={handleEditorSync}
                onEditorReady={handleEditorReady}
              />
            </div>
          )}

          {/* Resizable Split Divider */}
          {viewMode === "both" && (
            <div
              role="separator"
              aria-label="Resize panes"
              aria-orientation="vertical"
              onPointerDown={handleResizeStart}
              className="group relative w-2 shrink-0 cursor-col-resize touch-none bg-background select-none"
            >
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border group-hover:bg-primary/40 group-active:bg-primary transition-colors" />
              <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-primary/20 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100" />
            </div>
          )}

          {/* Preview Pane */}
          {(viewMode === "both" || viewMode === "preview") && (
            <div className="h-full min-w-0 flex-1">
              <PreviewPane
                value={value}
                previewRef={previewRef}
                viewportRef={previewViewportRef}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default App;
