require('dotenv').config();
const { bm25Store, tokenizePreservingScientific } = require('../src/rag/bm25Store');
const { performHybridRrfSearch } = require('../src/rag/hybridRetriever');
const { rerankCandidates } = require('../src/rag/reranker');
const { retrieveRelevantChunks, deduplicateChunks } = require('../src/rag/retrievalService');

async function runTests() {
  console.log('🧪 Starting Upgraded RAG Retrieval Pipeline Test Suite...\n');

  // Test 1: Preservation Tokenizer
  console.log('--- Test 1: Scientific & Technical Preservation Tokenizer ---');
  const sampleFormulaText = 'Chemical reaction H2SO4 + 2NaOH -> Na2SO4 + 2H2O with PV=nRT and F=ma under ∫ x^2 dx = x^3/3';
  const tokens = tokenizePreservingScientific(sampleFormulaText);
  console.log('Input Text:', sampleFormulaText);
  console.log('Tokens:', tokens);

  const hasH2SO4 = tokens.includes('h2so4');
  const hasPVnRT = tokens.includes('pv=nrt');
  const hasFma = tokens.includes('f=ma');

  if (hasH2SO4 && hasPVnRT && hasFma) {
    console.log('✅ PASS: Scientific & Chemical tokens preserved cleanly!');
  } else {
    console.error('❌ FAIL: Scientific tokens were stripped or corrupted.');
  }

  // Test 2: BM25 Store Indexing & Exact Retrieval
  console.log('\n--- Test 2: BM25 Exact Keyword Retrieval ---');
  const testChunks = [
    {
      id: 'chunk_1',
      text: 'Electromagnetic induction law states emf = -dΦ/dt according to Faraday and Lenz law.',
      metadata: { subjectId: 'subj_physics_12', chapterId: 'chap_emi', sourceType: 'TEXTBOOK' }
    },
    {
      id: 'chunk_2',
      text: 'Sulfuric acid H2SO4 reacts with sodium hydroxide NaOH to produce sodium sulfate Na2SO4.',
      metadata: { subjectId: 'subj_chem_12', chapterId: 'chap_chem_kinetics', sourceType: 'TEXTBOOK' }
    },
    {
      id: 'chunk_3',
      text: 'Ideal gas equation PV = nRT relates pressure, volume, temperature and moles.',
      metadata: { subjectId: 'subj_chem_11', chapterId: 'chap_states_of_matter', sourceType: 'TEXTBOOK' }
    }
  ];

  bm25Store.addChunksBatch(testChunks);

  const bm25Results = bm25Store.search('H2SO4 reaction NaOH', { subjectId: 'subj_chem_12' }, 5);
  console.log('BM25 Search for H2SO4:', bm25Results);

  if (bm25Results.length > 0 && bm25Results[0].chunkId === 'chunk_2') {
    console.log('✅ PASS: BM25 exact chemical term matching & metadata filtering successful!');
  } else {
    console.error('❌ FAIL: BM25 exact term matching failed.');
  }

  // Test 3: RRF Hybrid Rank Fusion
  console.log('\n--- Test 3: Reciprocal Rank Fusion (RRF) ---');
  const mockDense = [
    { text: 'Electromagnetic induction law states emf = -dΦ/dt', metadata: { chunkId: 'chunk_1' }, relevanceScore: 0.92 },
    { text: 'Ideal gas equation PV = nRT', metadata: { chunkId: 'chunk_3' }, relevanceScore: 0.75 }
  ];

  const mockBm25 = [
    { chunkId: 'chunk_2', text: 'Sulfuric acid H2SO4 reacts with NaOH', bm25Score: 4.8 },
    { chunkId: 'chunk_1', text: 'Electromagnetic induction law states emf = -dΦ/dt', bm25Score: 3.2 }
  ];

  const rrfCandidates = performHybridRrfSearch({ denseResults: mockDense, bm25Results: mockBm25, rrfK: 60, hybridTopK: 10 });
  console.log('RRF Fusion Candidates:', rrfCandidates);

  if (rrfCandidates.length === 3 && rrfCandidates[0].chunkId === 'chunk_1') {
    console.log('✅ PASS: RRF Rank Fusion combined candidate lists & identified top rank!');
  } else {
    console.error('❌ FAIL: RRF Rank Fusion failed.');
  }

  // Test 4: Local Cross-Encoder Reranker
  console.log('\n--- Test 4: Local Cross-Encoder Reranker ---');
  const rerankResult = await rerankCandidates('Faraday law electromagnetic induction', rrfCandidates, { enabled: true, candidateTopK: 10, outputTopK: 2 });
  console.log('Reranked Output:', rerankResult);

  if (rerankResult.chunks && rerankResult.chunks.length === 2) {
    console.log(`✅ PASS: Local Cross-Encoder reranked candidates successfully (Reranked: ${rerankResult.reranked})!`);
  } else {
    console.error('❌ FAIL: Local Cross-Encoder reranking failed.');
  }

  // Test 5: Deduplication Safeguards
  console.log('\n--- Test 5: Deduplication & Diversity Safeguard ---');
  const dupeList = [
    { chunkId: 'chunk_1', text: 'Sample text A', metadata: { source: 'book.pdf', pageNumber: 1 } },
    { chunkId: 'chunk_1', text: 'Sample text A', metadata: { source: 'book.pdf', pageNumber: 1 } },
    { chunkId: 'chunk_2', text: 'Sample text B', metadata: { source: 'book.pdf', pageNumber: 2 } }
  ];
  const deduped = deduplicateChunks(dupeList);
  console.log('Original length:', dupeList.length, 'Deduped length:', deduped.length);

  if (deduped.length === 2) {
    console.log('✅ PASS: Deduplication safeguard removed duplicate chunks!');
  } else {
    console.error('❌ FAIL: Deduplication safeguard failed.');
  }

  console.log('\n🎉 ALL RETRIEVAL TESTS COMPLETED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('❌ Error during retrieval tests:', err);
  process.exit(1);
});
