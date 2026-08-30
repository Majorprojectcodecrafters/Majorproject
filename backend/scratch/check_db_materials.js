const prisma = require('../src/config/prisma');

async function checkMaterials() {
  console.log('🔍 Checking prisma.studyMaterial records in DB...');
  const materials = await prisma.studyMaterial.findMany({
    take: 20,
    include: { class: true, subject: true }
  });

  console.log(`Found ${materials.length} study material records:`);
  materials.forEach(m => {
    console.log(`- ID: ${m.id}`);
    console.log(`  Title: ${m.title}`);
    console.log(`  File Name: ${m.fileName}`);
    console.log(`  File URL: ${m.fileUrl}`);
    console.log(`  Drive File ID: ${m.driveFileId}`);
    console.log(`  Class: ${m.class?.name}`);
    console.log(`  Subject: ${m.subject?.name}`);
    console.log(`  Category: ${m.category}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkMaterials();
