// Centralized single source of truth for official Maharashtra State Board Question Paper Patterns

const MAHARASHTRA_BOARD_NAME = 'Maharashtra State Board';
const PATTERN_VERSION = '2024 Reference Pattern';

// Science Standard 70-Mark Pattern (Physics, Chemistry, Biology)
const SCIENCE_70M_SECTIONS = [
  {
    sectionName: 'Section A',
    sectionOrder: 1,
    instructions: 'Question 1 contains 10 MCQs carrying 1 mark each. Question 2 contains 8 Very Short Answer questions carrying 1 mark each.',
    totalSectionMarks: 18,
    attemptedSectionMarks: 18,
    subSections: [
      {
        questionNumber: 'Q1',
        title: 'Multiple Choice Questions',
        questionType: 'MCQ',
        totalQuestions: 10,
        marksPerQuestion: 1,
        questionsToAttempt: 10,
        totalMarks: 10,
        isCompulsory: true,
        note: 'Only the first attempt will be considered for evaluation.'
      },
      {
        questionNumber: 'Q2',
        title: 'Very Short Answer Questions',
        questionType: 'VERY_SHORT',
        totalQuestions: 8,
        marksPerQuestion: 1,
        questionsToAttempt: 8,
        totalMarks: 8,
        isCompulsory: true
      }
    ]
  },
  {
    sectionName: 'Section B',
    sectionOrder: 2,
    questionNumberRange: 'Q3 to Q14',
    title: 'Short Answer Questions (Type 1)',
    questionType: 'SHORT',
    totalQuestions: 12,
    marksPerQuestion: 2,
    questionsToAttempt: 8,
    totalSectionMarks: 24,
    attemptedSectionMarks: 16,
    isCompulsory: false,
    instructions: 'Attempt any EIGHT questions from Q3 to Q14.'
  },
  {
    sectionName: 'Section C',
    sectionOrder: 3,
    questionNumberRange: 'Q15 to Q26',
    title: 'Short Answer Questions (Type 2)',
    questionType: 'SHORT',
    totalQuestions: 12,
    marksPerQuestion: 3,
    questionsToAttempt: 8,
    totalSectionMarks: 36,
    attemptedSectionMarks: 24,
    isCompulsory: false,
    instructions: 'Attempt any EIGHT questions from Q15 to Q26.'
  },
  {
    sectionName: 'Section D',
    sectionOrder: 4,
    questionNumberRange: 'Q27 to Q31',
    title: 'Long Answer Questions',
    questionType: 'LONG',
    totalQuestions: 5,
    marksPerQuestion: 4,
    questionsToAttempt: 3,
    totalSectionMarks: 20,
    attemptedSectionMarks: 12,
    isCompulsory: false,
    instructions: 'Attempt any THREE questions from Q27 to Q31.'
  }
];

// Mathematics & Statistics 80-Mark Pattern
const MATHS_80M_SECTIONS = [
  {
    sectionName: 'Section A',
    sectionOrder: 1,
    instructions: 'Question 1 contains 8 MCQs carrying 2 marks each. Question 2 contains 4 Very Short Answer questions carrying 1 mark each.',
    totalSectionMarks: 20,
    attemptedSectionMarks: 20,
    subSections: [
      {
        questionNumber: 'Q1',
        title: 'Multiple Choice Questions',
        questionType: 'MCQ',
        totalQuestions: 8,
        marksPerQuestion: 2,
        questionsToAttempt: 8,
        totalMarks: 16,
        isCompulsory: true
      },
      {
        questionNumber: 'Q2',
        title: 'Very Short Answer Questions',
        questionType: 'VERY_SHORT',
        totalQuestions: 4,
        marksPerQuestion: 1,
        questionsToAttempt: 4,
        totalMarks: 4,
        isCompulsory: true
      }
    ]
  },
  {
    sectionName: 'Section B',
    sectionOrder: 2,
    questionNumberRange: 'Q3 to Q14',
    title: 'Short Answer Questions (Type 1)',
    questionType: 'SHORT',
    totalQuestions: 12,
    marksPerQuestion: 2,
    questionsToAttempt: 8,
    totalSectionMarks: 24,
    attemptedSectionMarks: 16,
    isCompulsory: false,
    instructions: 'Attempt any EIGHT questions from Q3 to Q14.'
  },
  {
    sectionName: 'Section C',
    sectionOrder: 3,
    questionNumberRange: 'Q15 to Q26',
    title: 'Short Answer Questions (Type 2)',
    questionType: 'SHORT',
    totalQuestions: 12,
    marksPerQuestion: 3,
    questionsToAttempt: 8,
    totalSectionMarks: 36,
    attemptedSectionMarks: 24,
    isCompulsory: false,
    instructions: 'Attempt any EIGHT questions from Q15 to Q26.'
  },
  {
    sectionName: 'Section D',
    sectionOrder: 4,
    questionNumberRange: 'Q27 to Q34',
    title: 'Long Answer Questions',
    questionType: 'LONG',
    totalQuestions: 8,
    marksPerQuestion: 4,
    questionsToAttempt: 5,
    totalSectionMarks: 32,
    attemptedSectionMarks: 20,
    isCompulsory: false,
    instructions: 'Attempt any FIVE questions from Q27 to Q34.'
  }
];

