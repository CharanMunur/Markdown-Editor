import React, { useCallback, useRef, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import { useTheme } from "@/providers/theme/theme-provider";
import { EditorToolbar } from "./EditorToolbar";

const EditorPane = ({
  value,
  onChange,
  syncEnabled,
  onSyncScroll,
  onEditorReady,
}) => {
  const { theme } = useTheme();
  const editorRef = useRef(null);
  const syncEnabledRef = useRef(syncEnabled);
  const syncCallbackRef = useRef(onSyncScroll);

  useEffect(() => {
    syncEnabledRef.current = syncEnabled;
  }, [syncEnabled]);

  useEffect(() => {
    syncCallbackRef.current = onSyncScroll;
  }, [onSyncScroll]);

  const handleChange = (val) => onChange(val ?? "");

  const handleBeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#0c0d0e",
        "editor.lineHighlightBackground": "#16181a",
        "editorCursor.foreground": "#38bdf8",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#9ca3af",
      },
    });

    monaco.editor.defineTheme("custom-light", {
      base: "vs",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#ffffff",
        "editor.lineHighlightBackground": "#f8fafc",
        "editorCursor.foreground": "#0284c7",
        "editorLineNumber.foreground": "#94a3b8",
        "editorLineNumber.activeForeground": "#334155",
      },
    });
  }, []);

  const handleEditorDidMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      onEditorReady?.(editor);

      editor.onDidScrollChange(() => {
        if (!syncEnabledRef.current) return;
        const h = editor.getScrollHeight();
        const viewport = editor.getLayoutInfo().height;
        const max = Math.max(h - viewport, 0);
        const ratio = max > 0 ? editor.getScrollTop() / max : 0;
        syncCallbackRef.current?.(ratio, "editor");
      });
    },
    [onEditorReady]
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background">
      <EditorToolbar editorRef={editorRef} />
      <div className="min-h-0 flex-1 w-full">
        <Editor
          height="100%"
          width="100%"
          defaultLanguage="markdown"
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          theme={theme === "dark" ? "custom-dark" : "custom-light"}
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            fontLigatures: true,
            lineHeight: 22,
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            renderLineHighlight: "all",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
};

export default EditorPane;
