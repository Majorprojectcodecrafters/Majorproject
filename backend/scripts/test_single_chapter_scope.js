const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { generateQuestionPaper } = require('../src/rag/qpGenerator');

async function testSingleChapter() {
  console.log('🧪 Testing Single Chapter Scope Enforcement...\n');

  try {
    const physics = await prisma.subject.findFirst({ where: { name: 'Physics' } });
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });

    if (!physics || !class12) throw new Error('Physics subject or 12th Standard class missing');

    const rotationalChapter = await prisma.chapter.findFirst({
      where: { subjectId: physics.id, name: { contains: 'Rotational', mode: 'insensitive' } }
    });

    const targetChapter = rotationalChapter || (await prisma.chapter.findFirst({ where: { subjectId: physics.id } }));

    console.log(`📌 Subject: ${physics.name}`);
    console.log(`📌 Target Selected Chapter: "${targetChapter.name}" (ID: ${targetChapter.id})\n`);

    const result = await generateQuestionPaper({
      classId: class12.id,
      subjectId: physics.id,
      chapterIds: [targetChapter.id],
      difficulty: 'MEDIUM',
      totalMarks: 70,
      durationMins: 180,
      instructions: 'Single chapter test exam',
      patternMode: 'BOARD'
    });

    console.log('\n==================================================');
    console.log(`🎉 GENERATION COMPLETE!`);
    console.log(`   Selected Chapter: ${targetChapter.name}`);
    console.log(`   Chapters In Result: ${result.chapters?.join(', ')}`);
    console.log(`   Total Questions: ${result.questions?.length}`);
    console.log('\n📋 Sample Generated Questions (Check Chapter Scope):');
    result.questions.slice(0, 5).forEach((q, i) => {
      console.log(`   [Q${i + 1} - ${q.type}] ${q.questionText}`);
    });
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSingleChapter();
