const fs = require("fs");
const path = require("path");
const pdfParseLib = require("pdf-parse");

// Fix for Node 20+ / 24 compatibility
const pdfParse = typeof pdfParseLib === "function"
  ? pdfParseLib
  : pdfParseLib.default;

// ---------------- CLEAN TEXT ----------------
function cleanText(text) {
  return text
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/Page \d+/gi, "") // remove page numbers
    .trim();
}

// ---------------- CHUNK TEXT ----------------
function chunkText(text, chunkSize = 200, overlap = 50) {
  const words = text.split(" ");
  const chunks = [];

  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(" ");

    if (chunk.length > 50) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

// ---------------- LOAD PDF ----------------
async function loadPDF(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found: " + filePath);
    }

    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    if (!data.text || data.text.trim().length === 0) {
      throw new Error("PDF has no extractable text (maybe scanned image)");
    }

    return data.text;

  } catch (error) {
    console.error("❌ PDF Load Error:", error.message);
    throw error;
  }
}

// ---------------- MAIN PIPELINE ----------------
async function pdfToChunks(filePath) {
  try {
    console.log(`📄 Loading PDF: ${filePath}`);

    const rawText = await loadPDF(filePath);
    const text = cleanText(rawText);

    const chunks = chunkText(text);

    console.log(`✂️ Created ${chunks.length} chunks`);

    return chunks.map((chunk, index) => ({
      text: chunk,
      metadata: {
        source: path.basename(filePath),
        chunkId: index
      }
    }));

  } catch (error) {
    console.error("❌ pdfToChunks Error:", error.message);
    throw error;
  }
}

module.exports = {
  pdfToChunks,
  chunkText,
  loadPDF,
  cleanText
};