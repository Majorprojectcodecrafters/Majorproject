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
    BOARD_PATTERNS.mathematics
  ];
}

module.exports = {
  MAHARASHTRA_BOARD_NAME,
  PATTERN_VERSION,
  BOARD_PATTERNS,
  getBoardPatternForSubject,
  getAllBoardPatterns
};
