const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { generateQuestionPaper } = require('../src/rag/qpGenerator');

async function testPayload() {
  console.log('🧪 Testing Frontend Generator Payload Execution...\n');

  try {
    const physics = await prisma.subject.findFirst({ where: { name: 'Physics' } });
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });

    if (!physics || !class12) throw new Error('Physics subject or 12th Standard class missing in DB');

    const chapters = await prisma.chapter.findMany({ where: { subjectId: physics.id } });

    console.log(`📌 Subject: ${physics.name} (ID: ${physics.id})`);
    console.log(`📌 Class: ${class12.name} (ID: ${class12.id})`);
    console.log(`📌 Chapters: ${chapters.length} chapter(s) found`);

    const result = await generateQuestionPaper({
      classId: class12.id,
      subjectId: physics.id,
      chapterIds: chapters.map(c => c.id),
      difficulty: 'MEDIUM',
      totalMarks: 70,
      durationMins: 180,
      instructions: 'All questions compulsory',
      patternMode: 'BOARD'
    });

    console.log('\n==================================================');
    console.log('✅ Payload test successful!');
    console.log(`   Title: ${result.subject} Board Paper`);
    console.log(`   Questions Generated: ${result.questions?.length}`);
    console.log(`   Validation Valid: ${result.validation?.valid}`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Payload Execution Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPayload();