// English HSC 80-Mark Pattern (MSBSHSE_HSC_ENGLISH_01)
const ENGLISH_80M_SECTIONS = [
  {
    sectionName: 'Section I (Prose)',
    sectionOrder: 1,
    instructions: 'Reading for Comprehension, Language Study, Summary, and Mind Mapping (34 Marks)',
    totalSectionMarks: 34,
    attemptedSectionMarks: 34,
    subSections: [
      {
        questionNumber: 'Q.1 (A)',
        title: 'Seen Prose Extract (Comprehension, Vocabulary & Personal Response)',
        questionType: 'SHORT',
        totalQuestions: 6,
        marksPerQuestion: 2,
        questionsToAttempt: 6,
        totalMarks: 12,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.1 (B)',
        title: 'Language Study (Non-Textual Grammar: B1 Transformation 3m, B2 Spot the Error 1m)',
        questionType: 'SHORT',
        totalQuestions: 2,
        marksPerQuestion: 2,
        questionsToAttempt: 2,
        totalMarks: 4,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.2 (A)',
        title: 'Unseen Prose Extract (Comprehension, Inference & Vocabulary)',
        questionType: 'SHORT',
        totalQuestions: 6,
        marksPerQuestion: 2,
        questionsToAttempt: 6,
        totalMarks: 12,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.2 (B)',
        title: 'Summary Writing (Summarise the unseen extract with a suitable title)',
        questionType: 'SHORT',
        totalQuestions: 1,
        marksPerQuestion: 3,
        questionsToAttempt: 1,
        totalMarks: 3,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.2 (C)',
        title: 'Mind Mapping (Develop a Mind Map/Concept Map using given ideas)',
        questionType: 'SHORT',
        totalQuestions: 1,
        marksPerQuestion: 3,
        questionsToAttempt: 1,
        totalMarks: 3,
        isCompulsory: true
      }
    ]
  },
  {
    sectionName: 'Section II (Poetry and Appreciation)',
    sectionOrder: 2,
    instructions: 'Poetry Extract Comprehension and Poetics/Appreciation (14 Marks)',
    totalSectionMarks: 14,
    attemptedSectionMarks: 14,
    subSections: [
      {
        questionNumber: 'Q.3 (A)',
        title: 'Poetry Extract (Global Comprehension, Inference, Personal Response, Poetic Devices & Creativity)',
        questionType: 'SHORT',
        totalQuestions: 5,
        marksPerQuestion: 2,
        questionsToAttempt: 5,
        totalMarks: 10,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.3 (B)',
        title: 'Poetic Appreciation (Appreciation of the given poem)',
        questionType: 'SHORT',
        totalQuestions: 1,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: true
      }
    ]
  },
  {
    sectionName: 'Section III (Writing Skills)',
    sectionOrder: 3,
    instructions: 'Attempt any ONE activity from each of the following groups A, B, C, D (16 Marks)',
    totalSectionMarks: 16,
    attemptedSectionMarks: 16,
    subSections: [
      {
        questionNumber: 'Q.4 (A)',
        title: 'Drafting Virtual Message / Statement of Purpose (SOP) / Group Discussion',
        questionType: 'LONG',
        totalQuestions: 3,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: false
      },
      {
        questionNumber: 'Q.4 (B)',
        title: 'Email Writing / Report Writing / Framing Interview Questions',
        questionType: 'LONG',
        totalQuestions: 3,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: false
      },
      {
        questionNumber: 'Q.4 (C)',
        title: 'Speech Writing / Compering / Expansion of Ideas',
        questionType: 'LONG',
        totalQuestions: 3,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: false
      },
      {
        questionNumber: 'Q.4 (D)',
        title: 'Film/Book Review / Blog Writing / Appeal Writing',
        questionType: 'LONG',
        totalQuestions: 3,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: false
      }
    ]
  },
  {
    sectionName: 'Section IV (Literary Genre - Novel / Drama)',
    sectionOrder: 4,
    instructions: 'Activities on Literary Genre - Novel / Drama (16 Marks)',
    totalSectionMarks: 16,
    attemptedSectionMarks: 16,
    subSections: [
      {
        questionNumber: 'Q.5 (A)',
        title: 'History of Literary Genre / Novel (Activities on MCQ / Match the Columns / Chronological Order / True or False)',
        questionType: 'SHORT',
        totalQuestions: 2,
        marksPerQuestion: 2,
        questionsToAttempt: 2,
        totalMarks: 4,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.5 (B)',
        title: 'Literary Genre / Novel / Drama 4.2 (Questions on Plot, Structure, Character, Theme, Language/Setting)',
        questionType: 'SHORT',
        totalQuestions: 2,
        marksPerQuestion: 2,
        questionsToAttempt: 2,
        totalMarks: 4,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.5 (C)',
        title: 'Literary Genre / Novel / Drama 4.3 (Questions on Plot, Structure, Character, Theme, Language/Setting)',
        questionType: 'SHORT',
        totalQuestions: 2,
        marksPerQuestion: 2,
        questionsToAttempt: 2,
        totalMarks: 4,
        isCompulsory: true
      },
      {
        questionNumber: 'Q.5 (D)',
        title: 'Literary Genre / Novel / Drama 4.4 (Questions on Plot, Structure, Character, Theme, Language/Setting)',
        questionType: 'SHORT',
        totalQuestions: 2,
        marksPerQuestion: 2,
        questionsToAttempt: 2,
        totalMarks: 4,
        isCompulsory: true
      }
    ]
  }
];

