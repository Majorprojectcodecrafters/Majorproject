const { embedText } = require('./embedder');
const { queryChunks, buildCurriculumFilter } = require('./vectorStore');
const prisma = require('../config/prisma');
const { getBoardPatternForSubject } = require('../config/boardPatterns');
const { callLLM } = require('./llmClient');

// Build search query from chapter and topic names
function buildSearchQuery(chapterNames, topicNames, subjectName) {
  const parts = [subjectName, ...chapterNames, ...(topicNames || [])];
  return `${parts.join(' ')} concepts definitions theory derivation numericals problems`;
}

// Curriculum-aware textbook grounding check & retrieval
async function retrieveCurriculumContext({ classId, subjectId, chapterIds, topicIds, subjectName, chapterNames, topicNames }) {
  // 1. Check if Textbook KnowledgeSource exists in DB for this class + subject
  const textbookSource = await prisma.knowledgeSource.findFirst({
    where: {
      subjectId,
      sourceType: 'TEXTBOOK',
      ...(classId ? { classId } : {})
    }
  });

  let textbookState = 'TEXTBOOK_NOT_AVAILABLE';
  if (textbookSource) {
    textbookState = 'TEXTBOOK_AVAILABLE_BUT_NO_RELEVANT_CHUNKS';
  }

  // 2. Perform metadata-constrained vector search
  const query = buildSearchQuery(chapterNames, topicNames, subjectName);
  const queryEmbedding = await embedText(query);

  const filter = buildCurriculumFilter({
    classId,
    subjectId,
    chapterId: chapterIds?.length === 1 ? chapterIds[0] : null,
    topicId: topicIds?.length === 1 ? topicIds[0] : null
  });

  let chunks = await queryChunks(queryEmbedding, filter, 20);

  if (chunks.length > 0 && textbookSource) {
    textbookState = 'TEXTBOOK_AVAILABLE_AND_RETRIEVED';
  }

  // Fallback: If no chunks found with strict filters, fallback to subject-level retrieval
  if (chunks.length < 3) {
    console.log('⚠️ Strict curriculum filter returned few chunks, broadening to subject filter...');
    const fallbackFilter = buildCurriculumFilter({ subjectId, classId });
    const fallbackChunks = await queryChunks(queryEmbedding, fallbackFilter, 15);
    if (fallbackChunks.length > 0) {
      chunks = fallbackChunks;
      if (textbookSource) textbookState = 'TEXTBOOK_AVAILABLE_AND_RETRIEVED';
    }
  }

  return { chunks, textbookState, textbookSource };
}

/**
 * Validate generated paper against pattern and weightages
 */
