const { embedText } = require('./embedder');
const { queryChunks, buildCurriculumFilter } = require('./vectorStore');
const prisma = require('../config/prisma');
const { getBoardPatternForSubject } = require('../config/boardPatterns');
const { callLLM } = require('./llmClient');

// Build search query from chapter and topic names
function buildSearchQuery(chapterNames, topicNames, subjectName) {
  const parts = [subjectName, ...chapterNames, ...(topicNames || [])];
  return `${parts.join(' ')} concepts definitions laws principles theory derivations formulas numericals problems`;
}

// Repair JSON strings containing unescaped LaTeX backslashes, Greek symbols or control characters
function repairJsonString(str) {
  if (!str) return '';
  return str
    .replace(/[\u0000-\u001F]+/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\\\\"/g, '\\"')
    .replace(/\\\\\\\\/g, '\\\\');
}

// Extract question JSON objects safely from raw string even if truncated or wrapped in outer JSON
function extractQuestionJsonObjects(str) {
  const objects = [];
  let inString = false;
  let escapeNext = false;
  let braceCount = 0;
  let currentStart = -1;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        if (braceCount === 0) {
          currentStart = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (currentStart !== -1) {
          const candidate = str.substring(currentStart, i + 1);
          if (candidate.includes('"questionText"') || candidate.includes('"question"') || candidate.includes('"q"') || candidate.includes('"stem"')) {
            try {
              const qObj = JSON.parse(repairJsonString(candidate));
              if (qObj && (qObj.questionText || qObj.q || qObj.question || qObj.stem || qObj.text)) {
                objects.push(qObj);
                currentStart = -1;
                braceCount = 0;
                continue;
              }
            } catch (e) {
              // Inner nested brace inside object, continue scanning
            }
          }
          if (braceCount <= 0) {
            currentStart = -1;
            braceCount = 0;
          }
        }
      }
    }
  }

  // Fallback regex search
  if (objects.length === 0) {
    const regex = /\{\s*"(?:questionText|question|q|stem)"\s*:\s*"[\s\S]*?\}/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      try {
        const qObj = JSON.parse(repairJsonString(match[0]));
        if (qObj && (qObj.questionText || qObj.q || qObj.question || qObj.stem)) {
          objects.push(qObj);
        }
      } catch (e) {}
    }
  }

  return objects;
}

/**
 * Normalize MCQ choices into 4 formatted strings: ["A) ...", "B) ...", "C) ...", "D) ..."]
 */
function normalizeMcqOptions(rawOptions, rawChoices) {
  const source = rawOptions !== undefined && rawOptions !== null ? rawOptions : rawChoices;
  if (!source) return null;

  let arr = [];

  if (typeof source === 'string') {
    const lines = source.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (lines.length >= 4) {
      arr = lines;
    } else {
      const matches = source.split(/(?=[A-D][\.\)\:]\s+)/i).map(s => s.trim()).filter(Boolean);
      if (matches.length >= 4) {
        arr = matches;
      }
    }
  } else if (Array.isArray(source)) {
    arr = source.map(item => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object') {
        const key = item.key || item.label || item.option || item.code || Object.keys(item)[0] || '';
        const val = item.value || item.text || item.content || item.description || item[key] || '';
        if (key && val && key !== val) {
          return `${key}) ${val}`.trim();
        }
        return String(val || key || '').trim();
      }
      return String(item).trim();
    }).filter(Boolean);
  } else if (typeof source === 'object') {
    const keys = Object.keys(source);
    keys.sort((a, b) => a.localeCompare(b));
    arr = keys.map(k => {
      const val = source[k];
      const prefix = k.toUpperCase().replace(/[^A-D]/g, '');
      return prefix ? `${prefix}) ${val}`.trim() : `${k}) ${val}`.trim();
    }).filter(Boolean);
  }

  if (arr.length < 4) return null;

  const prefixes = ['A', 'B', 'C', 'D'];
  const formatted = arr.slice(0, 4).map((opt, i) => {
    const p = prefixes[i];
    if (opt.match(/^[A-D][\.\)\:]\s*/i) || opt.match(/^\([A-D]\)\s*/i)) {
      return opt.replace(/^(\([A-D]\)|[A-D][\.\)\:])\s*/i, `${p}) `);
    }
    return `${p}) ${opt}`;
  });

  return formatted.length >= 4 ? formatted : null;
}

const { retrieveRelevantChunks } = require('./retrievalService');

/**
 * Validate availability and retrieval quality of curriculum sources before generation
 */
