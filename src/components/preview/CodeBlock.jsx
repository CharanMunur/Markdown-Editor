import React, { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";

export function CodeBlock({ children, className = "", wrapCode = true, language, ...props }) {
  const [copied, setCopied] = useState(false);
  const codeNode = Array.isArray(children) ? children.find((child) => child?.props) : children;
  const codeClassName = [className, codeNode?.props?.className].filter(Boolean).join(" ");
  const languageMatch = codeClassName.match(/(?:language|lang)-([A-Za-z][\w+#.-]*)/i);
  const rawLanguage = language || props["data-language"] || languageMatch?.[1] || "";
  const normalizedLang = String(rawLanguage).trim().toLowerCase();

  const hasLanguage = Boolean(
    normalizedLang &&
    normalizedLang !== "code" &&
    normalizedLang !== "text" &&
    normalizedLang !== "plaintext"
  );

  const displayLanguage = !hasLanguage
    ? ""
    : normalizedLang === "js" || normalizedLang === "javascript"
      ? "JavaScript"
      : normalizedLang === "ts" || normalizedLang === "typescript"
        ? "TypeScript"
        : normalizedLang === "py" || normalizedLang === "python"
          ? "Python"
          : normalizedLang === "sh" || normalizedLang === "bash"
            ? "Bash"
            : normalizedLang === "md" || normalizedLang === "markdown"
              ? "Markdown"
              : normalizedLang === "yml" || normalizedLang === "yaml"
                ? "YAML"
                : normalizedLang === "json"
                  ? "JSON"
                  : normalizedLang === "html"
                    ? "HTML"
                    : normalizedLang === "css"
                      ? "CSS"
                      : normalizedLang.charAt(0).toUpperCase() + normalizedLang.slice(1);

  // Extract raw text from children recursively
  const extractText = (node) => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node && node.props && node.props.children) return extractText(node.props.children);
    return "";
  };

  const handleCopy = async () => {
    const text = extractText(children);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <div className="group markdown-code-card relative my-4 w-full min-w-0 overflow-hidden rounded-xl border border-border bg-muted/40 dark:bg-muted/20">
      {hasLanguage ? (
        <div className="markdown-code-header flex min-h-10 items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground select-none">
          <Code2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate font-mono text-[11px] font-semibold text-foreground tracking-wide">
            {displayLanguage}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy code"}
            title={copied ? "Copied" : "Copy code"}
            className="markdown-code-copy ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-foreground" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy text"}
          title={copied ? "Copied" : "Copy text"}
          className="markdown-code-copy absolute top-2.5 right-2.5 z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card/90 backdrop-blur-xs border border-border/70 text-muted-foreground shadow-xs transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        >
          {copied ? (
            <Check className="h-3 w-3 text-foreground" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
      <div
        className={`markdown-code-content ${
          wrapCode ? "code-wrap" : "code-nowrap"
        } min-w-0 overflow-x-auto px-4 ${
          hasLanguage ? "pb-3.5 pt-1" : "py-3.5"
        } text-[14px] leading-relaxed md:px-5`}
      >
        <pre className={className} {...props}>
          {children}
        </pre>
      </div>
    </div>
  );
}
