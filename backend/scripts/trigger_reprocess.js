const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/config/prisma');
const { downloadFileFromDrive } = require('../src/services/drive.service');
const { ingestPDF } = require('../src/rag/ragPipeline');
const { deleteBySourceId } = require('../src/rag/vectorStore');
const fs = require('fs');
const os = require('os');

async function runReprocess() {
  console.log('🔄 Triggering Knowledge Source Reprocessing from Google Drive...\n');

  const ks = await prisma.knowledgeSource.findFirst({
    where: { status: 'PROCESSING' },
    include: { subject: true, chapter: true }
  });

  if (!ks) {
    console.log('ℹ️ No KnowledgeSource in PROCESSING state found.');
    process.exit(0);
  }

  console.log(`📌 Found Pending File: "${ks.title}" (ID: ${ks.id})`);
  console.log(`   Drive File ID: ${ks.driveFileId}`);

  const tempPath = path.join(os.tmpdir(), `reprocess_${Date.now()}_${ks.fileName || 'textbook.pdf'}`);

  try {
    // 1. Download file stream from Google Drive
    console.log('1️⃣ Downloading PDF stream from Google Drive...');
    await downloadFileFromDrive(ks.driveFileId, tempPath);
    console.log('  ✅ Stream Downloaded to local temp buffer.');

    // 2. Clear old chunks if any
    await deleteBySourceId(ks.id);

    // 3. Re-ingest into ChromaDB
    console.log('\n2️⃣ Parsing PDF text, generating embeddings, and storing chunks in ChromaDB...');
    const result = await ingestPDF(tempPath, {
      knowledgeSourceId: ks.id,
      sourceType: ks.sourceType,
      boardId: ks.boardId || '',
      streamId: ks.streamId || '',
      classId: ks.classId || '',
      subjectId: ks.subjectId || '',
      subjectName: ks.subject?.name || '',
      unitId: ks.unitId || '',
      chapterId: ks.chapterId || '',
      chapterName: ks.chapter?.name || '',
      topicId: ks.topicId || '',
      version: ks.version || '1.0',
      academicYear: ks.academicYear || '',
      isActive: ks.isActive,
      sourcePriority: ks.sourcePriority
    });

    // 4. Update status to PROCESSED
    await prisma.knowledgeSource.update({
      where: { id: ks.id },
      data: { status: 'PROCESSED' }
    });

    console.log('\n==================================================');
    console.log(`🎉 REPROCESSING COMPLETE! Status: PROCESSED`);
    console.log(`   Total Chunks Ingested: ${result.totalChunks}`);
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Reprocessing failed:', error.message);
    await prisma.knowledgeSource.update({
      where: { id: ks.id },
      data: { status: 'FAILED' }
    });
  } finally {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (e) {}
    }
    await prisma.$disconnect();
  }
}

runReprocess();
