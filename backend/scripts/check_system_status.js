const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { getStats } = require('../src/rag/vectorStore');

async function checkStatus() {
  console.log('🔍 Checking Current System Ingestion & Storage Status...\n');

  try {
    // 1. PostgreSQL Knowledge Sources
    const knowledgeSources = await prisma.knowledgeSource.findMany({
      include: { class: true, subject: true, chapter: true }
    });

    console.log(`1️⃣ PostgreSQL KnowledgeSources: ${knowledgeSources.length} file(s) found.`);
    if (knowledgeSources.length > 0) {
      knowledgeSources.forEach((ks, i) => {
        console.log(`   [${i + 1}] Title: "${ks.title}" | Status: ${ks.status} | Drive ID: ${ks.driveFileId || 'N/A'} | Priority: ${ks.sourcePriority} | Subject: ${ks.subject?.name || 'N/A'}`);
      });
    }

    // 2. PostgreSQL Question Papers
    const questionPapers = await prisma.questionPaper.count();
    console.log(`\n2️⃣ PostgreSQL QuestionPapers: ${questionPapers} paper(s) found.`);

    // 3. ChromaDB Chunks
    console.log('\n3️⃣ ChromaDB Vector Store Chunks:');
    try {
      const chromaStats = await getStats();
      console.log(`   - Total Vector Chunks: ${chromaStats.totalChunks}`);
      console.log(`   - Collection Name: ${chromaStats.collection}`);
    } catch (e) {
      console.log(`   - Error reading ChromaDB stats: ${e.message}`);
    }

    console.log('\n==================================================');
    if (knowledgeSources.length === 0 && questionPapers === 0) {
      console.log('✨ System Status: CLEAN / READY (0 Files, 0 Papers, 0 Vector Chunks)');
    } else {
      console.log('📊 System Status: ACTIVE INGESTION DETECTED');
    }
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Check error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatus();
