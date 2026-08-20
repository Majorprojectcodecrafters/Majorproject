const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminExists = await prisma.user.findUnique({ where: { email: 'admin@school.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@school.com',
          password: hashedPassword,
          role: 'ADMIN',
          dob: new Date('1990-01-01')
        }
      });
      console.log('✅ Admin user created');
    } else {
      console.log('⏭️  Admin user already exists');
    }

    // Create teacher user
    const teacherExists = await prisma.user.findUnique({ where: { email: 'teacher@school.com' } });
    if (!teacherExists) {
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      const user = await prisma.user.create({
        data: {
          name: 'John Teacher',
          email: 'teacher@school.com',
          password: hashedPassword,
          role: 'TEACHER',
          dob: new Date('1985-05-15'),
          teacher: {
            create: {
              education: 'M.Sc Physics, B.Ed',
              experienceYears: 10
            }
          }
        }
      });
      console.log('✅ Teacher user created');
    } else {
      console.log('⏭️  Teacher user already exists');
    }

    // Create classes
    const classes = [
      { name: '11th Standard', description: 'Class 11th' },
      { name: '12th Standard', description: 'Class 12th' }
    ];

    for (const classData of classes) {
      const exists = await prisma.class.findFirst({
        where: { name: classData.name }
      });
      if (!exists) {
        await prisma.class.create({ data: classData });
      }
    }
    console.log('✅ Classes created/verified');

    // Create streams
    const class11 = await prisma.class.findFirst({ where: { name: '11th Standard' } });
    const streams = [
      { name: 'Science', classId: class11.id },
      { name: 'Commerce', classId: class11.id },
      { name: 'Arts', classId: class11.id }
    ];

    for (const streamData of streams) {
      const exists = await prisma.stream.findFirst({
        where: {
          name: streamData.name,
          classId: streamData.classId
        }
      });
      if (!exists) {
        await prisma.stream.create({ data: streamData });
      }
    }
    console.log('✅ Streams created/verified');

    // Create subjects
    const scienceStream = await prisma.stream.findFirst({ where: { name: 'Science' } });
    const subjects = [
      { name: 'Physics', code: 'PHY', classId: class11.id },
      { name: 'Chemistry', code: 'CHM', classId: class11.id },
      { name: 'Biology', code: 'BIO', classId: class11.id },
      { name: 'Mathematics', code: 'MAT', classId: class11.id }
    ];

    for (const subjectData of subjects) {
      const exists = await prisma.subject.findFirst({
        where: {
          code: subjectData.code,
          classId: subjectData.classId
        }
      });
      if (!exists) {
        await prisma.subject.create({ data: subjectData });
      }
    }
    console.log('✅ Subjects created/verified');

    // Create chapters
    const physics = await prisma.subject.findFirst({ where: { code: 'PHY' } });
    const chapters = [
      { name: 'Units and Measurements', subjectId: physics.id },
      { name: 'Motion in a Straight Line', subjectId: physics.id },
      { name: 'Motion in a Plane', subjectId: physics.id }
    ];

    for (const chapterData of chapters) {
      const exists = await prisma.chapter.findFirst({
        where: {
          name: chapterData.name,
          subjectId: chapterData.subjectId
        }
      });
      if (!exists) {
        await prisma.chapter.create({ data: chapterData });
      }
    }
    console.log('✅ Chapters created/verified');

    // Create sample questions
    const chapter1 = await prisma.chapter.findFirst({ where: { name: 'Units and Measurements' } });
    const sampleQuestions = [
      {
        questionText: 'What is the SI unit of length?',
        questionType: 'MCQ',
        marks: 1,
        difficulty: 'EASY',
        subjectId: physics.id,
        chapterId: chapter1.id,
        answerKey: 'Meter',
        options: ['Meter', 'Centimeter', 'Kilometer', 'Nanometer'],
        explanation: 'The SI unit of length is the meter (m).'
      },
      {
        questionText: 'Explain the concept of significant figures.',
        questionType: 'SHORT_ANSWER',
        marks: 3,
        difficulty: 'MEDIUM',
        subjectId: physics.id,
        chapterId: chapter1.id,
        answerKey: 'Significant figures are the digits in a number that carry meaningful information.',
        explanation: 'Significant figures represent the precision of a measurement.'
      }
    ];

    for (const questionData of sampleQuestions) {
      const exists = await prisma.question.findFirst({
        where: {
          questionText: questionData.questionText
        }
      });
      if (!exists) {
        await prisma.question.create({ data: questionData });
      }
    }
    console.log('✅ Sample questions created/verified');

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
