import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CodeBlock({ children, className = "", ...props }) {
  const [copied, setCopied] = useState(false);

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
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-muted/40 dark:bg-muted/20">
      <div className="absolute right-2.5 top-2.5 z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-background/95 px-2.5 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur-xs transition hover:bg-accent hover:text-accent-foreground cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-[11px] font-medium text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <pre className={className} {...props}>
          {children}
        </pre>
      </div>
    </div>
  );
}
