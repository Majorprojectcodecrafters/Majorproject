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
      await prisma.user.create({
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
      { name: '11th Standard', academicYear: '2026-2027' },
      { name: '12th Standard', academicYear: '2026-2027' }
    ];

    for (const classData of classes) {
      const exists = await prisma.class.findFirst({
        where: { name: classData.name, academicYear: classData.academicYear }
      });
      if (!exists) {
        await prisma.class.create({ data: classData });
      }
    }
    console.log('✅ Classes created/verified');

    // Create streams
    const streamNames = ['Science', 'Commerce', 'Arts'];
    for (const name of streamNames) {
      const exists = await prisma.stream.findUnique({ where: { name } });
      if (!exists) {
        await prisma.stream.create({ data: { name } });
      }
    }
    console.log('✅ Streams created/verified');

    // Create subjects
    const scienceStream = await prisma.stream.findUnique({ where: { name: 'Science' } });
    const subjectNames = ['Physics', 'Chemistry', 'Biology', 'Mathematics'];

    for (const name of subjectNames) {
      const exists = await prisma.subject.findFirst({
        where: { name, streamId: scienceStream.id }
      });
      if (!exists) {
        await prisma.subject.create({
          data: { name, streamId: scienceStream.id }
        });
      }
    }
    console.log('✅ Subjects created/verified');

    // Create chapters
    const physics = await prisma.subject.findFirst({ where: { name: 'Physics', streamId: scienceStream.id } });
    const chapterNames = ['Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane'];

    for (const name of chapterNames) {
      const exists = await prisma.chapter.findFirst({
        where: { name, subjectId: physics.id }
      });
      if (!exists) {
        await prisma.chapter.create({
          data: { name, subjectId: physics.id }
        });
      }
    }
    console.log('✅ Chapters created/verified');

    // Create sample questions
    const chapter1 = await prisma.chapter.findFirst({ where: { name: 'Units and Measurements', subjectId: physics.id } });
    const sampleQuestions = [
      {
        questionText: 'What is the SI unit of length?',
        marks: 2,
        difficulty: 'EASY',
        chapterId: chapter1.id,
        answerKey: 'Meter',
        options: ['Meter', 'Centimeter', 'Kilometer', 'Nanometer']
      },
      {
        questionText: 'Explain the concept of significant figures.',
        marks: 5,
        difficulty: 'MEDIUM',
        chapterId: chapter1.id,
        answerKey: 'Significant figures are the digits in a number that carry meaningful information.'
      }
    ];

    for (const questionData of sampleQuestions) {
      const exists = await prisma.question.findFirst({
        where: { questionText: questionData.questionText }
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
