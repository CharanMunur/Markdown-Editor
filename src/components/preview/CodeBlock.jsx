import React, { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";

export function CodeBlock({ children, className = "", wrapCode = true, language, ...props }) {
  const [copied, setCopied] = useState(false);
  const codeNode = Array.isArray(children) ? children.find((child) => child?.props) : children;
  const codeClassName = [className, codeNode?.props?.className].filter(Boolean).join(" ");
  const languageMatch = codeClassName.match(/(?:language|lang)-([A-Za-z][\w+#.-]*)/i);
  const languageName = language || props["data-language"] || languageMatch?.[1] || "Code";
  const displayLanguage = languageName === "js" ? "JavaScript"
    : languageName === "ts" ? "TypeScript"
      : languageName === "py" ? "Python"
        : languageName.charAt(0).toUpperCase() + languageName.slice(1);

  // Extract raw text from children recursively if needed
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
      // fallback
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
    <div className="group markdown-code-card my-4 w-full min-w-0 overflow-hidden rounded-3xl border border-border bg-muted/40 dark:bg-muted/20">
      <div className="markdown-code-header flex min-h-12 items-center gap-2 px-4 py-1.5 text-sm font-medium md:px-5">
        <Code2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{displayLanguage}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied" : "Copy code"}
          className="markdown-code-copy ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-foreground" />
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
      <div className={`markdown-code-content ${wrapCode ? "code-wrap" : "code-nowrap"} min-w-0 overflow-x-auto px-4 pb-3 pt-0 text-[14px] leading-relaxed md:px-5`}>
        <pre className={className} {...props}>
          {children}
        </pre>
      </div>
    </div>
  );
}