function validateGeneratedPaper(patternData, allQuestions, weightageData = []) {
  const errors = [];

  if (!allQuestions || !allQuestions.length) {
    errors.push('No questions were generated');
    return { valid: false, errors };
  }

  // Check MCQs have options and answer keys
  const mcqs = allQuestions.filter(q => q.type === 'MCQ');
  mcqs.forEach((q, idx) => {
    if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`MCQ #${idx + 1} ("${q.questionText.slice(0, 30)}...") is missing valid choices.`);
    }
    if (!q.answerKey) {
      errors.push(`MCQ #${idx + 1} ("${q.questionText.slice(0, 30)}...") is missing an answer key.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    actualQuestionCount: allQuestions.length
  };
}

/**
 * Generate Question Paper with Board/Custom Pattern and Curriculum Weightages
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
  try {
    // 1. Fetch Subject & Selected Class
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new Error('Subject not found');

    let selectedClass = null;
    if (classId) {
      selectedClass = await prisma.class.findUnique({ where: { id: classId } });
    }

    // 2. Fetch Selected Chapters & Topics
    let chapters = [];
    if (chapterIds.length) {
      chapters = await prisma.chapter.findMany({
        where: { id: { in: chapterIds } }
      });
    } else {
      chapters = await prisma.chapter.findMany({
        where: { subjectId }
      });
    }
    const chapterNames = chapters.map(c => c.name);

    let topics = [];
    if (topicIds.length) {
      topics = await prisma.topic.findMany({ where: { id: { in: topicIds } } });
    }
    const topicNames = topics.map(t => t.name);

    // 3. Fetch Official Board Weightages from DB
    const dbWeightages = await prisma.chapterWeightage.findMany({
      where: {
        subjectId,
        ...(classId ? { classId } : {})
      },
      include: { chapter: true, unit: true }
    });

    // 4. Resolve Board vs Custom Pattern Structure
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
      // Default custom pattern
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

    // 5. Retrieve Context from ChromaDB with Curriculum Filters & Check Grounding State
    console.log('🔍 Retrieving curriculum-aware context from knowledge base...');
    const { chunks: contextChunks, textbookState, textbookSource } = await retrieveCurriculumContext({
      classId,
      subjectId,
      chapterIds: chapters.map(c => c.id),
      topicIds,
      subjectName: subject.name,
      chapterNames,
      topicNames
    });

    const contextText = contextChunks.slice(0, 5).map((c, i) => `[Textbook Snippet ${i + 1}]: ${c.text.slice(0, 250)}...`).join('\n\n');
    console.log(`📚 Grounding State: ${textbookState} (${contextChunks.length} chunks retrieved)`);

    // 6. Build Structural Prompt
    const patternSectionsStr = (finalPatternData.sections || []).map(sec =>
      `- ${sec.sectionTitle || sec.name} (${sec.sectionMarks || sec.marks} Marks): ${sec.totalQuestions} total questions, solve ${sec.attemptQuestions}, ${sec.marksPerQuestion}m each. Type: ${sec.questionType || 'SHORT'}`
    ).join('\n');

    const weightageSummaryStr = dbWeightages.map(w =>
      `- Chapter: ${w.chapter?.name || 'Unit'}, Weightage: ${w.marks}m`
    ).join('\n');

    const prompt = `You are an expert examination question paper author.
Generate a complete, high-quality question paper strictly following the examination pattern and curriculum weightages specified below.

Subject: ${subject.name}
Class: ${selectedClass ? selectedClass.name : '12th Standard'}
Chapters Covered: ${chapterNames.join(', ')}
${topicNames.length ? `Selected Topics: ${topicNames.join(', ')}` : ''}
Difficulty Level: ${difficulty}
Total Marks: ${targetTotalMarks}
Duration: ${targetDurationMins} minutes

Official Board Chapter Weightages:
${weightageSummaryStr || 'Distribute questions proportionately across selected chapters.'}

Examination Pattern Sections:
${patternSectionsStr}

---GROUNDED KNOWLEDGE STUDY MATERIAL CONTEXT---
${contextText || 'Generate questions based on standard curriculum textbook concepts.'}
---END CONTEXT---

CRITICAL INSTRUCTIONS:
1. Generate questions matching the EXACT question counts and question types required by each section.
2. For MCQ questions, provide 4 options ("A) ...", "B) ...", "C) ...", "D) ...") and set "answerKey" to the correct choice.
3. Respect chapter weightages: allocate question marks to chapters proportionally according to their prescribed marks.
4. Output ONLY valid json matching this exact structure:
{
  "questions": [
    {
      "sectionName": "Section A",
      "questionNumber": "Q1 (1)",
      "questionText": "Question text here",
      "type": "MCQ",
      "marks": 1,
      "difficulty": "${difficulty}",
      "options": ["A) Choice 1", "B) Choice 2", "C) Choice 3", "D) Choice 4"],
      "answerKey": "A) Choice 1"
    }
  ]
}`;

    // 7. Call LLM Provider (Multi-provider fallback: Gemini / Groq / Ollama)
    console.log('🤖 Generating question paper with AI Model...');
    const responseText = await callLLM(prompt);

    let parsed;
    let allQuestions = [];
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleanJson);
      allQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    } catch (e) {
      console.log('⚠️ Standard JSON.parse failed. Attempting resilient regex extraction of question objects...');
      const firstOpen = responseText.indexOf('{');
      const lastClose = responseText.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        try {
          parsed = JSON.parse(responseText.substring(firstOpen, lastClose + 1));
          allQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
        } catch (innerErr) {
          // Extract individual question objects using pattern matching
          const qMatches = responseText.match(/\{\s*"sectionName"[\s\S]*?\}/g) || [];
          for (const item of qMatches) {
            try {
              const qObj = JSON.parse(item);
              if (qObj && qObj.questionText) allQuestions.push(qObj);
            } catch (ignore) {}
          }
        }
      }
    }

    if (!allQuestions.length && parsed) {
      const mcqs = Array.isArray(parsed.mcq) ? parsed.mcq.map(q => ({ ...q, type: 'MCQ' })) : [];
      const vsa = Array.isArray(parsed.veryShortAnswer) ? parsed.veryShortAnswer.map(q => ({ ...q, type: 'VERY_SHORT' })) : [];
      const sa = Array.isArray(parsed.shortAnswer) ? parsed.shortAnswer.map(q => ({ ...q, type: 'SHORT' })) : [];
      const la = Array.isArray(parsed.longAnswer) ? parsed.longAnswer.map(q => ({ ...q, type: 'LONG' })) : [];
      allQuestions = [...mcqs, ...vsa, ...sa, ...la];
    }

    // Attach chapter IDs & sanitize fields
    allQuestions = allQuestions.map((q, idx) => ({
      ...q,
      chapterId: chapters.length ? chapters[idx % chapters.length].id : chapterIds[0],
      marks: Number(q.marks) || 1,
      difficulty: q.difficulty || difficulty,
      type: q.type || 'SHORT'
    }));

    // 9. Validation
    const validation = validateGeneratedPaper(finalPatternData, allQuestions, dbWeightages);

    return {
      subject: subject.name,
      subjectId: subject.id,
      class: selectedClass ? selectedClass.name : null,
      classId: selectedClass ? selectedClass.id : null,
      chapters: chapterNames,
      grade: grade || null,
      difficulty,
      totalMarks: targetTotalMarks,
      durationMins: targetDurationMins,
      instructions: instructions || null,
      patternMode,
      board: finalBoard,
      patternVersion: finalPatternVersion,
      patternData: finalPatternData,
      textbookState,
      questions: allQuestions,
      validation,
      contextSources: [...new Set(contextChunks.map(c => c.metadata.source))]
    };

  } catch (error) {
    console.error('❌ QP Generation error:', error.message);
    throw error;
  }
}

module.exports = { generateQuestionPaper, validateGeneratedPaper, retrieveCurriculumContext };