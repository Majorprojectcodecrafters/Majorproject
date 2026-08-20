require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { ingestPDF } = require('../src/rag/ragPipeline');
const { getStats } = require('../src/rag/vectorStore');
const prisma = require('../src/config/prisma');

const TEXTBOOK_DIR = path.join(process.cwd(), 'pdfs', 'textbooks');
const PYQ_DIR = path.join(process.cwd(), 'pdfs', 'pyq');

const GRADES = ['11th', '12th'];
const SUBJECTS = ['physics', 'chemistry', 'mathematics', 'biology'];

// Ensure all directories exist
function ensureDirectories() {
  [TEXTBOOK_DIR, PYQ_DIR].forEach(baseDir => {
    GRADES.forEach(grade => {
      SUBJECTS.forEach(subject => {
        const dir = path.join(baseDir, grade, subject);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });
    });
  });
  console.log('✅ Directory structure verified');
}

// Resolve metadata from folder structure + filename
async function resolveMetadata(fileName, type, grade, subjectFolder) {
  const nameWithoutExt = path.basename(fileName, '.pdf').toLowerCase();

  // Match subject from DB using folder name
  const subjects = await prisma.subject.findMany({ include: { chapters: true } });

  let matchedSubject = null;
  let matchedChapter = null;

  for (const subject of subjects) {
    if (subject.name.toLowerCase() === subjectFolder.toLowerCase() ||
        subject.name.toLowerCase().includes(subjectFolder.toLowerCase())) {
      matchedSubject = subject;

      // Only match chapter for PYQs using filename
      if (type === 'pyq') {
        for (const chapter of subject.chapters) {
          if (nameWithoutExt.includes(chapter.name.toLowerCase())) {
            matchedChapter = chapter;
            break;
          }
        }
      }
      break;
    }
  }

  return {
    subjectId: matchedSubject?.id || '',
    subjectName: matchedSubject?.name || '',
    chapterId: matchedChapter?.id || '',
    chapterName: matchedChapter?.name || '',
    grade
  };
}

// Ingest all PDFs from grade/subject subdirectories
async function ingestAll(baseDir, type) {
  const results = [];

  for (const grade of GRADES) {
    for (const subject of SUBJECTS) {
      const dirPath = path.join(baseDir, grade, subject);

      if (!fs.existsSync(dirPath)) continue;

      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf'));

      if (files.length === 0) {
        console.log(`⚠️  No PDFs in ${type}/${grade}/${subject}`);
        continue;
      }

      console.log(`\n📂 [${type}/${grade}/${subject}] Found ${files.length} PDF(s)`);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        console.log(`\n─────────────────────────────────`);
        console.log(`📄 Processing: ${file}`);

        try {
          const metadata = await resolveMetadata(file, type, grade, subject);

          if (metadata.subjectId) {
            console.log(`✅ Matched subject: ${metadata.subjectName} (${grade})`);
          } else {
            console.log(`⚠️  No subject match found in DB for: ${subject}`);
          }

          if (metadata.chapterId) {
            console.log(`✅ Matched chapter: ${metadata.chapterName}`);
          } else if (type === 'pyq') {
            console.log(`⚠️  No chapter match — ingesting without chapter tag`);
          }

          const result = await ingestPDF(filePath, { type, ...metadata });
          results.push({ ...result, type, grade, subject });
          console.log(`✅ Done: ${result.chunksIngested} chunks ingested`);

        } catch (error) {
          console.error(`❌ Failed: ${file} — ${error.message}`);
          results.push({ success: false, fileName: file, error: error.message });
        }
      }
    }
  }

  return results;
}

// Main
async function main() {
  console.log('🚀 Starting bulk PDF ingestion...\n');

  try {
    // Setup directories
    ensureDirectories();

    const before = await getStats();
    console.log(`\n📊 ChromaDB before: ${before.totalChunks} chunks`);

    // Ingest textbooks
    console.log('\n════════════════════════════════════');
    console.log('📚 INGESTING TEXTBOOKS');
    console.log('════════════════════════════════════');
    const textbookResults = await ingestAll(TEXTBOOK_DIR, 'textbook');

    // Ingest PYQs
    console.log('\n════════════════════════════════════');
    console.log('📝 INGESTING PYQ PAPERS');
    console.log('════════════════════════════════════');
    const pyqResults = await ingestAll(PYQ_DIR, 'pyq');

    const after = await getStats();
    console.log(`\n─────────────────────────────────`);
    console.log(`📊 ChromaDB after: ${after.totalChunks} chunks`);

    const allResults = [...textbookResults, ...pyqResults];
    const successful = allResults.filter(r => r.success);
    const failed = allResults.filter(r => !r.success);

    console.log(`\n✅ Successfully ingested: ${successful.length} PDFs`);
    console.log(`❌ Failed: ${failed.length} PDFs`);

    if (failed.length > 0) {
      console.log('\nFailed files:');
      failed.forEach(f => console.log(`  - ${f.fileName}: ${f.error}`));
    }

    console.log('\n🎉 Bulk ingestion complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();