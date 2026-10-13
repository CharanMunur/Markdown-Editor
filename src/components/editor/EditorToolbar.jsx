import React from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  ListTodo,
  Link,
  Image,
  Table,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function EditorToolbar({ editorRef }) {
  const insertSnippet = (prefix, suffix = "", defaultText = "") => {
    const editor = editorRef?.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!model || !selection) return;

    const selectedText = model.getValueInRange(selection);
    const content = selectedText || defaultText;
    const newText = `${prefix}${content}${suffix}`;

    editor.executeEdits("toolbar", [
      {
        range: selection,
        text: newText,
        forceMoveMarkers: true,
      },
    ]);

    if (!selectedText) {
      const startLine = selection.startLineNumber;
      const startCol = selection.startColumn + prefix.length;
      editor.setSelection({
        startLineNumber: startLine,
        startColumn: startCol,
        endLineNumber: startLine,
        endColumn: startCol + defaultText.length,
      });
    }

    editor.focus();
  };

  const insertLinePrefix = (prefix) => {
    const editor = editorRef?.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const model = editor.getModel();
    if (!model || !selection) return;

    const line = selection.startLineNumber;
    const lineContent = model.getLineContent(line);

    editor.executeEdits("toolbar", [
      {
        range: {
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: lineContent.length + 1,
        },
        text: `${prefix} ${lineContent.replace(/^#{1,6}\s+|^>\s+|^[-*]\s+|^\d+\.\s+/, "")}`,
        forceMoveMarkers: true,
      },
    ]);
    editor.focus();
  };

  const insertTable = () => {
    const tableTemplate = `\n| Header 1 | Header 2 | Header 3 |\n| :--- | :---: | ---: |\n| Cell 1 | Cell 2 | Cell 3 |\n| Text | Centered | Right |\n\n`;
    insertSnippet("", "", tableTemplate);
  };

  const tools = [
    {
      label: "Bold",
      icon: <Bold className="size-3.5" />,
      action: () => insertSnippet("**", "**", "bold text"),
      title: "Bold (Ctrl+B)",
    },
    {
      label: "Italic",
      icon: <Italic className="size-3.5" />,
      action: () => insertSnippet("*", "*", "italic text"),
      title: "Italic (Ctrl+I)",
    },
    {
      label: "Strikethrough",
      icon: <Strikethrough className="size-3.5" />,
      action: () => insertSnippet("~~", "~~", "strikethrough"),
      title: "Strikethrough",
    },
    { type: "divider" },
    {
      label: "H1",
      icon: <Heading1 className="size-3.5" />,
      action: () => insertLinePrefix("#"),
      title: "Heading 1",
    },
    {
      label: "H2",
      icon: <Heading2 className="size-3.5" />,
      action: () => insertLinePrefix("##"),
      title: "Heading 2",
    },
    {
      label: "H3",
      icon: <Heading3 className="size-3.5" />,
      action: () => insertLinePrefix("###"),
      title: "Heading 3",
    },
    { type: "divider" },
    {
      label: "Bullet List",
      icon: <List className="size-3.5" />,
      action: () => insertSnippet("- ", "", "item"),
      title: "Bullet List",
    },
    {
      label: "Numbered List",
      icon: <ListOrdered className="size-3.5" />,
      action: () => insertSnippet("1. ", "", "item"),
      title: "Numbered List",
    },
    {
      label: "Task List",
      icon: <ListTodo className="size-3.5" />,
      action: () => insertSnippet("- [ ] ", "", "task"),
      title: "Task Checkbox",
    },
    { type: "divider" },
    {
      label: "Inline Code",
      icon: <Code className="size-3.5" />,
      action: () => insertSnippet("`", "`", "code"),
      title: "Inline Code",
    },
    {
      label: "Quote",
      icon: <Quote className="size-3.5" />,
      action: () => insertLinePrefix(">"),
      title: "Blockquote",
    },
    {
      label: "Link",
      icon: <Link className="size-3.5" />,
      action: () => insertSnippet("[", "](https://example.com)", "link title"),
      title: "Hyperlink",
    },
    {
      label: "Image",
      icon: <Image className="size-3.5" />,
      action: () => insertSnippet("![", "](https://image.url)", "image alt text"),
      title: "Insert Image",
    },
    {
      label: "Table",
      icon: <Table className="size-3.5" />,
      action: insertTable,
      title: "Insert Table",
    },
    {
      label: "Horizontal Rule",
      icon: <Minus className="size-3.5" />,
      action: () => insertSnippet("\n---\n", "", ""),
      title: "Divider Line",
    },
  ];

  return (
    <div className="flex h-9 w-full items-center gap-0.5 overflow-x-auto border-b border-border bg-card/60 px-2 py-1 text-card-foreground select-none">
      {tools.map((tool, idx) => {
        if (tool.type === "divider") {
          return <div key={idx} className="mx-1 h-4 w-px bg-border/70" />;
        }
        return (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={tool.action}
                className="h-7 w-7 rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px] py-1 px-2">
              {tool.title}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
