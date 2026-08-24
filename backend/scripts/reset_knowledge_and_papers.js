const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { ChromaClient } = require('chromadb');

async function resetKnowledgeAndPapers() {
  console.log('🧹 Purging Knowledge Base records and Generated Question Papers...\n');

  try {
    // 1. Purge PostgreSQL records
    console.log('1️⃣ Cleaning PostgreSQL Database Tables...');

    const deletedExamResults = await prisma.examResult.deleteMany({});
    console.log(`  - Deleted ${deletedExamResults.count} ExamResult records.`);

    const deletedQPQ = await prisma.questionPaperQuestion.deleteMany({});
    console.log(`  - Deleted ${deletedQPQ.count} QuestionPaperQuestion relation records.`);

    const deletedQPs = await prisma.questionPaper.deleteMany({});
    console.log(`  - Deleted ${deletedQPs.count} QuestionPaper records.`);

    const deletedQuestions = await prisma.question.deleteMany({});
    console.log(`  - Deleted ${deletedQuestions.count} Question records.`);

    const deletedKS = await prisma.knowledgeSource.deleteMany({});
    console.log(`  - Deleted ${deletedKS.count} KnowledgeSource records.`);

    // 2. Purge ChromaDB Vector Collection
    console.log('\n2️⃣ Resetting ChromaDB Vector Store...');
    const client = new ChromaClient({
      host: process.env.CHROMA_HOST || 'localhost',
      port: Number(process.env.CHROMA_PORT) || 8000,
      ssl: process.env.CHROMA_SSL === 'true'
    });

    const collectionName = 'syllabus_knowledge_base';
    try {
      await client.deleteCollection({ name: collectionName });
      console.log(`  - Deleted ChromaDB collection "${collectionName}".`);
    } catch (e) {
      console.log(`  - Collection "${collectionName}" did not exist or was already empty.`);
    }

    // Recreate fresh empty collection
    await client.getOrCreateCollection({
      name: collectionName,
      metadata: { description: 'Syllabus textbooks, notes, and question knowledge base' }
    });
    console.log(`  - Recreated fresh empty ChromaDB collection "${collectionName}".`);

    console.log('\n==================================================');
    console.log('✨ SYSTEM RESET COMPLETE!');
    console.log('   Knowledge Sources: 0');
    console.log('   Question Papers: 0');
    console.log('   ChromaDB Chunks: 0');
    console.log('   Curriculum & Weightage Data: Intact & Ready!');
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetKnowledgeAndPapers();
