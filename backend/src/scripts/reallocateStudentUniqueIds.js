const prisma = require('../config/prisma');
const { generateStudentUniqueId } = require('../utils/studentUniqueIdGenerator');

async function reallocateAllStudentUniqueIds() {
  console.log('===========================================================');
  console.log('STARTING RE-ALLOCATION OF STUDENT INSTITUTIONAL UNIQUE IDS');
  console.log('Format: {academicYearShort}{classCode}{streamCode}{sequenceNumber}');
  console.log('Example: 252611010001');
  console.log('===========================================================\n');

  // Fetch all students in database ordered by creation date
  const students = await prisma.student.findMany({
    include: {
      user: true,
      class: true,
      stream: true
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${students.length} student records to process.`);

  let updatedCount = 0;
  for (const s of students) {
    const oldUniqueId = s.uniqueId;
    
    // Generate new standard uniqueId
    const newUniqueId = await generateStudentUniqueId({
      classId: s.classId,
      streamId: s.streamId
    });

    await prisma.student.update({
      where: { id: s.id },
      data: { uniqueId: newUniqueId }
    });

    updatedCount++;
    console.log(`[${updatedCount}/${students.length}] Student: "${s.user?.name}" (${s.user?.email})`);
    console.log(`   Class: "${s.class?.name || 'N/A'}" | Stream: "${s.stream?.name || 'N/A'}"`);
    console.log(`   Old ID: ${oldUniqueId} -> New Institutional ID: ${newUniqueId}\n`);
  }

  console.log('===========================================================');
  console.log(`RE-ALLOCATION COMPLETE! ${updatedCount} students updated in DB.`);
  console.log('===========================================================');
}

reallocateAllStudentUniqueIds()
  .catch((err) => {
    console.error('Failed to reallocate student unique IDs:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
