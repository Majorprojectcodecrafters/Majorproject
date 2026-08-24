const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { generateQuestionPaper } = require('../src/rag/qpGenerator');
const { exportQPToPDF } = require('../src/utils/pdfExporter');
const fs = require('fs');

async function runFullQpTest() {
  console.log('🧪 Testing Complete Question Paper Generation & PDF Parsing...');

  try {
    const physics = await prisma.subject.findFirst({ where: { name: 'Physics' } });
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });

    if (!physics || !class12) throw new Error('Physics subject or 12th Standard class missing');

    const chapters = await prisma.chapter.findMany({ where: { subjectId: physics.id } });

    console.log('1️⃣ Invoking RAG Question Generator (Board Pattern - 70 Marks)...');
    const result = await generateQuestionPaper({
      classId: class12.id,
      subjectId: physics.id,
      chapterIds: chapters.map(c => c.id),
      difficulty: 'MEDIUM',
      totalMarks: 70,
      durationMins: 180,
      instructions: 'Attempt all sections as per instructions.',
      patternMode: 'BOARD'
    });

    console.log(`  ✅ Total Generated Questions: ${result.questions?.length}`);

    // Print count per section
    const secA_MCQ = result.questions.filter(q => q.type === 'MCQ' || q.options?.length > 0);
    const secA_VSA = result.questions.filter(q => q.type === 'VERY_SHORT' || (Number(q.marks) === 1 && !q.options?.length));
    const secB = result.questions.filter(q => (q.type === 'SHORT' && Number(q.marks) === 2) || Number(q.marks) === 2);
    const secC = result.questions.filter(q => (q.type === 'SHORT' && Number(q.marks) === 3) || Number(q.marks) === 3);
    const secD = result.questions.filter(q => q.type === 'LONG' || Number(q.marks) >= 4 || (q.sectionName && q.sectionName.includes('Section D')));

    console.log(`  📊 Questions Breakdown by Section:`);
    console.log(`     - Section A (MCQs): ${secA_MCQ.length}`);
    console.log(`     - Section A (VSAs): ${secA_VSA.length}`);
    console.log(`     - Section B (2m):   ${secB.length}`);
    console.log(`     - Section C (3m):   ${secC.length}`);
    console.log(`     - Section D (4m):   ${secD.length}`);

    console.log('\n2️⃣ Exporting PDF (Student & Teacher Versions)...');
    const pdfBufferStudent = await exportQPToPDF(result, false);

    // Save PDF to temp folder to verify file size
    const testPdfPath = path.join(__dirname, 'test_output_student.pdf');
    fs.writeFileSync(testPdfPath, pdfBufferStudent);
    console.log(`  ✅ Student PDF exported successfully: ${pdfBufferStudent.length} bytes`);
    console.log(`  📄 Output saved to: ${testPdfPath}`);

    console.log('\n==================================================');
    console.log('🎉 SECTION D & PDF RENDERING VERIFICATION COMPLETE!');
    console.log(`   Section D Questions Found: ${secD.length > 0 ? 'YES ✅' : 'NO ❌'}`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runFullQpTest();
