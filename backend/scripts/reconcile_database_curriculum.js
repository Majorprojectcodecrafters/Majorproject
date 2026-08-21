const prisma = require('../src/config/prisma');

async function reconcileCurriculum() {
  console.log('🧹 Reconciling Database Curriculum Architecture...\n');

  const msbBoard = await prisma.board.findFirst({ where: { code: 'MSBSHSE' } });
  const scienceStream = await prisma.stream.findFirst({
    where: { name: 'Science', boardId: msbBoard.id }
  });

  if (!scienceStream) throw new Error('Science stream not found under MSBSHSE');

  const oldScienceStream = await prisma.stream.findFirst({
    where: { name: 'Science', boardId: null }
  });

  if (oldScienceStream) {
    console.log(`Re-linking subjects from old stream ${oldScienceStream.id} to new stream ${scienceStream.id}...`);

    const oldSubjects = await prisma.subject.findMany({ where: { streamId: oldScienceStream.id } });
    for (const oldSub of oldSubjects) {
      const newSub = await prisma.subject.findFirst({
        where: { name: { contains: oldSub.name.split(' ')[0] }, streamId: scienceStream.id }
      });

      if (newSub) {
        console.log(`Re-linking records from old subject "${oldSub.name}" (${oldSub.id}) to new subject "${newSub.name}" (${newSub.id})...`);
        
        await prisma.knowledgeSource.updateMany({
          where: { subjectId: oldSub.id },
          data: { subjectId: newSub.id, streamId: scienceStream.id, boardId: msbBoard.id }
        });

        await prisma.questionPaper.updateMany({
          where: { subjectId: oldSub.id },
          data: { subjectId: newSub.id }
        });

        const oldChapters = await prisma.chapter.findMany({ where: { subjectId: oldSub.id } });
        const oldChapterIds = oldChapters.map(c => c.id);

        if (oldChapterIds.length > 0) {
          const questionsInOldChapters = await prisma.question.findMany({
            where: { chapterId: { in: oldChapterIds } }
          });
          const qIds = questionsInOldChapters.map(q => q.id);
          if (qIds.length > 0) {
            await prisma.questionPaperQuestion.deleteMany({ where: { questionId: { in: qIds } } });
            await prisma.question.deleteMany({ where: { id: { in: qIds } } });
          }

          await prisma.topic.deleteMany({ where: { chapterId: { in: oldChapterIds } } });
          await prisma.chapterWeightage.deleteMany({ where: { subjectId: oldSub.id } });
          await prisma.chapter.deleteMany({ where: { subjectId: oldSub.id } });
        }

        await prisma.classSubject.deleteMany({ where: { subjectId: oldSub.id } });
        await prisma.subject.delete({ where: { id: oldSub.id } });
      } else {
        await prisma.subject.update({
          where: { id: oldSub.id },
          data: { streamId: scienceStream.id }
        });
      }
    }

    await prisma.stream.deleteMany({ where: { boardId: null } });
  }

  await prisma.knowledgeSource.updateMany({
    data: { boardId: msbBoard.id, streamId: scienceStream.id }
  });

  console.log('✅ Curriculum database reconciliation complete!\n');
  await prisma.$disconnect();
}

reconcileCurriculum();
