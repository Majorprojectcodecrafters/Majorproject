const prisma = require('../src/config/prisma');

async function main() {
  const materials = await prisma.studyMaterial.findMany({
    include: { class: true, subject: true }
  });
  console.log('--- STUDY MATERIALS ---');
  materials.forEach(m => {
    console.log({
      id: m.id,
      title: m.title,
      fileName: m.fileName,
      category: m.category,
      driveFileId: m.driveFileId,
      fileUrl: m.fileUrl,
      class: m.class?.name,
      subject: m.subject?.name
    });
  });

  const sources = await prisma.knowledgeSource.findMany({
    include: { class: true, subject: true }
  });
  console.log('--- KNOWLEDGE SOURCES ---');
  sources.forEach(s => {
    console.log({
      id: s.id,
      title: s.title,
      fileName: s.fileName,
      sourceType: s.sourceType,
      driveFileId: s.driveFileId,
      filePath: s.filePath,
      class: s.class?.name,
      subject: s.subject?.name
    });
  });

  await prisma.$disconnect();
}

main().catch(console.error);
