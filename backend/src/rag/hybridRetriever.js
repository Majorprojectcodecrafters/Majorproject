/**
 * Reciprocal Rank Fusion (RRF) Hybrid Search Engine
 * Combines Dense Vector Search (ChromaDB) + BM25 Keyword Search using rank-based fusion:
 * RRFScore(d) = 1/(k + denseRank(d)) + 1/(k + bm25Rank(d))
 */

function performHybridRrfSearch({
  denseResults = [],
  bm25Results = [],
  rrfK = 60,
  hybridTopK = 25
}) {
  const combinedMap = new Map();

  // Process Dense Results (1-indexed rank)
  denseResults.forEach((item, idx) => {
    const key = item.metadata?.chunkId || item.id || `dense_${idx}_${(item.text || '').slice(0, 30)}`;
    const denseRank = idx + 1;
    const denseRrf = 1 / (rrfK + denseRank);

    combinedMap.set(key, {
      chunkId: key,
      text: item.text,
      metadata: item.metadata || {},
      denseRank,
      bm25Rank: null,
      denseScore: item.relevanceScore || (item.distance !== undefined ? 1 - item.distance : null),
      bm25Score: null,
      rrfScore: denseRrf
    });
  });

  // Process BM25 Results (1-indexed rank)
  bm25Results.forEach((item, idx) => {
    const key = item.chunkId || `bm25_${idx}_${(item.text || '').slice(0, 30)}`;
    const bm25Rank = idx + 1;
    const bm25Rrf = 1 / (rrfK + bm25Rank);

    if (combinedMap.has(key)) {
      const existing = combinedMap.get(key);
      existing.bm25Rank = bm25Rank;
      existing.bm25Score = item.bm25Score;
      existing.rrfScore += bm25Rrf;
    } else {
      combinedMap.set(key, {
        chunkId: key,
        text: item.text,
        metadata: item.metadata || {},
        denseRank: null,
        bm25Rank,
        denseScore: null,
        bm25Score: item.bm25Score,
        rrfScore: bm25Rrf
      });
    }
  });

  // Convert to array and rank by rrfScore descending
  const candidates = Array.from(combinedMap.values());

  candidates.sort((a, b) => {
    // Primary rank by RRF Score
    if (b.rrfScore !== a.rrfScore) {
      return b.rrfScore - a.rrfScore;
    }
    // Secondary tie-break by sourcePriority metadata
    const prioA = Number(a.metadata?.sourcePriority) || 10;
    const prioB = Number(b.metadata?.sourcePriority) || 10;
    return prioB - prioA;
  });

  return candidates.slice(0, hybridTopK);
}

module.exports = {
  performHybridRrfSearch
};