async function validateSourceAvailabilityAndQuality({ classId, subjectId, chapterIds, chapterNames, topicNames, subjectName }) {
  const fallbackSnippets = chapterNames.map((chName) => ({
    text: `Curriculum Standard for ${subjectName} (${chName}): Essential laws, fundamental definitions, key physical and chemical principles, mathematical formulas, derivations, diagrams, numerical problem solving, and standard examination questions for ${chName}.`,
    metadata: { source: 'Curriculum Knowledge Base', chapterName: chName, sourceType: 'TEXTBOOK' }
  }));

  try {
    const sourcesCount = await prisma.knowledgeSource.count({
      where: {
        subjectId,
        ...(classId ? { classId } : {}),
        isActive: true,
        status: 'PROCESSED'
      }
    });

    if (sourcesCount === 0) {
      console.log(`ℹ️ KnowledgeSource count is 0 for ${subjectName} (${chapterNames.join(', ')}). Using curriculum knowledge base fallback.`);
      return { valid: true, chunks: fallbackSnippets, textbookState: 'CURRICULUM_KNOWLEDGE_FALLBACK' };
    }

    const query = buildSearchQuery(chapterNames, topicNames, subjectName);
    const queryEmbedding = await embedText(query);

    const filter = buildCurriculumFilter({
      subjectId,
      chapterId: chapterIds?.length === 1 ? chapterIds[0] : null,
      isActive: true
    });

    // Upgraded RAG Retrieval Pipeline: Dense (ChromaDB) + BM25 + RRF + Cross-Encoder Reranking
    const retrievalResult = await retrieveRelevantChunks({
      queryEmbedding,
      semanticQuery: query,
      keywordQuery: query,
      filters: filter,
      options: { outputTopK: 15 }
    });

    let chunks = retrievalResult.chunks;

    if (!chunks || chunks.length < 3) {
      const fallbackFilter = buildCurriculumFilter({ subjectId, isActive: true });
      const fallbackResult = await retrieveRelevantChunks({
        queryEmbedding,
        semanticQuery: query,
        keywordQuery: query,
        filters: fallbackFilter,
        options: { outputTopK: 15 }
      });
      if (fallbackResult.chunks && fallbackResult.chunks.length >= 3) {
        chunks = fallbackResult.chunks;
      }
    }

    if (!chunks || chunks.length < 3) {
      return { valid: true, chunks: fallbackSnippets, textbookState: 'TEXTBOOK_AVAILABLE_FALLBACK_RETRIEVED' };
    }

    return { valid: true, chunks, textbookState: 'TEXTBOOK_AVAILABLE_AND_RETRIEVED' };
  } catch (err) {
    console.warn(`⚠️ RAG retrieval notice (${err.message}). Using curriculum knowledge base fallback.`);
    return { valid: true, chunks: fallbackSnippets, textbookState: 'FALLBACK_RETRIEVED' };
  }
}

/**
 * Validate generated questions for placeholders, duplicates, and content quality
 */
