const path = require('path');
const fs = require('fs');
const prisma = require('../src/config/prisma');
const { ingestPDF } = require('../src/rag/ragPipeline');

async function ingestUploadedTextbooks() {
  console.log('📚 Starting Batch Ingestion of Uploaded 12th Science Textbooks...\n');

  try {
    // 1. Fetch Board, Stream, Class and Subjects
    const board = await prisma.board.findUnique({ where: { code: 'MSBSHSE' } });
    const stream = await prisma.stream.findFirst({ where: { name: 'Science' } });
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });

    if (!class12 || !board || !stream) {
      throw new Error('Curriculum hierarchy (Board, Stream, Class) missing from database.');
    }

    const subjects = await prisma.subject.findMany({ where: { streamId: stream.id } });
    const subjectMap = {};
    subjects.forEach(s => {
      subjectMap[s.name.toLowerCase()] = s;
      if (s.name.includes('Physics')) subjectMap['physics'] = s;
      if (s.name.includes('Chemistry')) subjectMap['chemistry'] = s;
      if (s.name.includes('Mathematics')) subjectMap['mathematics'] = s;
      if (s.name.includes('Biology')) subjectMap['biology'] = s;
    });

    // Admin user for uploadedBy field
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const adminId = adminUser ? adminUser.id : 'system-ingest';

    // 2. Define Upload Directory
    const baseDir = path.join(process.cwd(), 'pdfs', 'textbooks', '12th', 'Science_stream');
    const folderMapping = [
      { folder: 'physics', subjectKey: 'physics', title: 'HSC 12th Physics Official Textbook' },
      { folder: 'chemistry', subjectKey: 'chemistry', title: 'HSC 12th Chemistry Official Textbook' },
      { folder: 'mathematics', subjectKey: 'mathematics', title: 'HSC 12th Mathematics & Statistics Textbook Part 1 & 2' },
      { folder: 'biology', subjectKey: 'biology', title: 'HSC 12th Biology Official Textbook' }
    ];

    let totalIngestedFiles = 0;
    let totalIngestedChunks = 0;

    for (const mapping of folderMapping) {
      const folderPath = path.join(baseDir, mapping.folder);
      if (!fs.existsSync(folderPath)) {
        console.log(`⚠️ Folder missing: ${folderPath}`);
        continue;
      }

      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.pdf'));
      const subject = subjectMap[mapping.subjectKey];

      if (!subject) {
        console.log(`⚠️ Subject not found for key: ${mapping.subjectKey}`);
        continue;
      }

      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        console.log(`\n==================================================`);
        console.log(`📖 Ingesting Subject: ${subject.name}`);
        console.log(`📄 File: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`==================================================`);

        // Check if already in DB
        let ks = await prisma.knowledgeSource.findFirst({
          where: { fileName: file, subjectId: subject.id }
        });

        if (!ks) {
          ks = await prisma.knowledgeSource.create({
            data: {
              title: `${subject.name} - ${file}`,
              sourceType: 'TEXTBOOK',
              fileName: file,
              filePath,
              fileSize: stats.size,
              status: 'PROCESSING',
              uploadedBy: adminId,
              boardId: board.id,
              streamId: stream.id,
              classId: class12.id,
              subjectId: subject.id
            }
          });
        }

        // Run PDF Ingestion into ChromaDB with curriculum metadata
        const result = await ingestPDF(filePath, {
          knowledgeSourceId: ks.id,
          sourceType: 'TEXTBOOK',
          boardId: board.id,
          streamId: stream.id,
          classId: class12.id,
          subjectId: subject.id,
          subjectName: subject.name,
          className: class12.name
        });

        // Update DB Status
        await prisma.knowledgeSource.update({
          where: { id: ks.id },
          data: { status: 'PROCESSED' }
        });

        totalIngestedFiles++;
        totalIngestedChunks += result.chunksIngested;
        console.log(`✅ Successfully ingested ${file}: ${result.chunksIngested} chunks created & stored in ChromaDB!`);
      }
    }

    console.log(`\n🎉 BATCH INGESTION COMPLETE!`);
    console.log(`  Total Files Ingested: ${totalIngestedFiles}`);
    console.log(`  Total Chunks Embedded: ${totalIngestedChunks}`);

  } catch (error) {
    console.error('❌ Batch ingestion error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

ingestUploadedTextbooks();
