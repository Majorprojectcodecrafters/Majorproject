const { pipeline } = require('@xenova/transformers');

let embedder = null;

// Load model once and reuse
async function getEmbedder() {
  if (!embedder) {
    console.log('🔄 Loading embedding model...');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedding model loaded');
  }
  return embedder;
}

async function embedText(text) {
  const model = await getEmbedder();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function embedBatch(texts, batchSize = 32) {
  const model = await getEmbedder();
  const embeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batchTexts = texts.slice(i, i + batchSize);
    try {
      const output = await model(batchTexts, { pooling: 'mean', normalize: true });
      const dims = output.dims[1] || 384;
      for (let j = 0; j < batchTexts.length; j++) {
        const start = j * dims;
        const end = start + dims;
        embeddings.push(Array.from(output.data.slice(start, end)));
      }
    } catch (e) {
      // Fallback to item-by-item if batch tensor fails
      for (const text of batchTexts) {
        const singleEmb = await embedText(text);
        embeddings.push(singleEmb);
      }
    }
  }

  return embeddings;
}

module.exports = { embedText, embedBatch };