const prisma = require('../src/config/prisma');

async function cleanDuplicateClasses() {
  console.log('🧹 Cleaning duplicate Class records from database...');

  const target11ScienceId = '80f1cd5f-98db-4719-b6b8-e713e4769e6e'; // 11th Science
  const target12ScienceId = '6d671424-98d9-41e5-b9a2-290f2023e5d5'; // 12th Science

  const dup11cId = 'test-class-11c';
  const dup11StdId = '061f8523-a533-489a-a560-bdbb0a00eceb';
  const dup12StdId = '91e0b6cc-2dbb-4073-81af-b677bfad5679';

  const dups11 = [dup11cId, dup11StdId];
  const dups12 = [dup12StdId];

  // Re-link child tables
  await prisma.student.updateMany({ where: { classId: { in: dups11 } }, data: { classId: target11ScienceId } });
  await prisma.student.updateMany({ where: { classId: { in: dups12 } }, data: { classId: target12ScienceId } });

  await prisma.studyMaterial.updateMany({ where: { classId: { in: dups11 } }, data: { classId: target11ScienceId } });
  await prisma.studyMaterial.updateMany({ where: { classId: { in: dups12 } }, data: { classId: target12ScienceId } });

  await prisma.quiz.updateMany({ where: { classId: { in: dups11 } }, data: { classId: target11ScienceId } });
  await prisma.quiz.updateMany({ where: { classId: { in: dups12 } }, data: { classId: target12ScienceId } });

  await prisma.teacherAssignment.updateMany({ where: { classId: { in: dups11 } }, data: { classId: target11ScienceId } });
  await prisma.teacherAssignment.updateMany({ where: { classId: { in: dups12 } }, data: { classId: target12ScienceId } });

  await prisma.announcement.updateMany({ where: { classId: { in: dups11 } }, data: { classId: target11ScienceId } });
  await prisma.announcement.updateMany({ where: { classId: { in: dups12 } }, data: { classId: target12ScienceId } });

  await prisma.classSubject.deleteMany({ where: { classId: { in: [...dups11, ...dups12] } } });
  await prisma.knowledgeSource.deleteMany({ where: { classId: { in: [...dups11, ...dups12] } } });
  await prisma.chapterWeightage.deleteMany({ where: { classId: { in: [...dups11, ...dups12] } } });
  await prisma.practiceChallenge.deleteMany({ where: { classId: { in: [...dups11, ...dups12] } } });

  // Delete duplicate class records
  await prisma.class.deleteMany({ where: { id: { in: [...dups11, ...dups12] } } });

  console.log('✅ Successfully cleaned duplicate classes!');

  const remaining = await prisma.class.findMany({ orderBy: { name: 'asc' } });
  console.log(`\nRemaining ${remaining.length} clean classes in DB:`);
  remaining.forEach(c => console.log(`- "${c.name}" (ID: ${c.id})`));

  await prisma.$disconnect();
}

cleanDuplicateClasses();