// Hindi HSC 80-Mark Pattern (MSBSHSE_HSC_HINDI_04)
const HINDI_80M_SECTIONS = [
  {
    sectionName: 'विभाग 1 — गद्य (Prose)',
    sectionOrder: 1,
    instructions: 'गद्य विभाग — कुल 20 अंक',
    totalSectionMarks: 20,
    attemptedSectionMarks: 20,
    subSections: [
      {
        questionNumber: 'प्र.1 (अ)',
        title: 'पठित गद्यांश 1 (संजाल / तालिका / संक्षेप व स्वमत)',
        questionType: 'SHORT',
        totalQuestions: 3,
        marksPerQuestion: 2,
        questionsToAttempt: 3,
        totalMarks: 6,
        isCompulsory: true
      },
      {
        questionNumber: 'प्र.1 (आ)',
        title: 'पठित गद्यांश 2 (संजाल / आकृति / शब्दावली व अभिव्यक्ति)',
        questionType: 'SHORT',
        totalQuestions: 3,
        marksPerQuestion: 2,
        questionsToAttempt: 3,
        totalMarks: 6,
        isCompulsory: true
      },
      {
        questionNumber: 'प्र.1 (इ)',
        title: 'व्यावहारिक / अपठित गद्यांश एवं उत्तर (4 में से 2 उत्तर लिखिए)',
        questionType: 'SHORT',
        totalQuestions: 4,
        marksPerQuestion: 3,
        questionsToAttempt: 2,
        totalMarks: 6,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.1 (ई)',
        title: 'एक वाक्यीय / वस्तुनिष्ठ प्रश्न / शब्दावली',
        questionType: 'VERY_SHORT',
        totalQuestions: 2,
        marksPerQuestion: 1,
        questionsToAttempt: 2,
        totalMarks: 2,
        isCompulsory: true
      }
    ]
  },
  {
    sectionName: 'विभाग 2 — पद्य (Poetry)',
    sectionOrder: 2,
    instructions: 'पद्य विभाग — कुल 20 अंक',
    totalSectionMarks: 20,
    attemptedSectionMarks: 20,
    subSections: [
      {
        questionNumber: 'प्र.2 (अ)',
        title: 'पठित पद्यांश 1 (भावार्थ / काव्य सौंदर्य / संजाल)',
        questionType: 'SHORT',
        totalQuestions: 3,
        marksPerQuestion: 2,
        questionsToAttempt: 3,
        totalMarks: 6,
        isCompulsory: true
      },
      {
        questionNumber: 'प्र.2 (आ)',
        title: 'पठित पद्यांश 2 (काव्य पंक्ति अर्थ / अभिव्यक्ति)',
        questionType: 'SHORT',
        totalQuestions: 3,
        marksPerQuestion: 2,
        questionsToAttempt: 3,
        totalMarks: 6,
        isCompulsory: true
      },
      {
        questionNumber: 'प्र.2 (इ)',
        title: 'रसास्वादन (दो में से किसी एक कविता का रसास्वादन लिखिए)',
        questionType: 'LONG',
        totalQuestions: 2,
        marksPerQuestion: 6,
        questionsToAttempt: 1,
        totalMarks: 6,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.2 (ई)',
        title: 'वस्तुनिष्ठ / एक वाक्यीय उत्तर प्रश्न',
        questionType: 'VERY_SHORT',
        totalQuestions: 2,
        marksPerQuestion: 1,
        questionsToAttempt: 2,
        totalMarks: 2,
        isCompulsory: true
      }
    ]
  },
  {
    sectionName: 'विभाग 3 — विशेष अध्ययन (Special Study)',
    sectionOrder: 3,
    instructions: 'विशेष अध्ययन विभाग — कुल 10 अंक',
    totalSectionMarks: 10,
    attemptedSectionMarks: 10,
    subSections: [
      {
        questionNumber: 'प्र.3 (अ)',
        title: 'विशेष अध्ययन पद्यांश / पाठ्यांश गतिविधि',
        questionType: 'SHORT',
        totalQuestions: 3,
        marksPerQuestion: 2,
        questionsToAttempt: 3,
        totalMarks: 6,
        isCompulsory: true
      },
      {
        questionNumber: 'प्र.3 (आ)',
        title: 'विशेष अध्ययन पर आधारित लघुउत्तरीय प्रश्न (दो में से एक उत्तर)',
        questionType: 'LONG',
        totalQuestions: 2,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: false
      }
    ]
  },
  {
    sectionName: 'विभाग 4 — व्यावहारिक हिंदी, अपठित गद्यांश एवं पारिभाषिक शब्दावली',
    sectionOrder: 4,
    instructions: 'व्यावहारिक हिंदी एवं शब्दावली — कुल 20 अंक',
    totalSectionMarks: 20,
    attemptedSectionMarks: 20,
    subSections: [
      {
        questionNumber: 'प्र.4 (अ)',
        title: 'दीर्घउत्तरीय प्रश्न (व्यावहारिक हिंदी विषय पर 2 में से 1 उत्तर)',
        questionType: 'LONG',
        totalQuestions: 2,
        marksPerQuestion: 6,
        questionsToAttempt: 1,
        totalMarks: 6,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.4 (आ)',
        title: 'व्यावहारिक हिंदी अथवा पारिभाषिक आरेख गतिविधि (2 में से 1 विकल्प)',
        questionType: 'LONG',
        totalQuestions: 2,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.4 (इ)',
        title: 'पारिभाषिक शब्दावली (अंग्रेजी शब्दों के हिंदी अर्थ — 8 में से 6)',
        questionType: 'VERY_SHORT',
        totalQuestions: 8,
        marksPerQuestion: 1,
        questionsToAttempt: 6,
        totalMarks: 6,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.4 (ई)',
        title: 'समीक्षा / प्रतिवेदन लेखन (2 में से 1)',
        questionType: 'LONG',
        totalQuestions: 2,
        marksPerQuestion: 4,
        questionsToAttempt: 1,
        totalMarks: 4,
        isCompulsory: false
      }
    ]
  },
  {
    sectionName: 'विभाग 5 — व्याकरण (Grammar)',
    sectionOrder: 5,
    instructions: 'व्याकरण विभाग — कुल 10 अंक (सभी अनिवार्य)',
    totalSectionMarks: 10,
    attemptedSectionMarks: 10,
    subSections: [
      {
        questionNumber: 'प्र.5 (अ)',
        title: 'काल परिवर्तन (4 में से 2 वाक्य बदलें)',
        questionType: 'VERY_SHORT',
        totalQuestions: 4,
        marksPerQuestion: 1,
        questionsToAttempt: 2,
        totalMarks: 2,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.5 (आ)',
        title: 'अलंकार पहचानिए (4 में से 2)',
        questionType: 'VERY_SHORT',
        totalQuestions: 4,
        marksPerQuestion: 1,
        questionsToAttempt: 2,
        totalMarks: 2,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.5 (इ)',
        title: 'रस पहचानिए (4 में से 2)',
        questionType: 'VERY_SHORT',
        totalQuestions: 4,
        marksPerQuestion: 1,
        questionsToAttempt: 2,
        totalMarks: 2,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.5 (ई)',
        title: 'मुहावरे (4 में से 2 मुहावरों का अर्थ एवं प्रयोग)',
        questionType: 'VERY_SHORT',
        totalQuestions: 4,
        marksPerQuestion: 1,
        questionsToAttempt: 2,
        totalMarks: 2,
        isCompulsory: false
      },
      {
        questionNumber: 'प्र.5 (उ)',
        title: 'वाक्य शुद्धीकरण (4 में से 2 वाक्य शुद्ध करके लिखिए)',
        questionType: 'VERY_SHORT',
        totalQuestions: 4,
        marksPerQuestion: 1,
        questionsToAttempt: 2,
        totalMarks: 2,
        isCompulsory: false
      }
    ]
  }
];

