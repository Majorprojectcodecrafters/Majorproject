/**
 * ============================================================================
 * QPGen Deployment-Ready System Modules Facade
 * ============================================================================
 * Central entry point uniting core decoupled system domain modules:
 * 1. RAG Core Engine Module (rag)
 * 2. PDF & Document Generation Module (pdf)
 * 3. Syllabus & Streamwise Curriculum Module (syllabus)
 * 4. Board Paper Pattern Management Module (patterns)
 * 
 * Provides unified access for application controllers, background workers, and
 * microservices without modifying underlying service implementation contracts.
 */

const RagModule = require('./rag');
const PdfModule = require('./pdf');
const SyllabusModule = require('./syllabus');
const PatternModule = require('./patterns');

module.exports = {
  RagModule,
  PdfModule,
  SyllabusModule,
  PatternModule
};
