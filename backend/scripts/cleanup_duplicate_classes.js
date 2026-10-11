const prisma = require('../src/config/prisma');

async function cleanupDuplicateClasses() {
  console.log('--- STARTING DUPLICATE CLASS CLEANUP ---');

  // 1. Fetch all streams and board
  const streams = await prisma.stream.findMany();
  const board = await prisma.board.findFirst();

  const scienceStream = streams.find(s => s.name === 'Science');
  const commerceStream = streams.find(s => s.name === 'Commerce');
  const artsStream = streams.find(s => s.name === 'Arts');

  // 2. Ensure canonical classes exist:
  // "11th Science", "12th Science", "11th Commerce", "12th Commerce", "11th Arts", "12th Arts"
  const canonicalDefs = [
    { name: '11th Science', streamId: scienceStream?.id },
    { name: '12th Science', streamId: scienceStream?.id },
    { name: '11th Commerce', streamId: commerceStream?.id },
    { name: '12th Commerce', streamId: commerceStream?.id },
    { name: '11th Arts', streamId: artsStream?.id },
    { name: '12th Arts', streamId: artsStream?.id },
  ];

  const canonicalMap = {};

  for (const def of canonicalDefs) {
    let cls = await prisma.class.findFirst({
      where: {
        name: def.name,
        streamId: def.streamId,
      }
    });

    if (!cls) {
      console.log(`Creating missing canonical class: ${def.name}`);
      cls = await prisma.class.create({
        data: {
          name: def.name,
          academicYear: '2026-2027',
          streamId: def.streamId,
          boardId: board?.id,
        }
      });
    }

    canonicalMap[`${def.name}_${def.streamId}`] = cls;
  }

  // 3. Fetch all generic classes named "11th Standard" or "12th Standard"
  const genericClasses = await prisma.class.findMany({
    where: {
      name: { in: ['11th Standard', '12th Standard'] }
    },
    include: { stream: true }
  });

  console.log(`Found ${genericClasses.length} generic class records to consolidate.`);

  for (const genCls of genericClasses) {
    const is11th = genCls.name.includes('11th');
    const targetName = is11th
      ? (genCls.stream?.name === 'Commerce' ? '11th Commerce' : genCls.stream?.name === 'Arts' ? '11th Arts' : '11th Science')
      : (genCls.stream?.name === 'Commerce' ? '12th Commerce' : genCls.stream?.name === 'Arts' ? '12th Arts' : '12th Science');

    const targetCanonical = canonicalMap[`${targetName}_${genCls.streamId}`];

    if (!targetCanonical) {
      console.error(`Target canonical class not found for ${genCls.name} (Stream: ${genCls.stream?.name})`);
      continue;
    }

    console.log(`Migrating generic class ID ${genCls.id} (${genCls.name} - ${genCls.stream?.name}) -> Canonical ID ${targetCanonical.id} (${targetCanonical.name})`);

    // Re-link ClassSubject records
    const classSubjects = await prisma.classSubject.findMany({ where: { classId: genCls.id } });
    for (const cs of classSubjects) {
      const existingInTarget = await prisma.classSubject.findUnique({
        where: { classId_subjectId: { classId: targetCanonical.id, subjectId: cs.subjectId } }
      });
      if (!existingInTarget) {
        await prisma.classSubject.update({
          where: { id: cs.id },
          data: { classId: targetCanonical.id }
        });
      } else {
        await prisma.classSubject.delete({ where: { id: cs.id } });
      }
    }

    // Re-link Student records
    await prisma.student.updateMany({
      where: { classId: genCls.id },
      data: { classId: targetCanonical.id }
    });

    // Re-link KnowledgeSource records
    await prisma.knowledgeSource.updateMany({
      where: { classId: genCls.id },
      data: { classId: targetCanonical.id }
    });

    // Re-link ChapterWeightage records
    await prisma.chapterWeightage.updateMany({
      where: { classId: genCls.id },
      data: { classId: targetCanonical.id }
    });

    // Re-link TeacherAssignment records
    const teacherAssignments = await prisma.teacherAssignment.findMany({ where: { classId: genCls.id } });
    for (const ta of teacherAssignments) {
      const existingInTarget = await prisma.teacherAssignment.findUnique({
        where: { teacherId_classId_subjectId: { teacherId: ta.teacherId, classId: targetCanonical.id, subjectId: ta.subjectId } }
      });
      if (!existingInTarget) {
        await prisma.teacherAssignment.update({
          where: { id: ta.id },
          data: { classId: targetCanonical.id }
        });
      } else {
        await prisma.teacherAssignment.delete({ where: { id: ta.id } });
      }
    }

    // Re-link Quiz records
    await prisma.quiz.updateMany({
      where: { classId: genCls.id },
      data: { classId: targetCanonical.id }
    });

    // Re-link Announcement records
    await prisma.announcement.updateMany({
      where: { classId: genCls.id },
      data: { classId: targetCanonical.id }
    });

    // Re-link PracticeChallenge records
    await prisma.practiceChallenge.updateMany({
      where: { classId: genCls.id },
      data: { classId: targetCanonical.id }
    });

    // Re-link StudyMaterial records
    await prisma.studyMaterial.updateMany({
      where: { classId: genCls.id },
      data: { classId: targetCanonical.id }
    });

    // Finally delete generic class record
    await prisma.class.delete({ where: { id: genCls.id } });
  }

  console.log('--- CLEANUP COMPLETED SUCCESSFULLY ---');

  const finalClasses = await prisma.class.findMany({
    include: { stream: true, _count: { select: { classSubjects: true, students: true } } }
  });
  console.log('FINAL CLASSES IN DB:');
  finalClasses.forEach(c => {
    console.log(`- ${c.name} (${c.stream?.name}): Subjects=${c._count.classSubjects}, Students=${c._count.students}`);
  });

  await prisma.$disconnect();
}

cleanupDuplicateClasses().catch(err => {
  console.error('Error during cleanup:', err);
  prisma.$disconnect();
});
