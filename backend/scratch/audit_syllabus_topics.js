const prisma = require('../src/config/prisma');

async function auditSyllabusTopics() {
  console.log('🔍 Auditing Syllabus Chapters and Topics Mapping in Database...\n');

  const subjects = await prisma.subject.findMany({
    where: {
      stream: { name: { contains: 'Science', mode: 'insensitive' } }
    },
    include: {
      chapters: {
        orderBy: { name: 'asc' },
        include: {
          topics: true
        }
      }
    }
  });

  let totalChapters = 0;
  let totalTopics = 0;
  let chaptersWithoutTopics = 0;

  subjects.forEach((sub) => {
    console.log(`====================================================`);
    console.log(`Subject: "${sub.name}" (ID: ${sub.id})`);
    console.log(`Total Chapters: ${sub.chapters.length}`);
    console.log(`====================================================`);

    sub.chapters.forEach((ch, idx) => {
      totalChapters++;
      totalTopics += ch.topics.length;
      if (ch.topics.length === 0) chaptersWithoutTopics++;

      console.log(`  ${idx + 1}. Chapter: "${ch.name}" (${ch.topics.length} topics)`);
      if (ch.topics.length > 0) {
        ch.topics.forEach(t => console.log(`     - Topic: "${t.name}"`));
      } else {
        console.log(`     ⚠️ NO TOPICS MAPPED!`);
      }
    });
    console.log('\n');
  });

  console.log('----------------------------------------------------');
  console.log(`SUMMARY: Total Chapters = ${totalChapters}, Total Topics = ${totalTopics}, Chapters Without Topics = ${chaptersWithoutTopics}`);
  console.log('----------------------------------------------------');

  await prisma.$disconnect();
}

auditSyllabusTopics();
