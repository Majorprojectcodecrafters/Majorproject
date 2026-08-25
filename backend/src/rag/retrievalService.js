const { queryChunks } = require('./vectorStore');
const { bm25Store } = require('./bm25Store');
const { performHybridRrfSearch } = require('./hybridRetriever');
const { rerankCandidates } = require('./reranker');

// Default Configurable Configuration
const DEFAULT_DENSE_TOP_K = Number(process.env.RETRIEVAL_DENSE_TOP_K) || 20;
const DEFAULT_BM25_TOP_K = Number(process.env.RETRIEVAL_BM25_TOP_K) || 20;
const DEFAULT_RRF_K = Number(process.env.RETRIEVAL_RRF_K) || 60;
const DEFAULT_HYBRID_TOP_K = Number(process.env.RETRIEVAL_HYBRID_TOP_K) || 25;
const DEFAULT_OUTPUT_TOP_K = Number(process.env.RETRIEVAL_OUTPUT_TOP_K) || 6;

/**
 * Deduplicate candidates to prevent redundant passages from the same page/region
 */
function deduplicateChunks(chunks, maxPerSourcePage = 3) {
  if (!chunks || !Array.isArray(chunks)) return [];

  const seenIds = new Set();
  const seenTextHashes = new Set();
  const sourcePageCounts = new Map();

  const result = [];

  for (const item of chunks) {
    if (!item || !item.text) continue;

    const id = item.chunkId || item.id;
    if (id && seenIds.has(id)) continue;

    // Normalized text hash check for near-duplicate text
    const textHash = item.text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 100);
    if (seenTextHashes.has(textHash)) continue;

    // Diversity check per source + pageNumber
    const pageKey = `${item.metadata?.source || 'src'}_p${item.metadata?.pageNumber || '0'}`;
    const pageCount = sourcePageCounts.get(pageKey) || 0;
    if (pageCount >= maxPerSourcePage) continue;

    if (id) seenIds.add(id);
    seenTextHashes.add(textHash);
    sourcePageCounts.set(pageKey, pageCount + 1);

    result.push(item);
  }

  return result;
}

/**
 * Unified Retrieval Service: Orchestrates Dense ChromaDB Search + BM25 Search + RRF Fusion + Cross-Encoder Reranking
 */
async function retrieveRelevantChunks({
  queryEmbedding,
  semanticQuery,
  keywordQuery,
  filters = {},
  options = {}
}) {
  const totalStart = Date.now();

  const denseTopK = options.denseTopK || DEFAULT_DENSE_TOP_K;
  const bm25TopK = options.bm25TopK || DEFAULT_BM25_TOP_K;
  const rrfK = options.rrfK || DEFAULT_RRF_K;
  const hybridTopK = options.hybridTopK || DEFAULT_HYBRID_TOP_K;
  const outputTopK = options.outputTopK || DEFAULT_OUTPUT_TOP_K;

  const searchQuery = keywordQuery || semanticQuery || '';

  // 1. Dense ChromaDB Retrieval
  const denseStart = Date.now();
  let denseResults = [];
  try {
    if (queryEmbedding) {
      denseResults = await queryChunks(queryEmbedding, filters, denseTopK);
    }
  } catch (err) {
    console.warn('⚠️ Dense retrieval warning:', err.message);
  }
  const denseLatencyMs = Date.now() - denseStart;

  // 2. BM25 Keyword Search
  const bm25Start = Date.now();
  let bm25Results = [];
  try {
    bm25Results = bm25Store.search(searchQuery, filters, bm25TopK);
  } catch (err) {
    console.warn('⚠️ BM25 retrieval warning:', err.message);
  }
  const bm25LatencyMs = Date.now() - bm25Start;

  // 3. Reciprocal Rank Fusion (RRF)
  const rrfStart = Date.now();
  let rrfCandidates = performHybridRrfSearch({
    denseResults,
    bm25Results,
    rrfK,
    hybridTopK
  });
  const rrfLatencyMs = Date.now() - rrfStart;

  // 4. Cross-Encoder Reranking
  const rerankStart = Date.now();
  let rerankOutcome = { chunks: rrfCandidates.slice(0, outputTopK), reranked: false };
  try {
    rerankOutcome = await rerankCandidates(searchQuery, rrfCandidates, {
      candidateTopK: hybridTopK,
      outputTopK
    });
  } catch (err) {
    console.warn('⚠️ Reranking warning:', err.message);
  }
  const rerankLatencyMs = Date.now() - rerankStart;

  // 5. Deduplication & Diversity Filter
  const finalRaw = rerankOutcome.chunks || [];
  const finalChunks = deduplicateChunks(finalRaw);

  const totalRetrievalLatencyMs = Date.now() - totalStart;

  const diagnostics = {
    denseCount: denseResults.length,
    bm25Count: bm25Results.length,
    rrfCandidateCount: rrfCandidates.length,
    finalChunkCount: finalChunks.length,
    reranked: rerankOutcome.reranked,
    denseLatencyMs,
    bm25LatencyMs,
    rrfLatencyMs,
    rerankLatencyMs,
    totalRetrievalLatencyMs
  };

  console.log(`🔎 [Unified Retrieval] Retrieved ${finalChunks.length} chunks (Dense: ${denseResults.length}, BM25: ${bm25Results.length}, Latency: ${totalRetrievalLatencyMs}ms, Reranked: ${rerankOutcome.reranked})`);

  return {
    chunks: finalChunks,
    diagnostics
  };
}

module.exports = {
  retrieveRelevantChunks,
  deduplicateChunks
};
