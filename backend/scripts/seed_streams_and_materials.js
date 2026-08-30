const prisma = require('../src/config/prisma');

async function seedStreamsAndHierarchy() {
  console.log('🚀 Seeding Academic Hierarchy: Arts, Commerce, 11th & 12th Science...');

  // 1. Get Board
  let board = await prisma.board.findFirst({ where: { code: 'MSBSHSE' } });
  if (!board) {
    board = await prisma.board.create({
      data: { name: 'Maharashtra State Board', code: 'MSBSHSE' }
    });
  }

  // 2. Streams
  const streamNames = ['Science', 'Commerce', 'Arts'];
  const streamMap = {};
  for (const name of streamNames) {
    let stream = await prisma.stream.findFirst({ where: { name, boardId: board.id } });
    if (!stream) {
      stream = await prisma.stream.create({ data: { name, boardId: board.id } });
    }
    streamMap[name] = stream;
  }

  // 3. Classes for each stream
  const classConfigs = [
    { name: '11th Science', stream: 'Science' },
    { name: '12th Science', stream: 'Science' },
    { name: '11th Arts', stream: 'Arts' },
    { name: '12th Arts', stream: 'Arts' },
    { name: '11th Commerce', stream: 'Commerce' },
    { name: '12th Commerce', stream: 'Commerce' }
  ];

  const classMap = {};
  for (const cfg of classConfigs) {
    const stream = streamMap[cfg.stream];
    let cls = await prisma.class.findFirst({
      where: { name: cfg.name }
    });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          name: cfg.name,
          academicYear: '2026-2027',
          streamId: stream.id,
          boardId: board.id
        }
      });
    }
    classMap[cfg.name] = cls;
  }

  // Also maintain alias for "11th Standard" -> "11th Science" and "12th Standard" -> "12th Science"
  const std11 = await prisma.class.findFirst({ where: { name: '11th Standard' } });
  if (std11) classMap['11th Standard'] = std11;
  const std12 = await prisma.class.findFirst({ where: { name: '12th Standard' } });
  if (std12) classMap['12th Standard'] = std12;

  // 4. Subjects per Stream
  const subjectConfigs = [
    // Science
    { name: 'Physics', streams: ['Science'] },
    { name: 'Chemistry', streams: ['Science'] },
    { name: 'Mathematics & Statistics', streams: ['Science', 'Commerce'] },
    { name: 'Biology', streams: ['Science'] },
    { name: 'English', streams: ['Science', 'Arts', 'Commerce'] },

    // Arts
    { name: 'History', streams: ['Arts'] },
    { name: 'Political Science', streams: ['Arts'] },
    { name: 'Sociology', streams: ['Arts'] },
    { name: 'Economics', streams: ['Arts', 'Commerce'] },

    // Commerce
    { name: 'Book-keeping & Accountancy', streams: ['Commerce'] },
    { name: 'Organization of Commerce', streams: ['Commerce'] },
    { name: 'Secretarial Practice', streams: ['Commerce'] }
  ];

  const subjectMap = {};
  for (const cfg of subjectConfigs) {
    for (const stName of cfg.streams) {
      const stream = streamMap[stName];
      const key = `${cfg.name}_${stName}`;
      let sub = await prisma.subject.findFirst({
        where: { name: cfg.name, streamId: stream.id }
      });
      if (!sub) {
        sub = await prisma.subject.create({
          data: { name: cfg.name, streamId: stream.id }
        });
      }
      subjectMap[key] = sub;

      // Link subject to corresponding classes
      for (const [clsName, clsObj] of Object.entries(classMap)) {
        if (
          (stName === 'Science' && clsName.includes('Science')) ||
          (stName === 'Arts' && clsName.includes('Arts')) ||
          (stName === 'Commerce' && clsName.includes('Commerce')) ||
          (stName === 'Science' && (clsName === '11th Standard' || clsName === '12th Standard'))
        ) {
          const cs = await prisma.classSubject.findFirst({
            where: { classId: clsObj.id, subjectId: sub.id }
          });
          if (!cs) {
            await prisma.classSubject.create({
              data: { classId: clsObj.id, subjectId: sub.id }
            });
          }
        }
      }
    }
  }

  console.log('✅ Academic Classes & Stream-Scoped Subjects successfully linked in Database!');
}

seedStreamsAndHierarchy().catch(console.error).finally(() => prisma.$disconnect());
