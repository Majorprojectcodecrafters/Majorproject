const prisma = require('../src/config/prisma');

async function verifyTextbookMappings() {
  console.log('📚 Verifying StudyMaterial Textbook Mappings in Database...\n');

  const materials = await prisma.studyMaterial.findMany({
    include: {
      class: true,
      subject: true
    },
    orderBy: [
      { category: 'asc' },
      { title: 'asc' }
    ]
  });

  console.log(`Found ${materials.length} total StudyMaterial records:`);
  console.log('----------------------------------------------------');

  materials.forEach((m, idx) => {
    console.log(`${idx + 1}. [${m.category}] "${m.title}"`);
    console.log(`   - File Name: "${m.fileName}"`);
    console.log(`   - Class: "${m.class?.name || 'UNMAPPED'}" (ID: ${m.classId})`);
    console.log(`   - Subject: "${m.subject?.name || 'UNMAPPED'}" (ID: ${m.subjectId})`);
    console.log(`   - Drive File ID: "${m.driveFileId}"`);
    console.log('----------------------------------------------------');
  });

  await prisma.$disconnect();
}

verifyTextbookMappings();