const BOARD_PATTERNS = {
  physics: {
    id: 'msbshse-physics-70m',
    board: MAHARASHTRA_BOARD_NAME,
    subjectName: 'Physics',
    patternVersion: PATTERN_VERSION,
    totalMarks: 70,
    durationMins: 180,
    sections: SCIENCE_70M_SECTIONS
  },
  chemistry: {
    id: 'msbshse-chemistry-70m',
    board: MAHARASHTRA_BOARD_NAME,
    subjectName: 'Chemistry',
    patternVersion: PATTERN_VERSION,
    totalMarks: 70,
    durationMins: 180,
    sections: SCIENCE_70M_SECTIONS
  },
  biology: {
    id: 'msbshse-biology-70m',
    board: MAHARASHTRA_BOARD_NAME,
    subjectName: 'Biology',
    patternVersion: PATTERN_VERSION,
    totalMarks: 70,
    durationMins: 180,
    sections: SCIENCE_70M_SECTIONS
  },
  mathematics: {
    id: 'msbshse-maths-80m',
    board: MAHARASHTRA_BOARD_NAME,
    subjectName: 'Mathematics',
    patternVersion: PATTERN_VERSION,
    totalMarks: 80,
    durationMins: 180,
    sections: MATHS_80M_SECTIONS
  },
  'mathematics & statistics': {
    id: 'msbshse-maths-80m',
    board: MAHARASHTRA_BOARD_NAME,
    subjectName: 'Mathematics & Statistics',
    patternVersion: PATTERN_VERSION,
    totalMarks: 80,
    durationMins: 180,
    sections: MATHS_80M_SECTIONS
  },
  english: {
    id: 'MSBSHSE_HSC_ENGLISH_01',
    board: MAHARASHTRA_BOARD_NAME,
    subjectName: 'English',
    patternVersion: PATTERN_VERSION,
    totalMarks: 80,
    durationMins: 180,
    sections: ENGLISH_80M_SECTIONS
  },
  hindi: {
    id: 'MSBSHSE_HSC_HINDI_04',
    board: MAHARASHTRA_BOARD_NAME,
    subjectName: 'Hindi',
    patternVersion: PATTERN_VERSION,
    totalMarks: 80,
    durationMins: 180,
    sections: HINDI_80M_SECTIONS
  }
};

function getBoardPatternForSubject(subjectName) {
  if (!subjectName) return null;
  const key = subjectName.trim().toLowerCase();
  
  if (BOARD_PATTERNS[key]) {
    return BOARD_PATTERNS[key];
  }

  // Partial match
  for (const [patternKey, pattern] of Object.entries(BOARD_PATTERNS)) {
    if (key.includes(patternKey) || patternKey.includes(key)) {
      return pattern;
    }
  }

  return null;
}

function getAllBoardPatterns() {
  return [
    BOARD_PATTERNS.physics,
    BOARD_PATTERNS.chemistry,
    BOARD_PATTERNS.biology,
    BOARD_PATTERNS.mathematics,
    BOARD_PATTERNS.english,
    BOARD_PATTERNS.hindi
  ];
}

module.exports = {
  MAHARASHTRA_BOARD_NAME,
  PATTERN_VERSION,
  BOARD_PATTERNS,
  HINDI_80M_SECTIONS,
  getBoardPatternForSubject,
  getAllBoardPatterns
};
