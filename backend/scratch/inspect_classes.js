const prisma = require('../src/config/prisma');

async function inspectClasses() {
  console.log('🔍 Inspecting Class records in database...');
  const classes = await prisma.class.findMany({
    orderBy: { name: 'asc' }
  });

  console.log(`Found ${classes.length} Class records:`);
  classes.forEach(c => {
    console.log(`- ID: ${c.id}`);
    console.log(`  Name: "${c.name}"`);
    console.log(`  Stream ID: ${c.streamId}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

inspectClasses();
