const prisma = require('../src/config/prisma');
const { generateQuestionPaper } = require('../src/rag/qpGenerator');

async function testPipeline() {
  console.log('🧪 Testing Full Question Paper Generation Pipeline...\n');

  try {
    // 1. Fetch Class and Physics Subject
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });
    const physics = await prisma.subject.findFirst({ where: { name: 'Physics' } });

    if (!class12 || !physics) throw new Error('Class or Physics subject not found in DB');

    const chapters = await prisma.chapter.findMany({ where: { subjectId: physics.id } });
    console.log(`Found ${chapters.length} Physics chapters in DB.`);

    // 2. Generate Board Pattern Question Paper (70 Marks)
    console.log('📄 Generating 70 Marks Physics Board Paper...');
    const result = await generateQuestionPaper({
      classId: class12.id,
      subjectId: physics.id,
      chapterIds: chapters.map(c => c.id),
      difficulty: 'MEDIUM',
      totalMarks: 70,
      durationMins: 180,
      instructions: '1. All questions are compulsory. 2. Figures to the right indicate full marks.',
      patternMode: 'BOARD',
      board: 'Maharashtra State Board'
    });

    console.log('\n==================================================');
    console.log(`✅ QUESTION PAPER GENERATION SUCCESSFUL!`);
    console.log(`Title: ${result.paperTitle}`);
    console.log(`Total Marks: ${result.totalMarks} / ${result.targetTotalMarks}`);
    console.log(`Grounding State: ${result.textbookState}`);
    console.log(`Sections Generated: ${result.sections?.length || 0}`);
    console.log(`Total Questions: ${result.questions?.length || 0}`);
    console.log('==================================================\n');

    if (result.sections && result.sections.length > 0) {
      result.sections.forEach((sec, idx) => {
        console.log(`Section ${sec.sectionLetter}: ${sec.sectionTitle} (${sec.sectionMarks} Marks)`);
        console.log(`  Subsections/Questions: ${sec.questions?.length || 0}`);
      });
    }

    console.log('\n🎉 FULL QUESTION PAPER PIPELINE TEST PASSED PERFECTLY!');

  } catch (error) {
    console.error('❌ QP Generation error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPipeline();
