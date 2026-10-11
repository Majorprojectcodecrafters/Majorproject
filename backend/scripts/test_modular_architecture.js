const { RagModule, PdfModule, SyllabusModule, PatternModule } = require('../src/modules');

async function testModularArchitecture() {
  console.log('🏗️  Testing Deployment-Ready System Modular Architecture...\n');

  // 1. Test Pattern Module
  console.log('📌 Testing PatternModule...');
  const physicsPattern = PatternModule.patternsService.getPatternForSubject('Physics');
  const hindiPattern = PatternModule.patternsService.getPatternForSubject('Hindi');
  
  if (!physicsPattern || physicsPattern.totalMarks !== 70) {
    throw new Error('❌ PatternModule failed for Physics pattern!');
  }
  if (!hindiPattern || hindiPattern.totalMarks !== 80) {
    throw new Error('❌ PatternModule failed for Hindi pattern!');
  }

  const validation = PatternModule.patternsService.validatePaperPattern('Hindi', 80, 180);
  if (!validation.isValid) {
    throw new Error(`❌ PatternModule validation failed: ${validation.reason}`);
  }
  console.log('✅ PatternModule verified: Subject pattern lookup and validation working cleanly.\n');

  // 2. Test Syllabus Module
  console.log('📌 Testing SyllabusModule...');
  const scienceSubjects = await SyllabusModule.syllabusService.getSubjectsByStreamAndClass('Science');
  console.log(`   └─ Found ${scienceSubjects.length} subjects for Science stream.`);
  if (scienceSubjects.length === 0) {
    throw new Error('❌ SyllabusModule failed: No subjects returned for Science stream!');
  }
  console.log('✅ SyllabusModule verified: Streamwise curriculum querying working cleanly.\n');

  // 3. Test PDF Module
  console.log('📌 Testing PdfModule...');
  const fixture = PdfModule.pdfService.getRendererFixture();
  const renderedHtml = PdfModule.pdfService.renderQuestionHtml(fixture.questions[0]);
  if (!renderedHtml || typeof renderedHtml !== 'string') {
    throw new Error('❌ PdfModule failed: Structured question HTML rendering returned empty result!');
  }
  console.log('✅ PdfModule verified: Structured document HTML renderer working cleanly.\n');

  // 4. Test RAG Module
  console.log('📌 Testing RagModule...');
  if (!RagModule.ragService || typeof RagModule.generateQuestionPaper !== 'function') {
    throw new Error('❌ RagModule failed: RAG pipeline function exports missing!');
  }
  console.log('✅ RagModule verified: RAG pipeline & question generator exports available cleanly.\n');

  console.log('🎉 ALL SYSTEM MODULE CHECKS PASSED SUCCESSFULLY!');
}

testModularArchitecture().catch((err) => {
  console.error('\n❌ MODULAR TEST FAILED:', err);
  process.exit(1);
});
