const { ChromaClient } = require('chromadb');

const client = new ChromaClient({
  host: process.env.CHROMA_HOST || 'localhost',
  port: Number(process.env.CHROMA_PORT) || 8000,
  ssl: process.env.CHROMA_SSL === 'true'
});

const COLLECTION_NAME = 'syllabus_knowledge_base';

let collection = null;

const dummyEmbeddingFunction = {
  generate: async (texts) => texts.map(() => [])
};

async function getCollection() {
  if (!collection) {
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'Syllabus textbooks, notes, and question knowledge base' },
      embeddingFunction: dummyEmbeddingFunction
    });
  }
  return collection;
}

const { bm25Store } = require('./bm25Store');

// Store chunks with complete curriculum & source metadata
async function storeChunks(chunks, embeddings, metadata) {
  const col = await getCollection();

  const ids = chunks.map((_, i) => `${metadata.fileName}_${metadata.sourceType || 'TEXTBOOK'}_chunk_${Date.now()}_${i}`);
  const documents = chunks.map(c => c.text);
  const metadatas = chunks.map((c, i) => ({
    source: metadata.fileName,
    sourceType: metadata.sourceType || metadata.type || 'TEXTBOOK',
    boardId: metadata.boardId || '',
    streamId: metadata.streamId || '',
    classId: metadata.classId || '',
    className: metadata.className || '',
    subjectId: metadata.subjectId || '',
    subjectName: metadata.subjectName || '',
    unitId: metadata.unitId || '',
    chapterId: metadata.chapterId || '',
    chapterName: metadata.chapterName || '',
    topicId: metadata.topicId || '',
    knowledgeSourceId: metadata.knowledgeSourceId || '',
    grade: metadata.grade || '',
    pageNumber: String(c.metadata?.pageNumber || c.metadata?.page || ''),
    chunkId: String(c.metadata?.chunkId || i),
    version: String(metadata.version || '1.0'),
    academicYear: String(metadata.academicYear || ''),
    isActive: String(metadata.isActive !== false ? 'true' : 'false'),
    sourcePriority: Number(metadata.sourcePriority || 10)
  }));

  await col.add({
    ids,
    embeddings,
    documents,
    metadatas
  });

  // Synchronize BM25 Store with identical chunk IDs, documents, and metadatas
  try {
    const bm25Chunks = ids.map((id, i) => ({
      id,
      text: documents[i],
      metadata: metadatas[i]
    }));
    bm25Store.addChunksBatch(bm25Chunks);
  } catch (bm25Err) {
    console.warn('⚠️ BM25 sync warning:', bm25Err.message);
  }

  console.log(`✅ Stored ${chunks.length} chunks in ChromaDB & BM25 index with complete curriculum metadata`);
}

// Build strict curriculum-isolated ChromaDB query filter
function buildCurriculumFilter({ boardId, streamId, classId, subjectId, chapterId, topicId, sourceType, version, academicYear, isActive = true }) {
  const conditions = [];

  if (classId)       conditions.push({ classId: { $eq: classId } });
  if (subjectId)     conditions.push({ subjectId: { $eq: subjectId } });
  if (chapterId)     conditions.push({ chapterId: { $eq: chapterId } });
  if (topicId)       conditions.push({ topicId: { $eq: topicId } });
  if (sourceType)    conditions.push({ sourceType: { $eq: sourceType } });
  if (boardId)       conditions.push({ boardId: { $eq: boardId } });
  if (streamId)      conditions.push({ streamId: { $eq: streamId } });
  if (version)       conditions.push({ version: { $eq: String(version) } });
  if (academicYear)  conditions.push({ academicYear: { $eq: String(academicYear) } });
  if (isActive)      conditions.push({ isActive: { $eq: 'true' } });

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

// Query relevant chunks with curriculum metadata filtering and source priority ranking
async function queryChunks(queryEmbedding, filters = {}, topK = 10) {
  try {
    const col = await getCollection();

    const queryParams = {
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ['documents', 'metadatas', 'distances']
    };

    if (Object.keys(filters).length > 0) {
      queryParams.where = filters;
    }

    const results = await col.query(queryParams);

    if (!results || !results.documents || !results.documents[0]) {
      return [];
    }

    const items = results.documents[0].map((doc, i) => {
      const dist = results.distances ? results.distances[0][i] : 0;
      // Cosine / L2 distance to normalized relevance score (higher is better)
      const relevanceScore = typeof dist === 'number' ? Math.max(0, 1 - dist) : 1;
      return {
        text: doc,
        metadata: results.metadatas[0][i],
        distance: dist,
        relevanceScore
      };
    });

    // Rank chunks primarily by sourcePriority (textbooks first), secondarily by relevance score
    items.sort((a, b) => {
      const priorityDiff = (Number(b.metadata?.sourcePriority) || 10) - (Number(a.metadata?.sourcePriority) || 10);
      if (priorityDiff !== 0) return priorityDiff;
      return b.relevanceScore - a.relevanceScore;
    });

    return items;
  } catch (err) {
    console.warn('⚠️ Vector store query warning:', err.message);
    return [];
  }
}

// Get collection stats
async function getStats() {
  const col = await getCollection();
  const count = await col.count();
  return { totalChunks: count, collection: COLLECTION_NAME };
}

// Delete chunks by source file
async function deleteBySource(fileName) {
  const col = await getCollection();
  await col.delete({ where: { source: { $eq: fileName } } });
  bm25Store.deleteBySource(fileName);
  console.log(`🗑️ Deleted chunks for: ${fileName}`);
}

// Delete chunks by knowledge source ID
async function deleteBySourceId(knowledgeSourceId) {
  const col = await getCollection();
  await col.delete({ where: { knowledgeSourceId: { $eq: knowledgeSourceId } } });
  bm25Store.deleteBySourceId(knowledgeSourceId);
  console.log(`🗑️ Deleted chunks for knowledgeSourceId: ${knowledgeSourceId}`);
}

// Delete chunks by subject
async function deleteBySubject(subjectId) {
  const col = await getCollection();
  await col.delete({ where: { subjectId: { $eq: subjectId } } });
  bm25Store.deleteBySubject(subjectId);
  console.log(`🗑️ Deleted chunks for subjectId: ${subjectId}`);
}

// Delete chunks by grade
async function deleteByGrade(grade) {
  const col = await getCollection();
  await col.delete({ where: { grade: { $eq: grade } } });
  console.log(`🗑️ Deleted chunks for grade: ${grade}`);
}

module.exports = {
  storeChunks,
  queryChunks,
  buildCurriculumFilter,
  getStats,
  deleteBySource,
  deleteBySourceId,
  deleteBySubject,
  deleteByGrade
};
