import printJS from "print-js";
import "print-js/dist/print.css";

export default function handleExport(previewRef) {
  if (!previewRef.current) return;

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
    maxWidth: 896,
    documentTitle: "Markdown Export",
    style: `
      @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;600&display=swap');
      body, .markdown-body { font-family: "Ubuntu", sans-serif !important; }
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

        .markdown-body {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 56rem !important;
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: 24px !important;
          padding-right: 24px !important;
        }

        .markdown-body .markdown-code-card,
        .markdown-body .markdown-code-content {
          box-sizing: border-box !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        .markdown-body .markdown-code-card {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          break-before: avoid-page !important;
          page-break-before: avoid !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          overflow: visible !important;
        }

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

  // Restore ID if we changed it
  if (!originalId) {
    previewRef.current.removeAttribute("id");
  }
}
