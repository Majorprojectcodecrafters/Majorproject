const prisma = require('../src/config/prisma');

async function cleanupDeepDuplicates() {
  console.log('🧹 Deep Database Cleanup starting...\n');

  const boards = await prisma.board.findMany();
  console.log('--- ALL BOARDS ---');
  console.log(boards);

  const streams = await prisma.stream.findMany({ include: { board: true } });
  console.log('--- ALL STREAMS ---');
  console.log(streams);

  // Re-run seed.js after cleaning duplicate stream/board/subject/class records so seed creates clean 1:1 authoritative hierarchy
  await prisma.$disconnect();
}

cleanupDeepDuplicates();
