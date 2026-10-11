const prisma = require('../src/config/prisma');

async function seedHindiCurriculum() {
  console.log('🌱 Seeding MSBSHSE 11th & 12th Standard Hindi Curriculum & Subject Metadata...\n');

  // 1. Ensure Board exists
  let board = await prisma.board.findUnique({ where: { code: 'MSBSHSE' } });
  if (!board) {
    board = await prisma.board.create({
      data: {
        name: 'Maharashtra State Board',
        code: 'MSBSHSE'
      }
    });
    console.log('✅ Board MSBSHSE created/verified.');
  }

  // 2. Ensure Streams exist: Science, Commerce, Arts
  const streamNames = ['Science', 'Commerce', 'Arts'];
  const streamMap = {};
  for (const sName of streamNames) {
    let stream = await prisma.stream.findFirst({ where: { name: sName, boardId: board.id } });
    if (!stream) {
      stream = await prisma.stream.create({ data: { name: sName, boardId: board.id } });
    }
    streamMap[sName] = stream;
  }
  console.log('✅ Streams verified (Science, Commerce, Arts).');

  // 3. Ensure Classes (11th Standard, 12th Standard) for all streams
  const classMap = {};
  for (const [sName, stream] of Object.entries(streamMap)) {
    for (const className of ['11th Standard', '12th Standard']) {
      let cls = await prisma.class.findFirst({
        where: { name: className, academicYear: '2026-2027', streamId: stream.id }
      });
      if (!cls) {
        cls = await prisma.class.create({
          data: {
            name: className,
            academicYear: '2026-2027',
            streamId: stream.id,
            boardId: board.id
          }
        });
      }
      classMap[`${sName}_${className}`] = cls;
    }
  }
  console.log('✅ 11th & 12th Classes created/verified across Science, Commerce & Arts.');

  // 4. Create/Verify Hindi Subject (Subject Code: 04) for all 3 Streams
  const hindiSubjects = [];
  for (const [sName, stream] of Object.entries(streamMap)) {
    let hindi = await prisma.subject.findFirst({
      where: { name: 'Hindi', streamId: stream.id }
    });
    if (!hindi) {
      hindi = await prisma.subject.create({
        data: {
          name: 'Hindi',
          code: '04',
          streamId: stream.id
        }
      });
      console.log(`✅ Created Hindi subject for ${sName} stream (ID: ${hindi.id}).`);
    } else {
      console.log(`⏭️  Hindi subject already exists for ${sName} stream (ID: ${hindi.id}).`);
    }
    hindiSubjects.push(hindi);

    // Link ClassSubject relations for 11th and 12th
    const cls11 = classMap[`${sName}_11th Standard`];
    const cls12 = classMap[`${sName}_12th Standard`];

    if (cls11) {
      const cs11 = await prisma.classSubject.findFirst({
        where: { classId: cls11.id, subjectId: hindi.id }
      });
      if (!cs11) {
        await prisma.classSubject.create({ data: { classId: cls11.id, subjectId: hindi.id } });
      }
    }
    if (cls12) {
      const cs12 = await prisma.classSubject.findFirst({
        where: { classId: cls12.id, subjectId: hindi.id }
      });
      if (!cs12) {
        await prisma.classSubject.create({ data: { classId: cls12.id, subjectId: hindi.id } });
      }
    }
  }
  console.log('✅ ClassSubject relations linked for Hindi across all streams.');

  // 5. Defined Curriculum Data for Hindi (Class 12 & Class 11 Units & Chapters)
  const hindiUnitsData = [
    // --- CLASS 12 UNITS ---
    {
      unitName: 'कक्षा 12 - विभाग 1 (गद्य)',
      order: 1,
      chapters: [
        { no: 1, name: '1. नवनिर्माण (गद्य / निबंध)', topics: ['गद्यांश आकलन', 'शब्दावली', 'स्वमत अभिव्यक्ति', 'संजाल रेखांकन'] },
        { no: 2, name: '2. निराला भाई (संस्मरण)', topics: ['चरित्र चित्रण', 'साहित्यिक विशेषताएं', 'भाषा शैली', 'अभिव्यक्ति'] },
        { no: 3, name: '3. सच हम नहीं सच तुम नहीं', topics: ['प्रेरणादायी गद्य', 'जीवन दर्शन', 'संजाल गतिविधि', 'स्वमत लेखन'] },
        { no: 4, name: '4. आदर्श बदला (कहानी)', topics: ['पात्र परिचय', 'कथानक विश्लेषण', 'नैतिक मूल्य', 'शब्दावली'] }
      ]
    },
    {
      unitName: 'कक्षा 12 - विभाग 2 (पद्य)',
      order: 2,
      chapters: [
        { no: 5, name: '5. नवनिर्माण / कविता', topics: ['काव्य सौंदर्य', 'भावार्थ विश्लेषण', 'अलंकार व छंद', 'काव्य सृजन'] },
        { no: 6, name: '6. पेड़ होने का अर्थ (कविता)', topics: ['प्रकृति प्रेम', 'काव्य आस्वादन', 'प्रतीकात्मकता', 'अभिव्यक्ति'] },
        { no: 7, name: '7. सुनामी की विभीषिका (पद्य)', topics: ['आपदा प्रबंधन', 'काव्य बोध', 'रसास्वादन', 'स्वमत उत्तर'] }
      ]
    },
    {
      unitName: 'कक्षा 12 - विभाग 3 (विशेष अध्ययन)',
      order: 3,
      chapters: [
        { no: 8, name: '8. कनुप्रिया (धर्मवीर भारती - विशेष अध्ययन)', topics: ['राधा-कृष्ण प्रसंग', 'गीतिनाट्य विशेषताएं', 'पात्र विश्लेषण', 'समीक्षात्मक उत्तर'] }
      ]
    },
    {
      unitName: 'कक्षा 12 - विभाग 4 (व्यावहारिक हिंदी व शब्दावली)',
      order: 4,
      chapters: [
        { no: 9, name: '9. सूत्र संचालन एवं फिचर लेखन', topics: ['मंच संचालन कला', 'फिचर आलेखन', 'प्रारूप व नियम', 'व्यावहारिक कौशल'] },
        { no: 10, name: '10. पारिभाषिक शब्दावली', topics: ['प्रशासनिक शब्दावली', 'अंग्रेजी-हिंदी अनुवाद', 'तकनीकी शब्द संग्रह'] }
      ]
    },
    {
      unitName: 'कक्षा 12 - विभाग 5 (व्याकरण)',
      order: 5,
      chapters: [
        { no: 11, name: '11. काल, अलंकार, रस, मुहावरे व वाक्य शुद्धीकरण', topics: ['काल परिवर्तन', 'अलंकार भेद', 'रस सिद्धांत', 'मुहावरे प्रयोग', 'अशुद्धि शोधन'] }
      ]
    },

    // --- CLASS 11 UNITS ---
    {
      unitName: 'कक्षा 11 - विभाग 1 (गद्य)',
      order: 6,
      chapters: [
        { no: 12, name: '1. प्रेरणा (गद्य)', topics: ['विषय बोध', 'शब्दावली', 'स्वमत विचार', 'संजाल'] },
        { no: 13, name: '2. लघु कथाएँ', topics: ['कथानक', 'पात्र एवं संवाद', 'जीवन मूल्य'] }
      ]
    },
    {
      unitName: 'कक्षा 11 - विभाग 2 (पद्य)',
      order: 7,
      chapters: [
        { no: 14, name: '3. १५ अगस्त (कविता)', topics: ['देशभक्ति भाव', 'काव्य सौंदर्य', 'रसास्वादन'] },
        { no: 15, name: '4. भक्ति महिमा (मध्यकालीन काव्य)', topics: ['संत काव्यधारा', 'पद भावार्थ', 'भाषा सौंदर्य'] }
      ]
    },
    {
      unitName: 'कक्षा 11 - विभाग 3 (विशेष अध्ययन - नाटक / कथा)',
      order: 8,
      chapters: [
        { no: 16, name: '5. मौसम और परिदृश्य (विशेष अध्ययन)', topics: ['नाट्य रूपक', 'पात्र चित्रण', 'रंगमंचीय विशेषताएं'] }
      ]
    },
    {
      unitName: 'कक्षा 11 - विभाग 4 (व्यावहारिक हिंदी - कक्षा 11)',
      order: 9,
      chapters: [
        { no: 17, name: '6. पत्र लेखन व विज्ञापन आलेखन', topics: ['औपचारिक पत्र', 'विज्ञापन प्रारूप', 'जनसंचार माध्यम'] }
      ]
    },
    {
      unitName: 'कक्षा 11 - विभाग 5 (व्याकरण - कक्षा 11)',
      order: 10,
      chapters: [
        { no: 18, name: '7. शब्द भेद व वाक्य रचना', topics: ['पर्यायवाची व विलोम', 'वाक्य भेद', 'मुहावरे'] }
      ]
    }
  ];

  // Seed Units, Chapters, and Topics into DB for each Hindi Subject
  for (const subject of hindiSubjects) {
    console.log(`\n📌 Seeding Hindi Curriculum for Subject ID: ${subject.id}...`);

    for (const uData of hindiUnitsData) {
      let unit = await prisma.unit.findFirst({
        where: { name: uData.unitName, subjectId: subject.id }
      });
      if (!unit) {
        unit = await prisma.unit.create({
          data: { name: uData.unitName, order: uData.order, subjectId: subject.id }
        });
      }

      for (const cData of uData.chapters) {
        let chapter = await prisma.chapter.findFirst({
          where: { name: cData.name, subjectId: subject.id }
        });
        if (!chapter) {
          chapter = await prisma.chapter.create({
            data: {
              chapterNo: cData.no,
              name: cData.name,
              subjectId: subject.id,
              unitId: unit.id
            }
          });
        }

        for (const tName of cData.topics) {
          const tExists = await prisma.topic.findFirst({
            where: { name: tName, chapterId: chapter.id }
          });
          if (!tExists) {
            await prisma.topic.create({ data: { name: tName, chapterId: chapter.id } });
          }
        }
      }
    }
  }

  console.log('\n✨ MSBSHSE Hindi Subject & Curriculum Seeding Completed Successfully!');
}

if (require.main === module) {
  seedHindiCurriculum()
    .catch((e) => {
      console.error('❌ Error seeding Hindi curriculum:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedHindiCurriculum };
