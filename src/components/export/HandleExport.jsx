import printJS from "print-js";
import "print-js/dist/print.css";

export default function handleExport(previewRef, fileName = "document") {
  if (!previewRef.current) return;

  const cleanName = fileName.trim().replace(/\.pdf$/i, "") || "document";
  const prevTitle = document.title;
  document.title = cleanName;

  // Detect if we're in dark mode
  const isDarkMode = document.documentElement.classList.contains("dark");
  
  // Ensure the element has an ID for print-js
  const originalId = previewRef.current.id;
  if (!originalId) {
    previewRef.current.id = "markdown-preview-export";
  }

  // Copy computed styles so the print document retains the preview typography and theme.
  printJS({
    printable: previewRef.current.id,
    type: "html",
    targetStyles: ["*"],
    // print-js otherwise appends a 12pt !important font size to every copied node.
    // An empty value leaves that declaration invalid so each computed font size survives.
    font_size: "",
    maxWidth: 768,
    documentTitle: cleanName,
    onPrintDialogClose: () => {
      document.title = prevTitle;
    },
    style: `
      @import url('https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap');
      body, .markdown-body { font-family: "Google Sans", sans-serif !important; }
      .markdown-code-copy { display: none !important; }
      @media print {
        @page {
          margin: 15mm;  
          size: A4;
        }
        
        /* Ensure colors print correctly */
        * { 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Apply theme-appropriate background */
        body {
          background-color: ${isDarkMode ? '#000000' : '#ffffff'} !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Base document container */
        .markdown-body {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 48rem !important;
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }

        /* Universal width standard: every block element matches the codeblock width */
        .markdown-body > *,
        .markdown-body p,
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6,
        .markdown-body ul,
        .markdown-body ol,
        .markdown-body blockquote,
        .markdown-body hr,
        .markdown-body .markdown-code-card,
        .markdown-body .markdown-code-content,
        .markdown-body .markdown-table-card,
        .markdown-body table {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* Tables occupy full card width uniformly */
        .markdown-body table {
          display: table !important;
          margin: 0 !important;
          border-collapse: collapse !important;
        }

        .markdown-body table th,
        .markdown-body table td {
          box-sizing: border-box !important;
        }

        .markdown-body .markdown-code-card,
        .markdown-body .markdown-table-card,
        .markdown-body blockquote {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          break-before: avoid-page !important;
          page-break-before: avoid !important;
          overflow: visible !important;
        }

        /* Theme-consistent styling across light and dark modes */
        ${isDarkMode ? `
          body {
            background-color: #000000 !important;
            color: #ededed !important;
          }
          .markdown-body {
            color: #ededed !important;
          }
          .markdown-body .markdown-code-card {
            background-color: #161616 !important;
            border-color: #303030 !important;
          }
          .markdown-body .markdown-table-card {
            background-color: #0c0c0c !important;
            border-color: #303030 !important;
          }
          .markdown-body .markdown-table-card th {
            background-color: #1a1a1a !important;
            color: #ededed !important;
            border-color: #303030 !important;
          }
          .markdown-body .markdown-table-card td {
            background-color: #0c0c0c !important;
            color: #ededed !important;
            border-color: #242424 !important;
          }
          .markdown-body .markdown-table-card tr:nth-child(2n) td {
            background-color: #141414 !important;
          }
          .markdown-body blockquote {
            background-color: #161616 !important;
            border-left: 4px solid #383838 !important;
            color: #ededed !important;
          }
        ` : `
          body {
            background-color: #ffffff !important;
            color: #0d0d0d !important;
          }
          .markdown-body {
            color: #0d0d0d !important;
          }
          .markdown-body .markdown-code-card {
            background-color: #f7f7f7 !important;
            border-color: #e1e1e1 !important;
          }
          .markdown-body .markdown-table-card {
            background-color: #ffffff !important;
            border-color: #e1e1e1 !important;
          }
          .markdown-body .markdown-table-card th {
            background-color: #f0f0f0 !important;
            color: #0d0d0d !important;
            border-color: #e1e1e1 !important;
          }
          .markdown-body .markdown-table-card td {
            background-color: #ffffff !important;
            color: #0d0d0d !important;
            border-color: #e5e5e5 !important;
          }
          .markdown-body .markdown-table-card tr:nth-child(2n) td {
            background-color: #f9f9f9 !important;
          }
          .markdown-body blockquote {
            background-color: #f7f7f7 !important;
            border-left: 4px solid #d1d5db !important;
            color: #0d0d0d !important;
          }
        `}

        /* Keep section titles, their descriptions, and the following code together. */
        .markdown-body :is(h1, h2, h3, h4, h5, h6) {
          break-after: avoid-page !important;
          page-break-after: avoid !important;
        }

        .markdown-body p:has(+ .markdown-code-card) {
          break-after: avoid-page !important;
          page-break-after: avoid !important;
        }

        /* Keep the preview's wrapping behavior while removing print scrollbars. */
        .markdown-body,
        .markdown-code-card,
        .markdown-code-content,
        .markdown-body pre,
        .markdown-body pre code {
          overflow: visible !important;
        }

        .markdown-code-content.code-wrap {
          overflow-x: hidden !important;
        }

        .markdown-code-content.code-nowrap {
          overflow-x: visible !important;
        }
      }
    `
  });

  // Fallback restoration in case onPrintDialogClose is unsupported
  setTimeout(() => {
    document.title = prevTitle;
  }, 4000);

  // Restore ID if we changed it
  if (!originalId) {
    previewRef.current.removeAttribute("id");
  }
}
