const { ChromaClient } = require('chromadb');

const client = new ChromaClient({
  host: process.env.CHROMA_HOST || 'localhost',
  port: Number(process.env.CHROMA_PORT) || 8000,
  ssl: process.env.CHROMA_SSL === 'true'
});

const COLLECTION_NAME = 'syllabus_knowledge_base';

let collection = null;

async function getCollection() {
  if (!collection) {
    collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
      metadata: { description: 'Syllabus textbooks, notes, and question knowledge base' },
      embeddingFunction: null
    });
  }
  return collection;
}

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
    chunkId: String(c.metadata?.chunkId || i)
  }));

  await col.add({
    ids,
    embeddings,
    documents,
    metadatas
  });

  console.log(`✅ Stored ${chunks.length} chunks in ChromaDB with complete curriculum metadata`);
}

// Build strict curriculum-isolated ChromaDB query filter
function buildCurriculumFilter({ boardId, streamId, classId, subjectId, chapterId, topicId, sourceType }) {
  const conditions = [];

  if (classId)     conditions.push({ classId: { $eq: classId } });
  if (subjectId)   conditions.push({ subjectId: { $eq: subjectId } });
  if (chapterId)   conditions.push({ chapterId: { $eq: chapterId } });
  if (topicId)     conditions.push({ topicId: { $eq: topicId } });
  if (sourceType)  conditions.push({ sourceType: { $eq: sourceType } });
  if (boardId)     conditions.push({ boardId: { $eq: boardId } });
  if (streamId)    conditions.push({ streamId: { $eq: streamId } });

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { $and: conditions };
}

// Query relevant chunks with curriculum metadata filtering
async function queryChunks(queryEmbedding, filters = {}, topK = 10) {
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

  return results.documents[0].map((doc, i) => ({
    text: doc,
    metadata: results.metadatas[0][i],
    distance: results.distances[0][i]
  }));
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
  console.log(`🗑️ Deleted chunks for: ${fileName}`);
}

// Delete chunks by knowledge source ID
async function deleteBySourceId(knowledgeSourceId) {
  const col = await getCollection();
  await col.delete({ where: { knowledgeSourceId: { $eq: knowledgeSourceId } } });
  console.log(`🗑️ Deleted chunks for knowledgeSourceId: ${knowledgeSourceId}`);
}

// Delete chunks by subject
async function deleteBySubject(subjectId) {
  const col = await getCollection();
  await col.delete({ where: { subjectId: { $eq: subjectId } } });
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
