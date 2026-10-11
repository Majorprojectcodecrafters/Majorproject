/**
 * ============================================================================
 * MODULE: RAG (Retrieval-Augmented Generation) Core Engine Service
 * ============================================================================
 * High-level modular service interface for knowledge ingestion, vector storage,
 * hybrid retrieval, and question paper generation.
 * 
 * NOTE: Wraps existing RAG pipeline components without altering core logic.
 */

const { ingestPDF } = require('../../rag/ragPipeline');
const { generateQuestionPaper } = require('../../rag/qpGenerator');
const { retrieveRelevantChunks } = require('../../rag/retrievalService');
const vectorStore = require('../../rag/vectorStore');
const embedder = require('../../rag/embedder');
const hybridRetriever = require('../../rag/hybridRetriever');
const llmClient = require('../../rag/llmClient');
const bm25Store = require('../../rag/bm25Store');
const ingestionStatus = require('../../rag/ingestionStatus');
const pdfLoader = require('../../rag/pdfLoader');

class RagService {
  /**
   * Ingest a PDF document into the ChromaDB vector store
   */
  async ingestDocument(filePath, metadata) {
    return await ingestPDF(filePath, metadata);
  }

  /**
   * Orchestrate question paper generation for a subject & pattern
   */
  async generatePaper(payload) {
    return await generateQuestionPaper(payload);
  }

  /**
   * Retrieve relevant chunks using hybrid vector + BM25 search
   */
  async retrieveChunks(query, filter, limit = 5) {
    return await retrieveRelevantChunks(query, filter, limit);
  }

  /**
   * Get vector store stats
   */
  async getVectorStoreStats() {
    return await vectorStore.getStats();
  }

  /**
   * Delete documents by source
   */
  async deleteSourceDocuments(source) {
    return await vectorStore.deleteBySource(source);
  }
}

module.exports = {
  ragService: new RagService(),
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
