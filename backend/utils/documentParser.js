const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extracts readable text from an uploaded file buffer based on extension/mimetype.
 * Preserves structured table rows, detects figures/charts, and keeps up to 8000 characters.
 * @param {Buffer} buffer - File buffer from multer memory storage or HTTP fetch
 * @param {string} originalName - Original filename (e.g., "specs.pdf")
 * @returns {Promise<string>} - Extracted text snippet (up to 8000 chars)
 */
async function extractTextFromBuffer(buffer, originalName = "") {
  if (!buffer || !Buffer.isBuffer(buffer)) return "";

  const ext = (originalName.split(".").pop() || "").toLowerCase();
  let text = "";

  try {
    if (["txt", "csv", "json", "md", "log", "html", "xml", "js", "ts", "css", "sql"].includes(ext)) {
      text = buffer.toString("utf-8");
    } else if (ext === "pdf") {
      if (typeof pdfParse === "function") {
        const parsed = await pdfParse(buffer);
        text = parsed && parsed.text ? parsed.text : "";
      } else if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const parsed = await parser.getText();
        text = parsed && parsed.text ? parsed.text : "";
      } else {
        text = buffer.toString("utf-8");
      }
    } else if (["docx", "doc"].includes(ext)) {
      const result = await mammoth.extractRawText({ buffer });
      text = result && result.value ? result.value : "";
    } else if (["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext)) {
      text = `[Image Attachment File: ${originalName}]`;
    } else {
      const candidate = buffer.toString("utf-8");
      const printableCount = (candidate.match(/[\x20-\x7E\s]/g) || []).length;
      if (printableCount / Math.max(1, candidate.length) > 0.75) {
        text = candidate;
      }
    }
  } catch (err) {
    console.error(`Document text extraction error for ${originalName}:`, err.message);
    text = `[Document File: ${originalName}]`;
  }

  // Preserve line structures while cleaning excessive blank lines
  text = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  // Detect figures / images / charts from figure captions in text
  const figureMatches = text.match(/Figure\s+\d+[:\s][^\n]+/gi) || [];
  let figureSummary = "";
  if (figureMatches.length > 0) {
    figureSummary = `\n[Detected ${figureMatches.length} Figures/Images in Document: ${figureMatches.join("; ")}]`;
  }

  if (text.length > 8000) {
    text = text.substring(0, 8000) + "... [truncated]";
  }

  return text + figureSummary;
}

module.exports = {
  extractTextFromBuffer,
};
