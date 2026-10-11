require('dotenv').config();
const prisma = require('../src/config/prisma');
const { generateQuestionPaper } = require('../src/rag/qpGenerator');

async function testEnglishQPGen() {
  console.log('🧪 Testing Maharashtra State Board 11th & 12th English Question Paper Generation...');

  const englishSubject = await prisma.subject.findFirst({
    where: { name: 'English' }
  });

  if (!englishSubject) {
    console.error('❌ English subject not found');
    process.exit(1);
  }

  const chapters = await prisma.chapter.findMany({
    where: { subjectId: englishSubject.id }
  });

  console.log(`Found English Subject ID: ${englishSubject.id} with ${chapters.length} total chapters.`);

  // Test 1: Class 12 English Generation
  console.log('\n--- 1. Testing Class 12 English Paper Generation ---');
  const paper12 = await generateQuestionPaper({
    subjectId: englishSubject.id,
    grade: 'Class 12th',
    chapterIds: chapters.filter(c => c.name.startsWith('1.') || c.name.startsWith('4.')).slice(0, 5).map(c => c.id),
    difficulty: 'MEDIUM',
    patternMode: 'BOARD'
  });

  console.log(`✅ Class 12 Paper Generated: Total Questions = ${paper12.questions.length}, Marks = ${paper12.totalMarks}`);

  // Test 2: Class 11 English Generation
  console.log('\n--- 2. Testing Class 11 English Paper Generation ---');
  const paper11 = await generateQuestionPaper({
    subjectId: englishSubject.id,
    grade: '11th Standard',
    chapterIds: chapters.filter(c => c.name.includes('Class 11') || c.chapterNo >= 26).slice(0, 5).map(c => c.id),
    difficulty: 'MEDIUM',
    patternMode: 'BOARD'
  });

  console.log(`✅ Class 11 Paper Generated: Total Questions = ${paper11.questions.length}, Marks = ${paper11.totalMarks}`);

  console.log('\n🎉 BOTH 11TH & 12TH ENGLISH QUESTION PAPERS GENERATED SUCCESSFULLY!');
  await prisma.$disconnect();
}

testEnglishQPGen().catch(console.error);
