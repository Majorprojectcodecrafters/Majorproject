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
      metadata: { description: 'Syllabus textbooks and PYQ knowledge base' },
      embeddingFunction: null
    });
  }
  return collection;
}

// Store chunks with embeddings and metadata
async function storeChunks(chunks, embeddings, metadata) {
  const col = await getCollection();

  const ids = chunks.map((_, i) => `${metadata.fileName}_${metadata.type}_chunk_${Date.now()}_${i}`);
  const documents = chunks.map(c => c.text);
  const metadatas = chunks.map(c => ({
    source: metadata.fileName,
    type: metadata.type,
    subjectId: metadata.subjectId || '',
    subjectName: metadata.subjectName || '',
    chapterId: metadata.chapterId || '',
    chapterName: metadata.chapterName || '',
    grade: metadata.grade || '',
    chunkId: c.metadata.chunkId
  }));

  await col.add({
    ids,
    embeddings,
    documents,
    metadatas
  });

  console.log(`✅ Stored ${chunks.length} chunks in ChromaDB`);
}

// Query relevant chunks — accepts pre-built filters directly
async function queryChunks(queryEmbedding, filters = {}, topK = 10) {
  const col = await getCollection();

  const queryParams = {
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    include: ['documents', 'metadatas', 'distances']
  };

  // Pass filters directly — supports $and, $or, $eq etc.
  if (Object.keys(filters).length > 0) {
    queryParams.where = filters;
  }

  const results = await col.query(queryParams);

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

// Delete chunks by grade
async function deleteByGrade(grade) {
  const col = await getCollection();
  await col.delete({ where: { grade: { $eq: grade } } });
  console.log(`🗑️ Deleted chunks for grade: ${grade}`);
}

// Delete chunks by subject
async function deleteBySubject(subjectId) {
  const col = await getCollection();
  await col.delete({ where: { subjectId: { $eq: subjectId } } });
  console.log(`🗑️ Deleted chunks for subjectId: ${subjectId}`);
}

module.exports = { storeChunks, queryChunks, getStats, deleteBySource, deleteByGrade, deleteBySubject };
