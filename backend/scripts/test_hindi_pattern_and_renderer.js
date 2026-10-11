const path = require('path');
const fs = require('fs');
const { getBoardPatternForSubject } = require('../src/config/boardPatterns');
const { getStaticRendererFixture, renderQuestionWithStructuredContent } = require('../src/services/structuredDocumentRenderer');
const { exportQPToPDF } = require('../src/utils/pdfExporter');

async function testHindiPatternAndRenderer() {
  console.log('🧪 Testing Hindi Board Pattern Metadata & Generic Structured Renderer...\n');

  // 1. Verify Board Pattern Metadata
  const hindiPattern = getBoardPatternForSubject('Hindi');
  if (!hindiPattern) {
    throw new Error('❌ Hindi pattern not found in getBoardPatternForSubject()!');
  }
  console.log(`✅ Hindi pattern resolved: ID=${hindiPattern.id}, Subject=${hindiPattern.subjectName}, Marks=${hindiPattern.totalMarks}, Duration=${hindiPattern.durationMins}m`);
  
  if (hindiPattern.id !== 'MSBSHSE_HSC_HINDI_04') {
    throw new Error(`❌ Expected pattern ID MSBSHSE_HSC_HINDI_04, got ${hindiPattern.id}`);
  }
  if (hindiPattern.totalMarks !== 80) {
    throw new Error(`❌ Expected 80 total marks, got ${hindiPattern.totalMarks}`);
  }
  if (hindiPattern.durationMins !== 180) {
    throw new Error(`❌ Expected 180 mins duration, got ${hindiPattern.durationMins}`);
  }

  // Calculate section marks sum
  let sumSectionMarks = 0;
  hindiPattern.sections.forEach((sec, idx) => {
    sumSectionMarks += sec.attemptedSectionMarks;
    console.log(`   └─ Section ${idx + 1}: ${sec.sectionName} = ${sec.attemptedSectionMarks} Marks`);
  });
  console.log(`📊 Sum of Section Attempted Marks: ${sumSectionMarks} / ${hindiPattern.totalMarks}`);
  if (sumSectionMarks !== 80) {
    throw new Error(`❌ Hindi section marks sum is ${sumSectionMarks}, expected 80!`);
  }

  // 2. Test Non-Regression for existing subject patterns
  ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English'].forEach((sub) => {
    const pat = getBoardPatternForSubject(sub);
    if (!pat) {
      throw new Error(`❌ Non-regression failed: Pattern not found for ${sub}`);
    }
    console.log(`✅ Non-regression check passed for ${sub}: ID=${pat.id}, Marks=${pat.totalMarks}`);
  });

  // 3. Test Structured Document Renderer HTML rendering
  console.log('\n📄 Testing Structured Activity Sheet HTML Rendering...');
  const fixture = getStaticRendererFixture();
  let htmlRenderedCount = 0;
  fixture.questions.forEach((q) => {
    const html = renderQuestionWithStructuredContent(q);
    if (!html || typeof html !== 'string') {
      throw new Error(`❌ Structured HTML generation failed for question ${q.questionNumber}`);
    }
    htmlRenderedCount++;
  });
  console.log(`✅ Rendered structured HTML for ${htmlRenderedCount} test questions (Tables, Trees, Flowcharts, Mind Maps, Charts, OR Blocks, Answer Space Boxes).`);

  // 4. Test PDF Exporter using Puppeteer
  console.log('\n🖨️  Testing PDF Exporter with Devanagari Hindi Static Fixture...');
  const pdfBuffer = await exportQPToPDF(fixture);
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('❌ PDF export returned an empty buffer!');
  }
  
  const outputPdfPath = path.join(__dirname, 'test_hindi_static_preview.pdf');
  fs.writeFileSync(outputPdfPath, pdfBuffer);
  console.log(`✅ PDF export successful! File saved at: ${outputPdfPath} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

  console.log('\n🎉 ALL HINDI PATTERN & RENDERER TESTS PASSED SUCCESSFULLY!');
}

testHindiPatternAndRenderer().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
