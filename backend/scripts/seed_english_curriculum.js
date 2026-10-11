const prisma = require('../src/config/prisma');

async function seedEnglishCurriculum() {
  console.log('🌱 Seeding MSBSHSE 11th & 12th Standard English Curriculum (Units, Chapters & Topics)...');

  const englishSubjects = await prisma.subject.findMany({
    where: { name: 'English' }
  });

  if (englishSubjects.length === 0) {
    console.log('⚠️ No English subjects found in database.');
    return;
  }

  // Class 12 & Class 11 Combined English Curriculum Units & Chapters
  const englishUnitsData = [
    // --- CLASS 12 UNITS ---
    {
      unitName: 'Class 12 - Section I (Prose)',
      order: 1,
      chapters: [
        { no: 1, name: "1.1 An Astrologer's Day", topics: ['Comprehension', 'Vocabulary', 'Language Study', 'Personal Response'] },
        { no: 2, name: '1.2 On Saying "Please"', topics: ['Theme Analysis', 'Moral & Courtesy', 'Language Study', 'Inference'] },
        { no: 3, name: '1.3 The Cop and the Anthem', topics: ['Irony & Plot', 'Character Analysis', 'Vocabulary', 'Personal Response'] },
        { no: 4, name: '1.4 Big Data-Big Insights', topics: ['Informative Prose', 'Analytical Questions', 'Language Study', 'Summary Writing'] },
        { no: 5, name: '1.5 The New Dress', topics: ['Stream of Consciousness', 'Character Psychology', 'Vocabulary', 'Personal Response'] },
        { no: 6, name: '1.6 Into the Wild', topics: ['Wildlife & Travelogue', 'Comprehension', 'Mind Mapping', 'Language Study'] },
        { no: 7, name: '1.7 Why We Travel', topics: ['Travel Philosophy', 'Comprehension', 'Vocabulary', 'Personal Response'] },
        { no: 8, name: '1.8 Voyage', topics: ['Narrative Prose', 'Comprehension', 'Language Study', 'Summary Writing'] }
      ]
    },
    {
      unitName: 'Class 12 - Section II (Poetry)',
      order: 2,
      chapters: [
        { no: 9, name: '2.1 Song of the Open Road', topics: ['Poetic Devices', 'Free Verse Theme', 'Poetic Appreciation', 'Creativity'] },
        { no: 10, name: '2.2 Indian Weavers', topics: ['Stages of Life', 'Imagery & Metaphor', 'Poetic Appreciation', 'Personal Response'] },
        { no: 11, name: '2.3 The Inchcape Rock', topics: ['Ballad & Morality', 'Rhyme Scheme', 'Poetic Appreciation', 'Creativity'] },
        { no: 12, name: '2.4 Have you Earned your Tomorrow', topics: ['Inspirational Theme', 'Figures of Speech', 'Poetic Appreciation', 'Personal Response'] },
        { no: 13, name: '2.5 Father Returning Home', topics: ['Alienation Theme', 'Imagery', 'Poetic Appreciation', 'Personal Response'] },
        { no: 14, name: '2.6 Money', topics: ['Materialism vs Happiness', 'Rhyme & Rhythm', 'Poetic Appreciation', 'Creativity'] },
        { no: 15, name: '2.7 She Walks in Beauty', topics: ['Romantic Lyric', 'Alliteration & Contrast', 'Poetic Appreciation', 'Personal Response'] },
        { no: 16, name: '2.8 Small Towns and Rivers', topics: ['Nature & Mortality', 'Free Verse', 'Poetic Appreciation', 'Creativity'] }
      ]
    },
    {
      unitName: 'Class 12 - Section III (Writing Skills)',
      order: 3,
      chapters: [
        { no: 17, name: '3.1 Summary Writing & Mind Mapping', topics: ['Title Selection', 'Key Points Extraction', 'Diagrammatic Mind Map', 'Visual Concept Map'] },
        { no: 18, name: '3.2 Virtual Message, SOP & Group Discussion', topics: ['Drafting Virtual Message', 'Statement of Purpose (SOP)', 'Group Discussion Format'] },
        { no: 19, name: '3.3 Email, Report Writing & Interview Questions', topics: ['Formal Email Writing', 'Event/News Report Writing', 'Framing 8-10 Interview Questions'] },
        { no: 20, name: '3.4 Speech Writing, Compering & Expansion of Ideas', topics: ['Drafting a Speech', 'Compering Script', 'Expansion of Proverb/Idea'] },
        { no: 21, name: '3.5 Film/Book Review, Blog Writing & Appeal', topics: ['Film/Book Review Format', 'Blog Writing', 'Social Appeal Writing'] }
      ]
    },
    {
      unitName: 'Class 12 - Section IV (Literary Genre - Novel)',
      order: 4,
      chapters: [
        { no: 22, name: '4.1 History of Novel', topics: ['Novella & Types of Novels', 'Elements of Novel', 'Chronological Development', 'Literary Terms'] },
        { no: 23, name: '4.2 To Sir, With Love (E.R. Braithwaite)', topics: ['Character Sketch of Braithwaite', 'Theme of Racial Discrimination', 'Setting & Plot', 'Half-Yearly Report Event'] },
        { no: 24, name: '4.3 Around the World in Eighty Days (Jules Verne)', topics: ['Phileas Fogg Character', 'Theme of Time & Adventure', 'Plot & Climax', 'Setting & Travel'] },
        { no: 25, name: '4.4 The Sign of Four (Arthur Conan Doyle)', topics: ['Sherlock Holmes & Dr Watson', 'Theme of Treasure & Betrayal', 'Plot & Mystery', 'Setting of Victorian London'] }
      ]
    },

    // --- CLASS 11 UNITS ---
    {
      unitName: 'Class 11 - Section I (Prose)',
      order: 5,
      chapters: [
        { no: 26, name: '1.1 Being Neighborly', topics: ['Comprehension', 'Character Analysis of Jo and Laurie', 'Personal Response', 'Language Study'] },
        { no: 27, name: '1.2 On To The Summit: We Reach The Top', topics: ['Mount Everest Expedition', 'Tenzing Norgay Journey', 'Vocabulary', 'Summary Writing'] },
        { no: 28, name: '1.3 The Call of the Soil', topics: ['Organic Farming', 'Kasbai Rice Search', 'Language Study', 'Personal Response'] },
        { no: 29, name: '1.4 Pillars of Democracy', topics: ['Social Democracy & Liberty', 'Dr. B.R. Ambedkar Speech', 'Comprehension', 'Mind Mapping'] },
        { no: 30, name: '1.5 Mrs. Adis', topics: ['Forgiveness Theme', 'Plot & Dialogue', 'Vocabulary', 'Personal Response'] },
        { no: 31, name: '1.6 Tiger Hills', topics: ['Kargil War Narrative', 'Patriotism & Courage', 'Comprehension', 'Language Study'] }
      ]
    },
    {
      unitName: 'Class 11 - Section II (Poetry)',
      order: 6,
      chapters: [
        { no: 32, name: '2.1 Cherry Tree', topics: ['Growth & Resilience', 'Poetic Appreciation', 'Figures of Speech', 'Creativity'] },
        { no: 33, name: '2.2 The Sower', topics: ['Dignity of Labor', 'Imagery & Rhyme', 'Poetic Appreciation', 'Personal Response'] },
        { no: 34, name: '2.3 There is another sky', topics: ['Sonnet Form', 'Optimism Theme', 'Poetic Appreciation', 'Creativity'] },
        { no: 35, name: '2.4 Upon Westminster Bridge', topics: ['Petrarchan Sonnet', 'London Morning Beauty', 'Poetic Appreciation', 'Personal Response'] },
        { no: 36, name: '2.5 Nose versus Eyes', topics: ['Satirical Poem', 'Legal Arguments Humour', 'Poetic Appreciation', 'Creativity'] },
        { no: 37, name: '2.6 The Planners', topics: ['Modernization & Loss of Past', 'Free Verse', 'Poetic Appreciation', 'Personal Response'] }
      ]
    },
    {
      unitName: 'Class 11 - Section III (Writing Skills)',
      order: 7,
      chapters: [
        { no: 38, name: '3.1 Expansion of Ideas (Class 11)', topics: ['Proverb Expansion', 'Paragraph Structuring', 'Illustrations'] },
        { no: 39, name: '3.2 Blog Writing (Class 11)', topics: ['Blog Layout', 'Catchy Titles', 'Digital Writing Format'] },
        { no: 40, name: '3.3 Email Writing (Class 11)', topics: ['Formal & Informal Emails', 'Subject Line & Sign-off'] },
        { no: 41, name: '3.4 Interview Questions (Class 11)', topics: ['Framing 8-10 Questions', 'Personalities Interview'] },
        { no: 42, name: '3.5 Film Review & Speech (Class 11)', topics: ['Movie Review Format', 'Speech Presentation'] }
      ]
    },
    {
      unitName: 'Class 11 - Section IV (Literary Genre - Drama)',
      order: 8,
      chapters: [
        { no: 43, name: '4.1 History of English Drama', topics: ['Elements of Drama', 'Types of Plays', 'Dramatic Devices', 'Historical Evolution'] },
        { no: 44, name: '4.2 The Rising of the Moon (Lady Gregory)', topics: ['Irish Freedom Movement', 'Character Analysis of Sergeant and Ragged Man', 'Plot & Climax', 'Theme of Duty vs Patriotism'] },
        { no: 45, name: '4.3 A Midsummer Night’s Dream (Shakespeare)', topics: ['Comic Plot & Magic', 'Lysander, Hermia, Helena, Demetrius', 'Puck & Oberon', 'Theme of Love & Illusion'] },
        { no: 46, name: '4.4 An Enemy of the People (Henrik Ibsen)', topics: ['Dr. Thomas Stockmann Character', 'Theme of Truth vs Majority', 'Plot & Conflict', 'Social Drama Elements'] }
      ]
    }
  ];

  for (const subject of englishSubjects) {
    console.log(`\n📌 Seeding English Curriculum for Subject ID: ${subject.id} (Stream: ${subject.streamId})...`);

    for (const uData of englishUnitsData) {
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

  console.log('\n✅ 11th & 12th Standard English Curriculum (8 Sections, 46 Chapters & Topics) successfully seeded across all English subjects!');
}

seedEnglishCurriculum()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
