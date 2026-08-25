const { pipeline } = require('@xenova/transformers');

// Reranker Configuration
const RERANKER_MODEL = process.env.RERANKER_MODEL || 'Xenova/ms-marco-TinyBERT-L-2-v2';
const DEFAULT_CANDIDATE_TOP_K = Number(process.env.RERANKER_CANDIDATE_TOP_K) || 25;
const DEFAULT_OUTPUT_TOP_K = Number(process.env.RERANKER_OUTPUT_TOP_K) || 6;
const RERANKER_ENABLED = process.env.RERANKER_ENABLED !== 'false';

let rerankerPipeline = null;
let isLoading = false;
let loadError = null;

/**
 * Singleton loader for local Cross-Encoder Reranker model
 */
async function getRerankerPipeline() {
  if (!RERANKER_ENABLED) return null;
  if (rerankerPipeline) return rerankerPipeline;
  if (loadError) return null;

  if (isLoading) {
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return rerankerPipeline;
  }

  try {
    isLoading = true;
    console.log(`🤖 Loading local Cross-Encoder Reranker model (${RERANKER_MODEL})...`);
    rerankerPipeline = await pipeline('text-classification', RERANKER_MODEL);
    console.log(`✅ Cross-Encoder Reranker model loaded successfully!`);
    isLoading = false;
    return rerankerPipeline;
  } catch (err) {
    isLoading = false;
    loadError = err;
    console.warn(`⚠️ Cross-Encoder Reranker model failed to load (${err.message}). System will use RRF fusion fallback.`);
    return null;
  }
}

/**
 * Rerank candidate chunks using local Cross-Encoder model
 */
async function rerankCandidates(query, candidates = [], options = {}) {
  const enabled = options.enabled !== undefined ? options.enabled : RERANKER_ENABLED;
  const candidateTopK = options.candidateTopK || DEFAULT_CANDIDATE_TOP_K;
  const outputTopK = options.outputTopK || DEFAULT_OUTPUT_TOP_K;

  if (!enabled || !candidates || candidates.length === 0) {
    return {
      chunks: candidates.slice(0, outputTopK),
      reranked: false,
      reason: 'Reranker disabled or empty candidates'
    };
  }

  const topCandidates = candidates.slice(0, candidateTopK);

  try {
    const pipe = await getRerankerPipeline();

    if (!pipe) {
      return {
        chunks: topCandidates.slice(0, outputTopK),
        reranked: false,
        reason: 'Reranker model unavailable, used RRF fallback'
      };
    }

    const scoredItems = [];

    for (let i = 0; i < topCandidates.length; i++) {
      const item = topCandidates[i];
      const snippet = (item.text || '').slice(0, 512); // Bound input snippet length for speed

      try {
        const result = await pipe(query, { text_pair: snippet });
        // Extract raw classification confidence score
        const score = result && result[0] ? Number(result[0].score || 0) : 0;

        scoredItems.push({
          ...item,
          rerankScore: score
        });
      } catch (itemErr) {
        scoredItems.push({
          ...item,
          rerankScore: item.rrfScore || 0
        });
      }
    }

    // Sort candidates by Cross-Encoder score descending
    scoredItems.sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0));

    return {
      chunks: scoredItems.slice(0, outputTopK),
      reranked: true
    };

  } catch (err) {
    console.warn('⚠️ Cross-Encoder reranking error:', err.message);
    return {
      chunks: topCandidates.slice(0, outputTopK),
      reranked: false,
      reason: `Reranker runtime error: ${err.message}`
    };
  }
}

module.exports = {
  rerankCandidates,
  getRerankerPipeline
};
