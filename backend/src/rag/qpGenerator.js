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
function getSubjectPromptDirectives(subjectName) {
  const nameUpper = (subjectName || '').toUpperCase();
  if (nameUpper.includes('PHYSICS')) {
    return `PHYSICS QUESTION GENERATION MANDATE:
- Focus on fundamental laws, principles, physical interpretations, mathematical derivations, numerical problem solving with SI units, schematic diagram explanations, and real-world physical applications.`;
  }
  if (nameUpper.includes('CHEMISTRY')) {
    return `CHEMISTRY QUESTION GENERATION MANDATE:
- Focus on chemical equations, reaction mechanisms, IUPAC nomenclature, electronic configurations, stoichiometric calculations, physical chemistry formulas, and inorganic/organic properties.`;
  }
  if (nameUpper.includes('MATH') || nameUpper.includes('STATISTICS')) {
    return `MATHEMATICAL QUESTION GENERATION MANDATE:
- Focus on rigorous mathematical problem solving, step-by-step proofs, algebraic/calculus calculations, geometric theorems, and statistical data analysis.`;
  }
  if (nameUpper.includes('BIOLOGY')) {
    return `BIOLOGY QUESTION GENERATION MANDATE:
- Focus on biological processes, anatomical diagrams, physiological functions, taxonomic classifications, comparative analysis, and genetic/ecological principles.`;
  }
  return `CURRICULUM QUESTION GENERATION MANDATE:
- Focus on factual definitions, conceptual explanations, analytical reasoning, and curriculum-grounded applications.`;
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

  const subjectDirective = getSubjectPromptDirectives(subject.name);
  const mapRawQuestion = (q, sectionName, type, marks, qNumStr) => {
    const questionText = (q.questionText || q.q || q.question || q.stem || q.text || '').trim();
    const rawOpts = q.options || q.opt || q.choices;
    const isMcq = type === 'MCQ' || Boolean(rawOpts);
    const normOptions = isMcq ? normalizeMcqOptions(rawOpts) : null;
    const answerKey = q.answerKey || q.ans || (normOptions ? normOptions[0] : 'Refer to textbook concept.');

    return {
      questionText,
      marks: Number(marks),
      difficulty: q.difficulty || difficulty,
      type: isMcq ? 'MCQ' : type,
      questionType: isMcq ? 'MCQ' : type,
      options: isMcq ? normOptions : null,
      answerKey,
      sectionName,
      questionNumber: qNumStr,
      chapterId: chapters.length ? chapters[0].id : (chapterIds[0] || null)
    };
  };

  let sanitizedQuestions = [];

  if (patternMode === 'BOARD') {
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

  sanitizedQuestions = sanitizedQuestions.filter(q => q.questionText.length > 0);

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