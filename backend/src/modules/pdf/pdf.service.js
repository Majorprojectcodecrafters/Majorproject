/**
 * ============================================================================
 * MODULE: PDF & Document Generation Operations Service
 * ============================================================================
 * High-level modular service interface for exporting question papers to PDF,
 * student result PDF exports, Puppeteer browser pooling, and structured activity
 * sheet HTML rendering (tables, trees, flowcharts, mind maps, charts, OR blocks).
 */

const { exportQPToPDF, formatScientificText, clearPdfCache } = require('../../utils/pdfExporter');
const { exportResultToPDF } = require('../../utils/resultPdfExporter');
const {
  renderStructuredNode,
  renderQuestionWithStructuredContent,
  getStaticRendererFixture,
  formatUnicodeText
} = require('../../services/structuredDocumentRenderer');

class PdfService {
  /**
   * Export a question paper object to PDF buffer using Puppeteer
   */
  async generateQuestionPaperPdf(questionPaper, options = {}) {
    return await exportQPToPDF(questionPaper, options.showAnswers || false);
  }

  /**
   * Export student test result to PDF buffer
   */
  async generateResultPdf(testData, studentData) {
    return await exportResultToPDF(testData, studentData);
  }

  /**
   * Render question with structured content (tables, tree diagrams, flowcharts, mind maps, etc.)
   */
  renderQuestionHtml(question) {
    return renderQuestionWithStructuredContent(question);
  }

  /**
   * Render single structured node item
   */
  renderStructuredNode(structuredNode) {
    return renderStructuredNode(structuredNode);
  }

  /**
   * Get static renderer test fixture for offline visual validation
   */
  getRendererFixture() {
    return getStaticRendererFixture();
  }

  /**
   * Clear PDF export cache
   */
  clearCache(qpId) {
    return clearPdfCache(qpId);
  }
}

module.exports = {
  pdfService: new PdfService(),
  exportQPToPDF,
  exportResultToPDF,
  renderStructuredNode,
  renderQuestionWithStructuredContent,
  getStaticRendererFixture,
  formatScientificText,
  formatUnicodeText,
  clearPdfCache
};
