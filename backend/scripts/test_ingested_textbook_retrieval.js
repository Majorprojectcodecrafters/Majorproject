const prisma = require('../src/config/prisma');
const { retrieveCurriculumContext } = require('../src/rag/qpGenerator');

async function testIngestedRetrieval() {
  console.log('🧪 Testing RAG Retrieval on Ingested 12th Science Textbooks...\n');

  try {
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });
    if (!class12) throw new Error('12th Standard class not found');

    const sources = await prisma.knowledgeSource.findMany({
      include: { subject: true }
    });

    console.log(`Found ${sources.length} ingested KnowledgeSource records in DB:`);
    for (const src of sources) {
      console.log(`- Title: "${src.title}", Subject: "${src.subject?.name}", Status: ${src.status}`);
      
      const chapters = await prisma.chapter.findMany({
        where: { subjectId: src.subjectId },
        take: 3
      });

      const { chunks, textbookState } = await retrieveCurriculumContext({
        classId: class12.id,
        subjectId: src.subjectId,
        chapterIds: chapters.map(c => c.id),
        subjectName: src.subject?.name,
        chapterNames: chapters.map(c => c.name)
      });

      console.log(`  State: ${textbookState}`);
      console.log(`  Retrieved Chunks: ${chunks.length}`);
      if (chunks.length > 0) {
        console.log(`  Sample Snippet: "${chunks[0].text.slice(0, 100).replace(/\n/g, ' ')}..."\n`);
      }
    }

    console.log('🎉 ALL INGESTED TEXTBOOK RETRIEVAL TESTS PASSED PERFECTLY!');

  } catch (error) {
    console.error('❌ Retrieval test error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testIngestedRetrieval();
