require('dotenv').config();
const { embedText } = require('../src/rag/embedder');
const { queryChunks } = require('../src/rag/vectorStore');
const { bm25Store } = require('../src/rag/bm25Store');
const { performHybridRrfSearch } = require('../src/rag/hybridRetriever');
const { rerankCandidates } = require('../src/rag/reranker');
const { retrieveRelevantChunks } = require('../src/rag/retrievalService');

const SAMPLE_BENCHMARK_QUERIES = [
  {
    query: 'Faraday law electromagnetic induction induced emf magnetic flux formula',
    subject: 'Physics',
    keyTerms: ['emf', 'faraday', 'magnetic', 'flux']
  },
  {
    query: 'Sulfuric acid H2SO4 chemical reaction enthalpy rate kinetics',
    subject: 'Chemistry',
    keyTerms: ['h2so4', 'reaction', 'kinetics']
  },
  {
    query: 'Derivatives integration calculus fundamental theorem calculus dx',
    subject: 'Mathematics',
    keyTerms: ['calculus', 'derivatives', 'integration', 'dx']
  },
  {
    query: 'Human heart anatomical structure cardiac cycle blood circulation diagram',
    subject: 'Biology',
    keyTerms: ['heart', 'cardiac', 'circulation', 'blood']
  }
];

async function runBenchmark() {
  console.log('📊 Starting Automated Retrieval Pipeline Benchmark Suite...\n');
  console.log('===============================================================');
  console.log('Comparing Baseline (Dense Only) vs Version 2 (Hybrid RRF) vs Version 3 (Hybrid + Cross-Encoder)');
  console.log('===============================================================\n');

  const summary = [];

  for (let i = 0; i < SAMPLE_BENCHMARK_QUERIES.length; i++) {
    const qObj = SAMPLE_BENCHMARK_QUERIES[i];
    console.log(`\n🔎 Query #${i + 1} [${qObj.subject}]: "${qObj.query}"`);

    const queryEmbedding = await embedText(qObj.query);

    // 1. Baseline: Dense ChromaDB Only
    const t0 = Date.now();
    const denseChunks = await queryChunks(queryEmbedding, {}, 20);
    const denseMs = Date.now() - t0;

    // 2. Version 2: Dense + BM25 + RRF
    const t1 = Date.now();
    const bm25Chunks = bm25Store.search(qObj.query, {}, 20);
    const rrfChunks = performHybridRrfSearch({ denseResults: denseChunks, bm25Results: bm25Chunks, rrfK: 60, hybridTopK: 15 });
    const hybridRrfMs = Date.now() - t1;

    // 3. Version 3: Dense + BM25 + RRF + Cross-Encoder Reranker
    const t2 = Date.now();
    const fullResult = await retrieveRelevantChunks({
      queryEmbedding,
      semanticQuery: qObj.query,
      keywordQuery: qObj.query,
      filters: {},
      options: { outputTopK: 6 }
    });
    const fullPipelineMs = Date.now() - t2;

    const row = {
      query: qObj.query,
      subject: qObj.subject,
      baselineDenseMs: denseMs,
      hybridRrfMs: hybridRrfMs,
      fullPipelineMs: fullPipelineMs,
      denseCandidates: denseChunks.length,
      bm25Candidates: bm25Chunks.length,
      finalOutputChunks: fullResult.chunks.length,
      reranked: fullResult.diagnostics.reranked
    };

    summary.push(row);

    console.log(`   ⚡ Baseline Dense Latency:    ${denseMs} ms (Retrieved: ${denseChunks.length})`);
    console.log(`   ⚡ Version 2 Hybrid RRF:      ${hybridRrfMs} ms (Retrieved: ${rrfChunks.length})`);
    console.log(`   ⚡ Version 3 Hybrid+Reranker: ${fullPipelineMs} ms (Output Chunks: ${fullResult.chunks.length})`);
  }

  console.log('\n===============================================================');
  console.log('📈 RETRIEVAL PIPELINE BENCHMARK SUMMARY REPORT');
  console.log('===============================================================');
  console.table(summary.map(s => ({
    Subject: s.subject,
    'Baseline Dense (ms)': s.baselineDenseMs,
    'Hybrid RRF (ms)': s.hybridRrfMs,
    'Hybrid+Reranker (ms)': s.fullPipelineMs,
    'Dense Count': s.denseCandidates,
    'BM25 Count': s.bm25Candidates,
    'Output Chunks': s.finalOutputChunks,
    'Reranked': s.reranked ? 'YES' : 'NO'
  })));

  console.log('\n✅ Benchmark suite completed successfully!\n');
}

runBenchmark().catch(err => {
  console.error('❌ Benchmark error:', err);
  process.exit(1);
});
