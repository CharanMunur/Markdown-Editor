import React from "react";
import { MarkdownHooks } from "react-markdown";
import rehypeShiki from "@shikijs/rehype";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "../ui/scroll-area";
import { CodeBlock } from "./CodeBlock";

const getFenceLanguages = (markdown) =>
  Array.from(markdown.matchAll(/^ {0,3}(`{3,}|~{3,})\s*([A-Za-z][\w+#.-]*)?/gm), (match) => match[2] || "Code");

const preserveCodeLanguages = (languages) => () => (tree) => {
  let languageIndex = 0;
  const visit = (node) => {
    const rawClasses = node.properties?.className ?? node.properties?.class;
    const classes = Array.isArray(rawClasses) ? rawClasses : String(rawClasses || "").split(/\s+/);
    if (node.type === "element" && node.tagName === "pre" && classes.includes("shiki")) {
      node.properties["data-language"] = languages[languageIndex++] || "Code";
    }
    for (const child of node.children || []) visit(child);
  };
  visit(tree);
};

const PreviewPane = ({
  value,
  previewRef,
  viewportRef,
  wrapCode,
}) => {
  const codeLanguages = getFenceLanguages(value || "");

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
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeShiki, {
              themes: {
                light: "github-light-high-contrast",
                dark: "github-dark-high-contrast",
              },
              defaultColor: false,
            }],
            preserveCodeLanguages(codeLanguages),
          ]}
          fallback={<p className="text-sm text-muted-foreground">Rendering preview…</p>}
          components={{
            pre: ({ node, children, ...props }) => (
              <CodeBlock {...props} language={props["data-language"]} wrapCode={wrapCode}>{children}</CodeBlock>
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
              <div className="my-4 w-full overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left text-sm" {...props}>
                  {children}
                </table>
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
