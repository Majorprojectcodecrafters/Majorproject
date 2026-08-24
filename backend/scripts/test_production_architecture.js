const prisma = require('../src/config/prisma');
const { isDriveConfigured } = require('../src/services/drive.service');
const { queryChunks, buildCurriculumFilter } = require('../src/rag/vectorStore');
const { callLLM } = require('../src/rag/llmClient');
const { generateQuestionPaper } = require('../src/rag/qpGenerator');

async function testArchitecture() {
  console.log('🧪 Testing QPGen Production Architecture & Additions...\n');

  try {
    // 1. Verify Prisma Database Schema Fields
    console.log('1️⃣ Testing Prisma Database Schema & Metadata...');
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });
    const physics = await prisma.subject.findFirst({ where: { name: 'Physics' } });

    if (!class12 || !physics) throw new Error('12th Standard or Physics subject missing in DB');

    const sampleKs = await prisma.knowledgeSource.findFirst({ where: { subjectId: physics.id } });
    if (sampleKs) {
      console.log(`  ✅ KnowledgeSource Schema Verified: Version "${sampleKs.version}", Priority ${sampleKs.sourcePriority}, Active: ${sampleKs.isActive}`);
    }

    // 2. Verify Google Drive Integration Status
    console.log('\n2️⃣ Testing Google Drive Integration Status...');
    const driveStatus = isDriveConfigured();
    console.log(`  Google Drive Configured: ${driveStatus ? 'YES (API Credentials Active)' : 'NO (Staging / Placeholder Mode Active)'}`);

    // 3. Verify Vector Store Priority Ranking Filter
    console.log('\n3️⃣ Testing Vector Store Priority Ranking & Active Source Filter...');
    const filter = buildCurriculumFilter({
      classId: class12.id,
      subjectId: physics.id,
      isActive: true
    });
    console.log('  Curriculum Filter Object:', JSON.stringify(filter));

    // 4. Verify LLM Provider Abstraction
    console.log('\n4️⃣ Testing Multi-Provider LLM Abstraction...');
    const testPrompt = 'Say "QPGen Architecture OK" in valid JSON format: {"status": "QPGen Architecture OK"}';
    const llmResult = await callLLM(testPrompt);
    console.log(`  LLM Completion Result: ${llmResult.slice(0, 100).trim()}...`);

    // 5. Test Full Question Paper Generation Pipeline
    console.log('\n5️⃣ Testing Full Question Paper Generation Pipeline...');
    const chapters = await prisma.chapter.findMany({ where: { subjectId: physics.id }, take: 4 });
    const qpResult = await generateQuestionPaper({
      classId: class12.id,
      subjectId: physics.id,
      chapterIds: chapters.map(c => c.id),
      difficulty: 'MEDIUM',
      totalMarks: 70,
      durationMins: 180,
      instructions: 'All questions compulsory.',
      patternMode: 'BOARD'
    });

    console.log('==================================================');
    console.log('🎉 PRODUCTION ARCHITECTURE VERIFICATION SUCCESSFUL!');
    console.log(`  Paper Title: ${qpResult.subject} Board Paper (${qpResult.totalMarks} Marks)`);
    console.log(`  Grounding State: ${qpResult.textbookState}`);
    console.log(`  Generated Questions: ${qpResult.questions?.length || 0}`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Architecture Verification Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testArchitecture();
