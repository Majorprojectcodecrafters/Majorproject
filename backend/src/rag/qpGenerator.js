const Groq = require('groq-sdk');
const { embedText } = require('./embedder');
const { queryChunks } = require('./vectorStore');
const prisma = require('../config/prisma');

// Lazy initialization - only creates client when needed
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing from .env');
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Build search query from chapter details
function buildSearchQuery(chapterNames, subjectName) {
  return `${subjectName} ${chapterNames.join(' ')} concepts definitions theory`;
}

// Build ChromaDB filters
function buildFilters(subjectId, grade) {
  if (subjectId && grade) {
    return {
      $and: [
        { subjectId: { $eq: subjectId } },
        { grade: { $eq: grade } }
      ]
    };
  }
  if (subjectId) return { subjectId: { $eq: subjectId } };
  if (grade)     return { grade: { $eq: grade } };
  return {};
}

// Retrieve relevant context from ChromaDB
async function retrieveContext(subjectId, chapterIds, subjectName, chapterNames, grade) {
  const query = buildSearchQuery(chapterNames, subjectName);
  const queryEmbedding = await embedText(query);

  const filters = buildFilters(subjectId, grade);
  const chunks = await queryChunks(queryEmbedding, filters, 15);

  if (chunks.length < 5) {
    console.log('⚠️ Not enough results with filters, trying fallback...');
    const fallbackChunks = await queryChunks(queryEmbedding, {}, 15);
    return fallbackChunks;
  }

  return chunks;
}

// Generate question paper using Groq
async function generateQuestionPaper({
  subjectId,
  chapterIds,
  difficulty,
  totalMarks,
  durationMins,
  instructions,
  mcqCount,
  shortCount,
  longCount,
  grade
}) {
  try {
    // 1. Fetch subject and chapter details from DB
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new Error('Subject not found');

    const chapters = await prisma.chapter.findMany({
      where: { id: { in: chapterIds } }
    });
    if (!chapters.length) throw new Error('No chapters found');

    const chapterNames = chapters.map(c => c.name);

    // 2. Retrieve relevant context from ChromaDB
    console.log('🔍 Retrieving relevant context...');
    const contextChunks = await retrieveContext(
      subjectId,
      chapterIds,
      subject.name,
      chapterNames,
      grade
    );
    const context = contextChunks.map(c => c.text).join('\n\n');
    console.log(`📚 Retrieved ${contextChunks.length} relevant chunks`);

    // 3. Build prompt
    const prompt = `You are an expert teacher creating a question paper.

Subject: ${subject.name}
${grade ? `Grade: ${grade}` : ''}
Chapters: ${chapterNames.join(', ')}
Difficulty: ${difficulty}
Total Marks: ${totalMarks}
Duration: ${durationMins} minutes

Questions to generate:
- MCQ questions: ${mcqCount} (2 marks each)
- Short answer questions: ${shortCount} (5 marks each)
- Long answer questions: ${longCount} (10 marks each)

Use the following study material as context to generate relevant questions:

---CONTEXT START---
${context}
---CONTEXT END---

Generate a question paper in the following JSON format ONLY, no extra text:
{
  "mcq": [
    {
      "questionText": "question here",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answerKey": "A) correct option",
      "marks": 2,
      "difficulty": "${difficulty}"
    }
  ],
  "shortAnswer": [
    {
      "questionText": "question here",
      "answerKey": "expected answer",
      "marks": 5,
      "difficulty": "${difficulty}"
    }
  ],
  "longAnswer": [
    {
      "questionText": "question here",
      "answerKey": "expected answer points",
      "marks": 10,
      "difficulty": "${difficulty}"
    }
  ]
}`;

    // 4. Call Groq API
    console.log('🤖 Generating questions with Groq...');
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000
    });

    const responseText = completion.choices[0].message.content;

    // 5. Parse JSON response safely
    let generated;
    try {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      generated = JSON.parse(cleanJson);
    } catch (e) {
      const firstOpen = responseText.indexOf('{');
      const lastClose = responseText.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        generated = JSON.parse(responseText.substring(firstOpen, lastClose + 1));
      } else {
        throw new Error('Failed to parse structured JSON from AI model response');
      }
    }

    // 6. Structure final output safely
    const mcqs = Array.isArray(generated.mcq) ? generated.mcq : [];
    const shortAns = Array.isArray(generated.shortAnswer) ? generated.shortAnswer : [];
    const longAns = Array.isArray(generated.longAnswer) ? generated.longAnswer : [];

    const allQuestions = [
      ...mcqs.map(q => ({ ...q, type: 'MCQ', chapterId: chapterIds[0] })),
      ...shortAns.map(q => ({ ...q, type: 'SHORT', chapterId: chapterIds[0] })),
      ...longAns.map(q => ({ ...q, type: 'LONG', chapterId: chapterIds[0] }))
    ];

    return {
      subject: subject.name,
      chapters: chapterNames,
      grade: grade || null,
      difficulty,
      totalMarks,
      durationMins,
      questions: allQuestions,
      contextSources: [...new Set(contextChunks.map(c => c.metadata.source))]
    };

  } catch (error) {
    console.error('❌ QP Generation error:', error.message);
    throw error;
  }
}

module.exports = { generateQuestionPaper };