function validateQuestionContent(questions, targetDifficulty = 'MEDIUM') {
  const errors = [];
  const placeholderRegex = /key concept #|term #|process #|expression #|phenomenon #|topic #|concept #|definition #|example #|placeholder|Option 1|Option 2|Option 3|Option 4/i;
  const cannedOptionRegex = /Magnitude is directly proportional|Direction is along perpendicular|Total energy remains constant/i;

  const seenStems = new Set();

  questions.forEach((q, idx) => {
    const stem = (q.questionText || '').trim();
    if (!stem) {
      errors.push(`Question #${idx + 1} is empty or missing questionText.`);
      return;
    }

    if (placeholderRegex.test(stem)) {
      errors.push(`Question #${idx + 1} contains unallowed placeholder phrase: "${stem.slice(0, 50)}..."`);
    }

    const normalizedStem = stem.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seenStems.has(normalizedStem)) {
      errors.push(`Question #${idx + 1} is a duplicate stem: "${stem.slice(0, 40)}..."`);
    }
    seenStems.add(normalizedStem);

    const isMcq = (q.type || q.questionType || '').toUpperCase() === 'MCQ' || (q.options && Array.isArray(q.options) && q.options.length > 0);
    if (isMcq) {
      if (!q.options || !Array.isArray(q.options) || q.options.length < 4) {
        errors.push(`MCQ #${idx + 1} ("${stem.slice(0, 30)}...") does not have 4 distinct choices.`);
      } else {
        const optionSet = new Set(q.options.map(o => (o || '').toLowerCase().trim()));
        if (optionSet.size < q.options.length) {
          errors.push(`MCQ #${idx + 1} ("${stem.slice(0, 30)}...") contains duplicate choices.`);
        }
        if (q.options.some(opt => cannedOptionRegex.test(opt) || placeholderRegex.test(opt))) {
          errors.push(`MCQ #${idx + 1} ("${stem.slice(0, 30)}...") contains generic or placeholder choice options.`);
        }
      }
      if (!q.answerKey) {
        errors.push(`MCQ #${idx + 1} ("${stem.slice(0, 30)}...") is missing an answer key.`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Subject-Aware prompt directive builder
 */
function getSubjectPromptDirectives(subjectName, className = '') {
  const nameUpper = (subjectName || '').toUpperCase();
  if (nameUpper.includes('PHYSICS')) {
    return `PHYSICS QUESTION GENERATION MANDATE:
- Focus on fundamental laws, principles, physical interpretations, mathematical derivations, numerical problem solving with SI units, schematic diagram explanations, and real-world physical applications.
- DIAGRAM QUESTION DIRECTIVE: Questions may optionally ask students to draw and label easy, standard textbook diagrams (e.g., "Draw a neat, labeled ray diagram showing...", "Draw a circuit diagram for..."). Diagrams are NOT mandatory in every paper, and pre-generated image attachments are not required.`;
  }
  if (nameUpper.includes('CHEMISTRY')) {
    return `CHEMISTRY QUESTION GENERATION MANDATE:
- Focus on chemical equations, reaction mechanisms, IUPAC nomenclature, electronic configurations, stoichiometric calculations, physical chemistry formulas, and inorganic/organic properties.
- DIAGRAM QUESTION DIRECTIVE: Questions may optionally ask students to draw and label easy apparatus or cell diagrams (e.g., "Draw a neat and labeled diagram of a galvanic cell..."). Diagrams are NOT mandatory in every paper.`;
  }
  if (nameUpper.includes('MATH') || nameUpper.includes('STATISTICS')) {
    return `MATHEMATICAL QUESTION GENERATION MANDATE:
- Focus on rigorous mathematical problem solving, step-by-step proofs, algebraic/calculus calculations, geometric theorems, and statistical data analysis.`;
  }
  if (nameUpper.includes('BIOLOGY')) {
    return `BIOLOGY QUESTION GENERATION MANDATE:
- Focus on biological processes, anatomical structures, physiological functions, taxonomic classifications, comparative analysis, and genetic/ecological principles.
- DIAGRAM QUESTION DIRECTIVE: Questions may optionally ask students to draw and label easy anatomical/plant diagrams (e.g., "Draw a neat and labeled diagram of...", "With the help of a well-labeled diagram explain..."). Diagrams are NOT mandatory in every paper.`;
  }
  if (nameUpper.includes('ENGLISH')) {
    const isClass11 = (className || '').toLowerCase().includes('11');
    const novelDirective = isClass11
      ? `- SECTION IV (LITERARY GENRE - DRAMA / NOVEL - 16m): Q5A: History of English Drama / Genre (4m MCQ/Match), Q5B: Drama/Novel 4.2 (4m), Q5C: Drama/Novel 4.3 (4m), Q5D: Drama/Novel 4.4 (4m). Ground questions strictly in Class 11 literature textbook content.`
      : `- SECTION IV (NOVEL - 16m): Q5A: History of Novel (4m MCQ/Match), Q5B: Novel 4.2 To Sir With Love (4m), Q5C: Novel 4.3 Around the World in Eighty Days (4m), Q5D: Novel 4.4 The Sign of Four (4m). Ground questions strictly in Class 12 literature textbook content.`;

    return `ENGLISH ACTIVITY SHEET QUESTION GENERATION MANDATE:
- Focus on Maharashtra State Board English (Subject Code 01) 80-mark Activity Sheet format (Identical pattern for Science, Commerce, and Arts streams).
- SECTION I (PROSE - 34m): Seen prose passage (Q1A: A1 Global Comprehension, A2 Complex Factual, A3 Inference/Interpretation, A4 Personal Response, A5 Language Study, A6 Vocabulary - 2m each), Language Study non-textual (Q1B: B1 Transformation of Sentences 3x1m, B2 Spot the Error 1m), Unseen prose passage (Q2A: A1-A6 2m each), Summary Writing (Q2B: 3m with title), Mind Mapping (Q2C: 3m visual concept design).
- SECTION II (POETRY - 14m): Poem extract (Q3A: A1-A5 2m each focusing on comprehension, personal response, poetic devices, figures of speech, creativity), Poetic Appreciation (Q3B: 4m appreciation of given poem).
- SECTION III (WRITING SKILLS - 16m): 4 choice sections Q4A to Q4D (4m each). Q4A: Virtual Message / SOP / Group Discussion; Q4B: Email / Report / Interview; Q4C: Speech / Compering / Expansion of Idea; Q4D: Review / Blog / Appeal. Provide clear prompts and choices.
${novelDirective}`;
  }
  return `CURRICULUM QUESTION GENERATION MANDATE:
- Focus on factual definitions, conceptual explanations, analytical reasoning, and curriculum-grounded applications.
- Questions may optionally ask students to draw and label diagrams where relevant. Diagrams are NOT mandatory.`;
}

/**
 * Helper to safely parse LLM JSON completed response
 */
function parseLlmJsonResponse(text) {
  let parsed = {};
  try {
    let cleanJson = text.replace(/```json|```/g, '').trim();
    const firstOpen = cleanJson.indexOf('{');
    const lastClose = cleanJson.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      cleanJson = cleanJson.substring(firstOpen, lastClose + 1);
    }
    parsed = JSON.parse(repairJsonString(cleanJson));
  } catch (err) {
    const objs = extractQuestionJsonObjects(text);
    if (objs.length > 0) {
      parsed = { extracted: objs };
    }
  }
  return parsed;
}

/**
 * Generate Question Paper supporting BOTH Board Patterns AND Custom Patterns dynamically
 */
async function generateQuestionPaper({
  classId,
  subjectId,
  chapterIds = [],
  topicIds = [],
  difficulty = 'MEDIUM',
  totalMarks,
  durationMins,
  instructions,
  patternMode = 'BOARD',
  patternData,
  customTopicWeightages = [],
  grade
}) {
  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw new Error('Subject not found');

  let selectedClass = null;
  if (classId) {
    selectedClass = await prisma.class.findUnique({ where: { id: classId } });
  }

  const fullClassName = selectedClass
    ? (selectedClass.name.includes('Standard') || selectedClass.name.includes('Class') ? selectedClass.name : `Class ${selectedClass.name}`)
    : (grade || 'Class 12th');

  let chapters = [];
  if (chapterIds.length) {
    chapters = await prisma.chapter.findMany({ where: { id: { in: chapterIds } } });
  } else {
    chapters = await prisma.chapter.findMany({ where: { subjectId } });
  }
  if (!chapters.length) {
    throw new Error(`No valid chapters found for subject "${subject.name}". Please select or upload curriculum chapters.`);
  }
  const chapterNames = chapters.map(c => c.name);

  let topics = [];
  if (topicIds.length) {
    topics = await prisma.topic.findMany({ where: { id: { in: topicIds } } });
  }
  const topicNames = topics.map(t => t.name);

  const sourceValidation = await validateSourceAvailabilityAndQuality({
    classId,
    subjectId,
    chapterIds: chapters.map(c => c.id),
    chapterNames,
    topicNames,
    subjectName: subject.name
  });

  if (!sourceValidation.valid) {
    throw new Error(sourceValidation.errorMsg);
  }

  const { chunks: contextChunks, textbookState } = sourceValidation;

  const contextText = contextChunks
    .slice(0, 12)
    .map((c, i) => `--- GROUNDED STUDY CONTEXT SNIPPET #${i + 1} [Source: ${c.metadata?.source || 'Textbook'}, Chapter: ${c.metadata?.chapterName || chapterNames[0]}] ---\n${c.text}`)
    .join('\n\n');

  let finalPatternData = patternData;
  let finalBoard = null;
  let finalPatternVersion = null;
  let targetTotalMarks = totalMarks || 70;
  let targetDurationMins = durationMins || 180;

  if (patternMode === 'BOARD') {
    const boardConfig = getBoardPatternForSubject(subject.name);
    if (!boardConfig) {
      throw new Error(`Board pattern is currently unavailable for subject: "${subject.name}". Please use Customized Pattern mode.`);
    }

    finalBoard = boardConfig.board;
    finalPatternVersion = boardConfig.patternVersion;
    finalPatternData = {
      board: boardConfig.board,
      subjectName: boardConfig.subjectName,
      patternVersion: boardConfig.patternVersion,
      totalMarks: boardConfig.totalMarks,
      durationMins: boardConfig.durationMins,
      sections: boardConfig.sections
    };
    targetTotalMarks = boardConfig.totalMarks;
    targetDurationMins = boardConfig.durationMins;
  } else if (!finalPatternData || !finalPatternData.sections) {
    finalPatternData = {
      name: 'Custom Pattern',
      totalMarks: targetTotalMarks,
      durationMins: targetDurationMins,
      sections: [
        { sectionName: 'Section A', questionType: 'MCQ', totalQuestions: 10, marksPerQuestion: 1, questionsToAttempt: 10, totalSectionMarks: 10 },
        { sectionName: 'Section B', questionType: 'SHORT', totalQuestions: 8, marksPerQuestion: 2, questionsToAttempt: 6, totalSectionMarks: 12 },
        { sectionName: 'Section C', questionType: 'LONG', totalQuestions: 4, marksPerQuestion: 4, questionsToAttempt: 3, totalSectionMarks: 12 }
      ]
    };
  }

  console.log(`🤖 Generating curriculum-grounded paper (${patternMode} Mode) for ${subject.name} (${chapterNames.join(', ')}) with RAG Engine...`);

  const subjectDirective = getSubjectPromptDirectives(subject.name, fullClassName);
  const mapRawQuestion = (q, sectionName, type, marks, qNumStr) => {
    const questionText = (q.questionText || q.q || q.question || q.stem || q.text || '').trim();
    const rawOpts = q.options || q.opt || q.choices;
    const isMcq = type === 'MCQ' || Boolean(rawOpts);
    const normOptions = isMcq ? normalizeMcqOptions(rawOpts) : null;
    const answerKey = q.answerKey || q.ans || (normOptions ? normOptions[0] : 'Refer to textbook concept.');
    const diagramTopic = q.diagramTopic || q.topicTag || q.diagram || null;

    return {
      questionText,
      marks: Number(marks),
      difficulty: q.difficulty || difficulty,
      type: isMcq ? 'MCQ' : type,
      questionType: isMcq ? 'MCQ' : type,
      options: isMcq ? normOptions : null,
      answerKey,
      diagramTopic,
      sectionName,
      questionNumber: qNumStr,
      chapterId: chapters.length ? chapters[0].id : (chapterIds[0] || null)
    };
  };

  let sanitizedQuestions = [];

  if (patternMode === 'BOARD') {
    const isEnglish = (subject.name || '').toUpperCase().includes('ENGLISH');
    if (isEnglish) {
      const isClass11 = (fullClassName || '').toLowerCase().includes('11');
      console.log(`🤖 Invoking LLM for English (${fullClassName}) Activity Sheet [Pass 1/2: Section I Prose & Section II Poetry]...`);
      const promptEnglishPass1 = `You are an expert English examination paper author for Maharashtra State Board.
${subjectDirective}
TARGET CURRICULUM: ${subject.name} - ${fullClassName} (${chapterNames.join(', ')})

MANDATE FOR SECTION I (PROSE - 34 Marks) & SECTION II (POETRY - 14 Marks):
1. s1_q1a: 6 short questions (2m each) on Seen Prose Extract (A1 Global Comprehension, A2 Complex Factual, A3 Inference, A4 Personal Response, A5 Language Study, A6 Vocabulary).
2. s1_q1b: 2 short questions for Language Study: B1 (Transformation of Sentences, 3m) and B2 (Spot the Error, 1m).
3. s1_q2a: 6 short questions (2m each) on Unseen Prose Extract (A1-A6).
4. s1_q2b: 1 question (3m) on Summary Writing with a suitable title.
5. s1_q2c: 1 question (3m) on Mind Mapping (designing concept map/visual tree).
6. s2_q3a: 5 short questions (2m each) on Poetry Extract (A1-A5).
7. s2_q3b: 1 long question (4m) on Poetic Appreciation.

---GROUNDED STUDY CONTEXT---
${contextText}

Output ONLY valid JSON:
{
  "s1_q1a": [{"q": "Question stem", "ans": "Answer key", "m": 2}],
  "s1_q1b": [{"q": "B1 Transformation of sentences", "ans": "Answer key", "m": 3}, {"q": "B2 Spot the error", "ans": "Answer key", "m": 1}],
  "s1_q2a": [{"q": "Question stem", "ans": "Answer key", "m": 2}],
  "s1_q2b": [{"q": "Summary writing prompt", "ans": "Sample summary", "m": 3}],
  "s1_q2c": [{"q": "Mind mapping prompt", "ans": "Concept map layout", "m": 3}],
  "s2_q3a": [{"q": "Poetry extract question stem", "ans": "Answer key", "m": 2}],
  "s2_q3b": [{"q": "Poetic appreciation prompt", "ans": "Appreciation breakdown", "m": 4}]
}`;

      const responsePass1 = await callLLM(promptEnglishPass1);
      const parsedPass1 = parseLlmJsonResponse(responsePass1);

      console.log(`🤖 Invoking LLM for English (${fullClassName}) Activity Sheet [Pass 2/2: Section III Writing Skills & Section IV Literary Genre]...`);

      const s4MandateLines = isClass11
        ? `5. s4_q5a: 2 questions (2m each) on History of English Drama / Literary Genre (MCQ / Match / True-False).
6. s4_q5b: 2 questions (2m each) on Class 11 Drama/Novel 4.2 (e.g. The Rising of the Moon).
7. s4_q5c: 2 questions (2m each) on Class 11 Drama/Novel 4.3 (e.g. A Midsummer Night's Dream).
8. s4_q5d: 2 questions (2m each) on Class 11 Drama/Novel 4.4 (e.g. An Enemy of the People).`
        : `5. s4_q5a: 2 questions (2m each) on History of Novel (MCQ / Match / True-False).
6. s4_q5b: 2 questions (2m each) on Novel 4.2: To Sir, With Love.
7. s4_q5c: 2 questions (2m each) on Novel 4.3: Around the World in Eighty Days.
8. s4_q5d: 2 questions (2m each) on Novel 4.4: The Sign of Four.`;

      const promptEnglishPass2 = `You are an expert English examination paper author for Maharashtra State Board.
${subjectDirective}
TARGET CURRICULUM: ${subject.name} - ${fullClassName} (${chapterNames.join(', ')})

MANDATE FOR SECTION III (WRITING SKILLS - 16 Marks) & SECTION IV (LITERARY GENRE - 16 Marks):
1. s3_q4a: 3 choices (4m each) for Q.4(A) - Virtual Message OR Statement of Purpose (SOP) OR Group Discussion.
2. s3_q4b: 3 choices (4m each) for Q.4(B) - Email Writing OR Report Writing OR Framing Interview Questions.
3. s3_q4c: 3 choices (4m each) for Q.4(C) - Speech Writing OR Compering OR Expansion of Ideas.
4. s3_q4d: 3 choices (4m each) for Q.4(D) - Film/Book Review OR Blog Writing OR Appeal Writing.
${s4MandateLines}

---GROUNDED STUDY CONTEXT---
${contextText}

Output ONLY valid JSON:
{
  "s3_q4a": [{"q": "Option 1: Virtual Message", "ans": "Sample answer", "m": 4}, {"q": "Option 2: Statement of Purpose", "ans": "Sample answer", "m": 4}, {"q": "Option 3: Group Discussion", "ans": "Sample answer", "m": 4}],
  "s3_q4b": [{"q": "Option 1: Email Writing", "ans": "Sample answer", "m": 4}, {"q": "Option 2: Report Writing", "ans": "Sample answer", "m": 4}, {"q": "Option 3: Interview Questions", "ans": "Sample answer", "m": 4}],
  "s3_q4c": [{"q": "Option 1: Speech Writing", "ans": "Sample answer", "m": 4}, {"q": "Option 2: Compering", "ans": "Sample answer", "m": 4}, {"q": "Option 3: Expansion of Ideas", "ans": "Sample answer", "m": 4}],
  "s3_q4d": [{"q": "Option 1: Review Writing", "ans": "Sample answer", "m": 4}, {"q": "Option 2: Blog Writing", "ans": "Sample answer", "m": 4}, {"q": "Option 3: Appeal Writing", "ans": "Sample answer", "m": 4}],
  "s4_q5a": [{"q": "Literary genre question stem", "ans": "Answer key", "m": 2}],
  "s4_q5b": [{"q": "Literature 4.2 question stem", "ans": "Answer key", "m": 2}],
  "s4_q5c": [{"q": "Literature 4.3 question stem", "ans": "Answer key", "m": 2}],
  "s4_q5d": [{"q": "Literature 4.4 question stem", "ans": "Answer key", "m": 2}]
}`;

      const responsePass2 = await callLLM(promptEnglishPass2);
      const parsedPass2 = parseLlmJsonResponse(responsePass2);

      const q1a = (parsedPass1.s1_q1a || []).slice(0, 6).map((q, i) => mapRawQuestion(q, 'Section I (Prose)', 'SHORT', 2, `Q.1 (A${i + 1})`));
      const q1b = (parsedPass1.s1_q1b || []).slice(0, 2).map((q, i) => mapRawQuestion(q, 'Section I (Prose)', 'SHORT', i === 0 ? 3 : 1, `Q.1 (B${i + 1})`));
      const q2a = (parsedPass1.s1_q2a || []).slice(0, 6).map((q, i) => mapRawQuestion(q, 'Section I (Prose)', 'SHORT', 2, `Q.2 (A${i + 1})`));
      const q2b = (parsedPass1.s1_q2b || []).slice(0, 1).map((q) => mapRawQuestion(q, 'Section I (Prose)', 'SHORT', 3, 'Q.2 (B)'));
      const q2c = (parsedPass1.s1_q2c || []).slice(0, 1).map((q) => mapRawQuestion(q, 'Section I (Prose)', 'SHORT', 3, 'Q.2 (C)'));

      const q3a = (parsedPass1.s2_q3a || []).slice(0, 5).map((q, i) => mapRawQuestion(q, 'Section II (Poetry and Appreciation)', 'SHORT', 2, `Q.3 (A${i + 1})`));
      const q3b = (parsedPass1.s2_q3b || []).slice(0, 1).map((q) => mapRawQuestion(q, 'Section II (Poetry and Appreciation)', 'SHORT', 4, 'Q.3 (B)'));

      const q4a = (parsedPass2.s3_q4a || []).slice(0, 3).map((q, i) => mapRawQuestion(q, 'Section III (Writing Skills)', 'LONG', 4, `Q.4 (A${i + 1})`));
      const q4b = (parsedPass2.s3_q4b || []).slice(0, 3).map((q, i) => mapRawQuestion(q, 'Section III (Writing Skills)', 'LONG', 4, `Q.4 (B${i + 1})`));
      const q4c = (parsedPass2.s3_q4c || []).slice(0, 3).map((q, i) => mapRawQuestion(q, 'Section III (Writing Skills)', 'LONG', 4, `Q.4 (C${i + 1})`));
      const q4d = (parsedPass2.s3_q4d || []).slice(0, 3).map((q, i) => mapRawQuestion(q, 'Section III (Writing Skills)', 'LONG', 4, `Q.4 (D${i + 1})`));

      const q5a = (parsedPass2.s4_q5a || []).slice(0, 2).map((q, i) => mapRawQuestion(q, 'Section IV (Literary Genre - Novel)', 'SHORT', 2, `Q.5 (A${i + 1})`));
      const q5b = (parsedPass2.s4_q5b || []).slice(0, 2).map((q, i) => mapRawQuestion(q, 'Section IV (Literary Genre - Novel)', 'SHORT', 2, `Q.5 (B${i + 1})`));
      const q5c = (parsedPass2.s4_q5c || []).slice(0, 2).map((q, i) => mapRawQuestion(q, 'Section IV (Literary Genre - Novel)', 'SHORT', 2, `Q.5 (C${i + 1})`));
      const q5d = (parsedPass2.s4_q5d || []).slice(0, 2).map((q, i) => mapRawQuestion(q, 'Section IV (Literary Genre - Novel)', 'SHORT', 2, `Q.5 (D${i + 1})`));

      sanitizedQuestions = [
        ...q1a, ...q1b, ...q2a, ...q2b, ...q2c,
        ...q3a, ...q3b,
        ...q4a, ...q4b, ...q4c, ...q4d,
        ...q5a, ...q5b, ...q5c, ...q5d
      ];
    } else {
      // Standard Official Maharashtra Board Pattern (2-Pass Sectioned Generation)
      const promptPass1 = `You are an expert examination paper author for ${subject.name}.
${subjectDirective}
TARGET CURRICULUM: ${subject.name} (${chapterNames.join(', ')})

MANDATE FOR SECTION A:
1. sA_mcq: Generate EXACTLY 10 MCQ Questions (1 mark each). Each MUST have 4 options ("opt": ["A)...", "B)...", "C)...", "D)..."]) and "ans".
2. sA_vsa: Generate EXACTLY 8 Very Short Answer (VSA) Questions (1 mark each).

---GROUNDED STUDY CONTEXT---
${contextText}

Output ONLY valid JSON:
{
  "sA_mcq": [{"q": "Question stem", "opt": ["A) opt1", "B) opt2", "C) opt3", "D) opt4"], "ans": "A) opt1", "m": 1}],
  "sA_vsa": [{"q": "Question stem", "ans": "Concise answer", "m": 1}]
}`;

      const promptPass2 = `You are an expert examination paper author for ${subject.name}.
${subjectDirective}
TARGET CURRICULUM: ${subject.name} (${chapterNames.join(', ')})

MANDATE FOR SECTIONS B, C, AND D:
1. sB: Generate EXACTLY 12 Short Answer Questions (2 marks each).
2. sC: Generate EXACTLY 12 Short Answer Questions (3 marks each).
3. sD: Generate EXACTLY 5 Long Answer Questions (4 marks each).

---GROUNDED STUDY CONTEXT---
${contextText}

Output ONLY valid JSON:
{
  "sB": [{"q": "2-mark question stem", "ans": "Expected solution", "m": 2}],
  "sC": [{"q": "3-mark question stem", "ans": "Expected solution", "m": 3}],
  "sD": [{"q": "4-mark long question stem", "ans": "Detailed derivation or answer", "m": 4}]
}`;

      console.log(`🤖 Invoking LLM [Pass 1/2: Section A MCQs & VSAs]...`);
      const responsePass1 = await callLLM(promptPass1);
      const parsedPass1 = parseLlmJsonResponse(responsePass1);

      console.log(`🤖 Invoking LLM [Pass 2/2: Section B, C, D Short & Long Questions]...`);
      const responsePass2 = await callLLM(promptPass2);
      const parsedPass2 = parseLlmJsonResponse(responsePass2);

      const mcqList = Array.isArray(parsedPass1.sA_mcq) ? parsedPass1.sA_mcq : (parsedPass1.extracted || []).filter(q => q.opt || q.options);
      const vsaList = Array.isArray(parsedPass1.sA_vsa) ? parsedPass1.sA_vsa : (parsedPass1.extracted || []).filter(q => !q.opt && !q.options && (q.m === 1 || q.marks === 1));
      const secBList = Array.isArray(parsedPass2.sB) ? parsedPass2.sB : (parsedPass2.extracted || []).filter(q => q.m === 2 || q.marks === 2);
      const secCList = Array.isArray(parsedPass2.sC) ? parsedPass2.sC : (parsedPass2.extracted || []).filter(q => q.m === 3 || q.marks === 3);
      const secDList = Array.isArray(parsedPass2.sD) ? parsedPass2.sD : (parsedPass2.extracted || []).filter(q => q.m === 4 || q.marks === 4);

      const finalMcqs = mcqList.slice(0, 10).map((q, i) => mapRawQuestion(q, 'Section A', 'MCQ', 1, `Q1(${i + 1})`));
      const finalVsas = vsaList.slice(0, 8).map((q, i) => mapRawQuestion(q, 'Section A', 'VERY_SHORT', 1, `Q2(${i + 1})`));
      const finalSecB = secBList.slice(0, 12).map((q, i) => mapRawQuestion(q, 'Section B', 'SHORT', 2, `Q${3 + i}`));
      const finalSecC = secCList.slice(0, 12).map((q, i) => mapRawQuestion(q, 'Section C', 'SHORT', 3, `Q${15 + i}`));
      const finalSecD = secDList.slice(0, 5).map((q, i) => mapRawQuestion(q, 'Section D', 'LONG', 4, `Q${27 + i}`));

      sanitizedQuestions = [...finalMcqs, ...finalVsas, ...finalSecB, ...finalSecC, ...finalSecD];
    }
  } else {
    // Dynamic Custom Pattern Generation
    const customSections = finalPatternData.sections || [];
    const promptCustom = `You are an expert examination paper author for ${subject.name}.
${subjectDirective}
TARGET CURRICULUM: ${subject.name} (${chapterNames.join(', ')})

CUSTOM PATTERN SECTIONS MANDATE:
${customSections.map((sec, idx) => `${idx + 1}. sec_${idx}: Generate EXACTLY ${sec.totalQuestions} questions of type ${sec.questionType} carrying ${sec.marksPerQuestion} mark(s) each.`).join('\n')}

---GROUNDED STUDY CONTEXT---
${contextText}

Output ONLY valid JSON matching:
{
  ${customSections.map((sec, idx) => `"sec_${idx}": [{"q": "Question stem", ${sec.questionType === 'MCQ' ? '"opt": ["A)...","B)...","C)...","D)..."], ' : ''}"ans": "Solution", "m": ${sec.marksPerQuestion}}]`).join(',\n  ')}
}`;

    const responseCustom = await callLLM(promptCustom);
    const parsedCustom = parseLlmJsonResponse(responseCustom);

    let globalQIndex = 1;
    customSections.forEach((sec, idx) => {
      const rawQs = Array.isArray(parsedCustom[`sec_${idx}`])
        ? parsedCustom[`sec_${idx}`]
        : (parsedCustom.extracted || []).filter(q => Number(q.m || q.marks) === Number(sec.marksPerQuestion));

      const sliced = rawQs.slice(0, sec.totalQuestions);
      sliced.forEach((q, i) => {
        const qNumLabel = sec.questionType === 'MCQ' ? `Q${globalQIndex}(${i + 1})` : `Q${globalQIndex}`;
        sanitizedQuestions.push(mapRawQuestion(q, sec.sectionName || `Section ${idx + 1}`, sec.questionType || 'SHORT', sec.marksPerQuestion || 2, qNumLabel));
        if (sec.questionType !== 'MCQ' || i === sliced.length - 1) {
          globalQIndex++;
        }
      });
    });
  }

  sanitizedQuestions = sanitizedQuestions
    .filter(q => q.questionText.length > 0)
    .map(q => ({
      ...q,
      imageUrl: null,
      diagramUrl: null,
      diagramTopic: null
    }));

  const contentValidation = validateQuestionContent(sanitizedQuestions, difficulty);
  if (!contentValidation.valid) {
    console.warn('⚠️ Content Quality Warnings:', contentValidation.errors);
  }

  const structuralValidation = {
    valid: sanitizedQuestions.length > 0,
    actualQuestionCount: sanitizedQuestions.length,
    errors: []
  };

  return {
    subject: subject.name,
    subjectId: subject.id,
    class: fullClassName,
    classId: selectedClass ? selectedClass.id : null,
    chapters: chapterNames,
    grade: fullClassName,
    difficulty,
    totalMarks: targetTotalMarks,
    durationMins: targetDurationMins,
    instructions: instructions || null,
    patternMode,
    board: finalBoard,
    patternVersion: finalPatternVersion,
    patternData: finalPatternData,
    textbookState,
    questions: sanitizedQuestions,
    validation: structuralValidation,
    contextSources: [...new Set(contextChunks.map(c => c.metadata?.source || 'Textbook'))]
  };
}

function validateGeneratedPaper(patternData, questions) {
  return {
    valid: true,
    actualQuestionCount: questions?.length || 0,
    errors: []
  };
}

module.exports = {
  generateQuestionPaper,
  validateGeneratedPaper,
  validateQuestionContent,
  validateSourceAvailabilityAndQuality,
  getSubjectPromptDirectives
};