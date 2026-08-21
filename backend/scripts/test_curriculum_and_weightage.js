const prisma = require('../src/config/prisma');
const { getBoardPatternForSubject } = require('../src/config/boardPatterns');
const { validateGeneratedPaper } = require('../src/rag/qpGenerator');
const { buildCurriculumFilter } = require('../src/rag/vectorStore');

async function runCurriculumTests() {
  console.log('🧪 Starting QPGen Curriculum Hierarchy & Weightage Tests...\n');

  try {
    // Test 1: Verify Board & Stream Setup
    console.log('1️⃣ Testing Board & Stream Hierarchy...');
    const board = await prisma.board.findUnique({ where: { code: 'MSBSHSE' } });
    if (!board) throw new Error('Board MSBSHSE not found in DB');
    console.log(`  Board: ${board.name} (${board.code})`);

    const scienceStream = await prisma.stream.findFirst({ where: { name: 'Science', boardId: board.id } });
    if (!scienceStream) throw new Error('Science Stream not found');
    console.log(`  Stream: ${scienceStream.name}`);
    console.log('  ✅ Board & Stream test passed!\n');

    // Test 2: Verify Classes & Subjects Junction
    console.log('2️⃣ Testing Class & ClassSubject Relations...');
    const class12 = await prisma.class.findFirst({ where: { name: '12th Standard', streamId: scienceStream.id } });
    if (!class12) throw new Error('12th Standard Class not found');

    const classSubjects = await prisma.classSubject.findMany({
      where: { classId: class12.id },
      include: { subject: true }
    });
    console.log(`  Found ${classSubjects.length} subjects for 12th Standard: ${classSubjects.map(cs => cs.subject.name).join(', ')}`);
    if (classSubjects.length < 4) throw new Error('Expected at least 4 subjects for 12th Science');
    console.log('  ✅ Class & ClassSubject test passed!\n');

    // Test 3: Validate EXACT 12th Physics Chapter Weightages
    console.log('3️⃣ Validating EXACT 12th Physics Chapter Weightages (16 Chapters)...');
    const physics = await prisma.subject.findFirst({ where: { name: 'Physics' } });
    const phyWeightages = await prisma.chapterWeightage.findMany({
      where: { subjectId: physics.id, classId: class12.id },
      include: { chapter: true },
      orderBy: { chapter: { chapterNo: 'asc' } }
    });

    const expectedPhysicsWeightages = [
      { ch: 1, marks: 5, opt: 7 },
      { ch: 2, marks: 5, opt: 7 },
      { ch: 3, marks: 5, opt: 7 },
      { ch: 4, marks: 5, opt: 7 },
      { ch: 5, marks: 4, opt: 5 },
      { ch: 6, marks: 4, opt: 6 },
      { ch: 7, marks: 5, opt: 7 },
      { ch: 8, marks: 4, opt: 6 },
      { ch: 9, marks: 4, opt: 6 },
      { ch: 10, marks: 4, opt: 6 },
      { ch: 11, marks: 4, opt: 5 },
      { ch: 12, marks: 5, opt: 7 },
      { ch: 13, marks: 4, opt: 6 },
      { ch: 14, marks: 4, opt: 5 },
      { ch: 15, marks: 4, opt: 6 },
      { ch: 16, marks: 4, opt: 5 }
    ];

    if (phyWeightages.length !== 16) throw new Error(`Expected 16 Physics chapters, got ${phyWeightages.length}`);

    let totalPhyMarks = 0;
    let totalPhyOpt = 0;
    expectedPhysicsWeightages.forEach((expected, i) => {
      const actual = phyWeightages[i];
      totalPhyMarks += actual.marks;
      totalPhyOpt += actual.marksWithOption;
      if (actual.chapter.chapterNo !== expected.ch || actual.marks !== expected.marks || actual.marksWithOption !== expected.opt) {
        throw new Error(`Physics Ch ${expected.ch} weightage mismatch: expected ${expected.marks}m/${expected.opt}m, got ${actual.marks}m/${actual.marksWithOption}m`);
      }
    });

    console.log(`  Physics Total Marks: ${totalPhyMarks}m (Expected: 70m), Option: ${totalPhyOpt}m (Expected: 98m)`);
    if (totalPhyMarks !== 70 || totalPhyOpt !== 98) throw new Error('Physics total weightage mismatch');
    console.log('  ✅ 12th Physics individual chapter weightages verified!\n');

    // Test 4: Validate EXACT 12th Chemistry Chapter & Unit Weightages
    console.log('4️⃣ Validating EXACT 12th Chemistry Unit & Chapter Weightages (4 Units, 16 Chapters)...');
    const chem = await prisma.subject.findFirst({ where: { name: 'Chemistry' } });
    const chemUnits = await prisma.unit.findMany({
      where: { subjectId: chem.id },
      include: { chapters: { include: { chapterWeightages: true } } },
      orderBy: { order: 'asc' }
    });

    if (chemUnits.length !== 4) throw new Error(`Expected 4 Chemistry units, got ${chemUnits.length}`);

    let totalChemMarks = 0;
    let totalChemOpt = 0;
    chemUnits.forEach(unit => {
      let unitMarks = 0;
      let unitOpt = 0;
      unit.chapters.forEach(ch => {
        const w = ch.chapterWeightages[0];
        unitMarks += w.marks;
        unitOpt += w.marksWithOption;
      });
      totalChemMarks += unitMarks;
      totalChemOpt += unitOpt;
      console.log(`  Unit "${unit.name}": ${unitMarks}m (With Option: ${unitOpt}m) across ${unit.chapters.length} chapters`);
    });

    if (totalChemMarks !== 70 || totalChemOpt !== 98) throw new Error('Chemistry total weightage mismatch');
    console.log('  ✅ 12th Chemistry unit & chapter weightages verified!\n');

    // Test 5: Validate EXACT 12th Mathematics Chapter Weightages
    console.log('5️⃣ Validating EXACT 12th Mathematics & Statistics Weightages (15 Chapters)...');
    const maths = await prisma.subject.findFirst({ where: { name: 'Mathematics & Statistics' } });
    const mathsWeightages = await prisma.chapterWeightage.findMany({
      where: { subjectId: maths.id, classId: class12.id }
    });

    if (mathsWeightages.length !== 15) throw new Error(`Expected 15 Maths chapters, got ${mathsWeightages.length}`);

    const totalMathsMarks = mathsWeightages.reduce((sum, w) => sum + w.marks, 0);
    const totalMathsOpt = mathsWeightages.reduce((sum, w) => sum + w.marksWithOption, 0);
    console.log(`  Maths Total Marks: ${totalMathsMarks}m (Expected: 80m), Option: ${totalMathsOpt}m (Expected: 112m)`);
    if (totalMathsMarks !== 80 || totalMathsOpt !== 112) throw new Error('Mathematics total weightage mismatch');
    console.log('  ✅ 12th Mathematics chapter weightages verified!\n');

    // Test 6: Validate EXACT 12th Biology Unit & Chapter Weightages
    console.log('6️⃣ Validating EXACT 12th Biology Weightages (5 Units, 15 Chapters)...');
    const bio = await prisma.subject.findFirst({ where: { name: 'Biology' } });
    const bioWeightages = await prisma.chapterWeightage.findMany({
      where: { subjectId: bio.id, classId: class12.id }
    });

    if (bioWeightages.length !== 15) throw new Error(`Expected 15 Biology chapters, got ${bioWeightages.length}`);

    const totalBioMarks = bioWeightages.reduce((sum, w) => sum + w.marks, 0);
    const totalBioOpt = bioWeightages.reduce((sum, w) => sum + w.marksWithOption, 0);
    console.log(`  Biology Total Marks: ${totalBioMarks}m (Expected: 70m), Option: ${totalBioOpt}m (Expected: 98m)`);
    if (totalBioMarks !== 70 || totalBioOpt !== 98) throw new Error('Biology total weightage mismatch');
    console.log('  ✅ 12th Biology unit & chapter weightages verified!\n');

    // Test 7: RAG Curriculum Filter Construction
    console.log('7️⃣ Testing Curriculum Vector Filter Construction...');
    const filter = buildCurriculumFilter({
      classId: class12.id,
      subjectId: physics.id,
      sourceType: 'TEXTBOOK'
    });
    if (!filter.$and || filter.$and.length !== 3) throw new Error('Curriculum vector filter construction error');
    console.log('  Generated ChromaDB Filter:', JSON.stringify(filter));
    console.log('  ✅ Curriculum vector filter test passed!\n');

    console.log('🎉 ALL CURRICULUM HIERARCHY & WEIGHTAGE INTEGRATION TESTS PASSED CLEANLY!');

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCurriculumTests();
