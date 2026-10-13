import React from "react";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "../ui/scroll-area";
import { CodeBlock } from "./CodeBlock";

const PreviewPane = ({
  value,
  previewRef,
  viewportRef,
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
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={{
            pre: ({ node, children, ...props }) => (
              <CodeBlock {...props}>{children}</CodeBlock>
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
        </Markdown>
      </article>
    </ScrollArea>
  );
};

export default PreviewPane;
