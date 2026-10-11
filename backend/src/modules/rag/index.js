/**
 * RAG Module Barrel Export
 */

const {
  ragService,
  ingestPDF,
  generateQuestionPaper,
  retrieveRelevantChunks,
  vectorStore,
  embedder,
  hybridRetriever,
  llmClient,
  bm25Store,
  ingestionStatus,
  pdfLoader
} = require('./rag.service');

module.exports = {
  ragService,
  ingestPDF,
  generateQuestionPaper,
  retrieveRelevantChunks,
  vectorStore,
  embedder,
  hybridRetriever,
  llmClient,
  bm25Store,
  ingestionStatus,
  pdfLoader
};
