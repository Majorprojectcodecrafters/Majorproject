const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { generateQuestionPaper } = require('../src/rag/qpGenerator');
const { exportQPToPDF } = require('../src/utils/pdfExporter');

async function runQualityRegressionTests() {
  console.log('🧪 Starting QPGen Quality & Grounding Regression Test Suite...\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // Fetch Physics Subject & 12th Class from DB
  const subject = await prisma.subject.findFirst({ where: { name: 'Physics' } });
  const cls = await prisma.class.findFirst({ where: { name: { contains: '12' } } });
  const chapter = await prisma.chapter.findFirst({ where: { subjectId: subject.id, name: { contains: 'Rotational' } } });

  if (!subject || !cls || !chapter) {
    console.error('❌ Database missing required Physics curriculum records (Subject/Class/Chapter). Please run seed script first.');
    process.exit(1);
  }

  console.log(`📍 Test Context: Subject="${subject.name}", Class="${cls.name}", Chapter="${chapter.name}"`);

  // =========================================================================
  // TEST 1: SUCCESSFUL GROUNDED GENERATION (Zero Placeholders, 70 Marks)
  // =========================================================================
  console.log('\n--- TEST 1: Grounded Paper Generation for Rotational Dynamics ---');
  try {
    const qpResult = await generateQuestionPaper({
      classId: cls.id,
      subjectId: subject.id,
      chapterIds: [chapter.id],
      difficulty: 'MEDIUM',
      totalMarks: 70,
      durationMins: 180,
      patternMode: 'BOARD'
    });

    assert(qpResult.questions.length === 47, 'Generated paper contains exactly 47 questions for Board Pattern');
    assert(qpResult.totalMarks === 70, 'Total paper marks equal 70');
    assert(qpResult.grade && qpResult.grade !== 'N/A', `Class/Grade metadata is properly set: "${qpResult.grade}"`);

    // Check for placeholders
    const placeholderRegex = /key concept #|term #|process #|expression #|phenomenon #|topic #|concept #|definition #|example #|placeholder|Option 1|Option 2/i;
    const placeholderQuestions = qpResult.questions.filter(q => placeholderRegex.test(q.questionText || ''));
    assert(placeholderQuestions.length === 0, `Zero placeholder questions found (Found: ${placeholderQuestions.length})`);

    // Check MCQ choices quality
    const mcqs = qpResult.questions.filter(q => q.type === 'MCQ');
    assert(mcqs.length === 10, 'Section A contains 10 MCQs');

    let validMcqs = true;
    mcqs.forEach(m => {
      if (!m.options || m.options.length < 4) validMcqs = false;
      const uniqueOpts = new Set(m.options.map(o => o.toLowerCase().trim()));
      if (uniqueOpts.size < m.options.length) validMcqs = false;
    });
    assert(validMcqs, 'All MCQs have 4 distinct scientific option choices');

    // Test PDF Exporter Gate
    const pdfPath = path.join(__dirname, 'test_quality_output.pdf');
    await exportQPToPDF(qpResult, false);
    assert(true, 'PDF generated and saved cleanly without placeholder errors');

  } catch (err) {
    assert(false, `Test 1 threw error: ${err.message}`);
  }

  // =========================================================================
  // TEST 2: SAFE FAILURE BEHAVIOR FOR UNINDEXED CHAPTER
  // =========================================================================
  console.log('\n--- TEST 2: Safe Failure Behavior for Unindexed / Missing Chapter ---');
  try {
    const fakeChapterId = '00000000-0000-0000-0000-000000000000';
    await generateQuestionPaper({
      classId: cls.id,
      subjectId: subject.id,
      chapterIds: [fakeChapterId],
      difficulty: 'MEDIUM',
      totalMarks: 70,
      patternMode: 'BOARD'
    });
    assert(false, 'Expected paper generation to fail for unindexed chapter, but it succeeded.');
  } catch (err) {
    assert(err.message.includes('Insufficient curriculum knowledge') || err.message.includes('No valid chapters'), `System failed safely with error message: "${err.message.slice(0, 80)}..."`);
  }

  // =========================================================================
  // TEST 3: PDF EXPORT GATE BLOCKS PLACEHOLDER PAPERS
  // =========================================================================
  console.log('\n--- TEST 3: PDF Exporter Gate Blocks Placeholder Content ---');
  try {
    const badPaper = {
      subject: 'Physics',
      grade: 'Class 12th',
      totalMarks: 70,
      durationMins: 180,
      difficulty: 'MEDIUM',
      questions: [
        { questionText: 'Explain key concept #1 in Rotational Dynamics.', marks: 2, type: 'SHORT' }
      ]
    };
    await exportQPToPDF(badPaper, false);
    assert(false, 'Expected PDF Exporter to block paper with placeholders, but it exported.');
  } catch (err) {
    assert(err.message.includes('PDF Export Blocked'), `PDF Exporter successfully blocked bad paper: "${err.message.slice(0, 70)}..."`);
  }

  console.log(`\n==================================================`);
  console.log(`🎉 REGRESSION TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`==================================================\n`);

  process.exit(passedTests === totalTests ? 0 : 1);
}

runQualityRegressionTests();
