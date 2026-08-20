const path = require('path');
const fs = require('fs');
const { pdfToChunks } = require('./pdfLoader');
const { embedBatch } = require('./embedder');
const { storeChunks, deleteBySource } = require('./vectorStore');

// Ingest a single PDF into ChromaDB
async function ingestPDF(filePath, metadata) {
  try {
    console.log(`\n📥 Ingesting: ${path.basename(filePath)}`);

    // 1. Parse and chunk PDF
    const chunks = await pdfToChunks(filePath);
    console.log(`✂️  ${chunks.length} chunks created`);

    // 2. Embed all chunks
    console.log('🔄 Generating embeddings...');
    const texts = chunks.map(c => c.text);
    const embeddings = await embedBatch(texts);
    console.log('✅ Embeddings generated');

    // 3. Store in ChromaDB
    await storeChunks(chunks, embeddings, {
      fileName: path.basename(filePath),
      ...metadata
    });

    return {
      success: true,
      fileName: path.basename(filePath),
      chunksIngested: chunks.length
    };

  } catch (error) {
    console.error(`❌ Ingest error for ${filePath}:`, error.message);
    throw error;
  }
}

// Ingest all PDFs from a directory
async function ingestDirectory(dirPath, metadata) {
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('⚠️ No PDFs found in directory');
    return [];
  }

  const results = [];
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const result = await ingestPDF(filePath, metadata);
      results.push(result);
    } catch (error) {
      results.push({ success: false, fileName: file, error: error.message });
    }
  }

  return results;
}

module.exports = { ingestPDF, ingestDirectory };