import React, { useMemo } from "react";
import { MarkdownHooks } from "react-markdown";
import rehypeShiki from "@shikijs/rehype";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "../ui/scroll-area";
import { CodeBlock } from "./CodeBlock";
import { Spinner } from "../ui/spinner";

const PreviewLoading = () => (
  <div className="flex min-h-[320px] w-full items-center justify-center gap-2.5 text-muted-foreground select-none">
    <Spinner className="size-4 text-muted-foreground" />
    <span className="text-xs font-medium tracking-tight">Rendering preview…</span>
  </div>
);

// Curated list of popular programming languages for instant loading and snappy reloads
const POPULAR_LANGUAGES = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "html",
  "css",
  "json",
  "python",
  "bash",
  "sh",
  "markdown",
  "yaml",
  "sql",
  "java",
  "cpp",
  "c",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "xml",
  "dockerfile",
  "diff",
];

const REMARK_PLUGINS = [remarkGfm];

const REHYPE_PLUGINS = [
  rehypeRaw,
  [
    rehypeShiki,
    {
      themes: {
        light: "github-light-high-contrast",
        dark: "github-dark-high-contrast",
      },
      defaultColor: false,
      langs: POPULAR_LANGUAGES,
      transformers: [
        {
          name: "data-language-attribute",
          pre(node) {
            if (this.options.lang && this.options.lang !== "text") {
              node.properties = node.properties || {};
              node.properties["data-language"] = this.options.lang;
            }
          },
        },
      ],
    },
  ],
];

const PreviewPane = ({
  value,
  previewRef,
  viewportRef,
  wrapCode,
}) => {
  return (
    <ScrollArea
      className="markdown-preview h-full w-full bg-card text-foreground overflow-hidden"
      viewportRef={viewportRef}
    >
      <article
        className="markdown-body w-full max-w-full p-4 sm:p-6 pb-16"
        ref={previewRef}
      >
        <MarkdownHooks
          remarkPlugins={REMARK_PLUGINS}
          rehypePlugins={REHYPE_PLUGINS}
          fallback={<PreviewLoading />}
          components={{
            pre: ({ node, children, ...props }) => (
              <CodeBlock
                {...props}
                language={props["data-language"]}
                wrapCode={wrapCode}
              >
                {children}
              </CodeBlock>
            ),
            a: ({ node, href, children, ...props }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                {...props}
              >
                {children}
              </a>
            ),
            table: ({ node, children, ...props }) => (
              <div className="markdown-table-card my-4 w-full overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm m-0! border-collapse" {...props}>
                    {children}
                  </table>
                </div>
              </div>
            ),
          }}
        >
          {value}
        </MarkdownHooks>
      </article>
    </ScrollArea>
  );
};

export default PreviewPane;
