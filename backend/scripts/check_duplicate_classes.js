const prisma = require('../src/config/prisma');

async function checkDuplicates() {
  const classes = await prisma.class.findMany({
    include: { stream: true, board: true }
  });
  console.log('--- ALL CLASSES IN DB ---');
  classes.forEach(c => {
    console.log(`ID: ${c.id} | Name: "${c.name}" | Stream: "${c.stream?.name}" | Board: "${c.board?.name}"`);
  });

  await prisma.$disconnect();
}

checkDuplicates();
