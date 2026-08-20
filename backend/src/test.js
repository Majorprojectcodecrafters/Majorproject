const path = require("path");
const { pdfToChunks } = require("./rag/pdfLoader");

async function run() {
  try {
    const filePath = path.join(__dirname, "rag", "sci10.pdf");

    const chunks = await pdfToChunks(filePath);

    console.log("Total chunks:", chunks.length);
    console.log("First chunk:", chunks[0]);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();