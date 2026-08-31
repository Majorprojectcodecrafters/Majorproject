const { syncOfficialSyllabusTopics } = require('../src/services/syllabusMapperService');
const prisma = require('../src/config/prisma');

async function runSync() {
  console.log('🚀 Running Syllabus Topics Sync Script...');
  const result = await syncOfficialSyllabusTopics();

  console.log('\n📊 POST-SYNC TOPIC AUDIT BY SUBJECT:');
  const subjects = await prisma.subject.findMany({
    where: {
      stream: { name: { contains: 'Science', mode: 'insensitive' } }
    },
    include: {
      chapters: {
        include: { topics: true }
      }
    }
  });

  let grandTotalTopics = 0;
  subjects.forEach(sub => {
    let subTopics = 0;
    sub.chapters.forEach(c => subTopics += c.topics.length);
    grandTotalTopics += subTopics;
    console.log(`- ${sub.name}: ${sub.chapters.length} Chapters, ${subTopics} Topics Mapped ✅`);
  });

  console.log(`\n🎉 Grand Total Topics Mapped Across Science Curriculum: ${grandTotalTopics}`);

  await prisma.$disconnect();
}

runSync();
