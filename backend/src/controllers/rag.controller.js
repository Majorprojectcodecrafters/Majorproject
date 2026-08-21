const path = require('path');
const fs = require('fs');
const { ingestPDF } = require('../rag/ragPipeline');
const { generateQuestionPaper } = require('../rag/qpGenerator');
const { getStats, deleteBySource, deleteBySourceId, deleteBySubject, deleteByGrade } = require('../rag/vectorStore');
const prisma = require('../config/prisma');

const TEXTBOOK_DIR = path.join(process.cwd(), 'pdfs', 'textbooks');
const PYQ_DIR = path.join(process.cwd(), 'pdfs', 'pyq');

[TEXTBOOK_DIR, PYQ_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==================== INGEST KNOWLEDGE SOURCE ====================

exports.ingestPDF = async (req, res) => {
  try {
    const {
      title,
      sourceType = 'TEXTBOOK',
      boardId,
      streamId,
      classId,
      subjectId,
      unitId,
      chapterId,
      topicId,
      description,
      grade
    } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'No PDF file uploaded' });

    let subjectName = '';
    let chapterName = '';

    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (subject) subjectName = subject.name;
    }

    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
      if (chapter) chapterName = chapter.name;
    }

    // 1. Create KnowledgeSource record in Prisma DB
    const ks = await prisma.knowledgeSource.create({
      data: {
        title: title || file.originalname,
        sourceType: sourceType || 'TEXTBOOK',
        fileName: file.filename || file.originalname,
        filePath: file.path,
        fileSize: file.size,
        status: 'PROCESSING',
        uploadedBy: req.user.id,
        description: description || null,
        boardId: boardId || null,
        streamId: streamId || null,
        classId: classId || null,
        subjectId: subjectId || null,
        unitId: unitId || null,
        chapterId: chapterId || null,
        topicId: topicId || null
      }
    });

    // 2. Ingest into ChromaDB vector store
    const result = await ingestPDF(file.path, {
      knowledgeSourceId: ks.id,
      sourceType: sourceType || 'TEXTBOOK',
      boardId: boardId || '',
      streamId: streamId || '',
      classId: classId || '',
      subjectId: subjectId || '',
      subjectName,
      unitId: unitId || '',
      chapterId: chapterId || '',
      chapterName,
      topicId: topicId || '',
      grade: grade || ''
    });

    // 3. Mark status PROCESSED
    await prisma.knowledgeSource.update({
      where: { id: ks.id },
      data: { status: 'PROCESSED' }
    });

    res.status(201).json({ success: true, data: { ...result, knowledgeSource: ks } });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// List knowledge sources filtered by classId, subjectId, sourceType
exports.getKnowledgeSources = async (req, res) => {
  try {
    const { classId, subjectId, sourceType, chapterId } = req.query;
    const where = {};

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (sourceType) where.sourceType = sourceType;
    if (chapterId) where.chapterId = chapterId;

    const sources = await prisma.knowledgeSource.findMany({
      where,
      include: {
        class: true,
        subject: true,
        chapter: true,
        topic: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete knowledge source
exports.deleteKnowledgeSource = async (req, res) => {
  try {
    const { id } = req.params;

    const ks = await prisma.knowledgeSource.findUnique({ where: { id } });
    if (!ks) return res.status(404).json({ success: false, message: 'Knowledge source not found' });

    // Purge chunks from ChromaDB
    await deleteBySourceId(ks.id);
    await deleteBySource(ks.fileName);

    // Delete record from Prisma
    await prisma.knowledgeSource.delete({ where: { id } });

    res.json({ success: true, message: `Knowledge source "${ks.title}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get vector stats
exports.getStats = async (req, res) => {
  try {
    const stats = await getStats();
    const sourcesCount = await prisma.knowledgeSource.count();
    res.json({ success: true, data: { ...stats, totalSources: sourcesCount } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deletePDF = async (req, res) => {
  try {
    const { fileName } = req.params;
    await deleteBySource(fileName);
    res.json({ success: true, message: `Chunks deleted for: ${fileName}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    await deleteByGrade(grade);
    res.json({ success: true, message: `Chunks deleted for grade: ${grade}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    await deleteBySubject(subjectId);
    res.json({ success: true, message: `Chunks deleted for subject: ${subjectId}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== TEACHER: GENERATE QP ====================

exports.generateQP = async (req, res) => {
  try {
    const {
      classId,
      subjectId,
      chapterIds,
      topicIds,
      difficulty,
      totalMarks,
      durationMins,
      instructions,
      patternMode,
      board,
      patternVersion,
      patternData,
      customTopicWeightages,
      grade
    } = req.body;

    if (!subjectId || (!chapterIds?.length && !topicIds?.length)) {
      return res.status(400).json({ success: false, message: 'subjectId and at least one chapter or topic are required' });
    }

    const result = await generateQuestionPaper({
      classId,
      subjectId,
      chapterIds: chapterIds || [],
      topicIds: topicIds || [],
      difficulty: difficulty || 'MEDIUM',
      totalMarks: totalMarks ? Number(totalMarks) : 70,
      durationMins: durationMins ? Number(durationMins) : 180,
      instructions,
      patternMode: patternMode || 'BOARD',
      board,
      patternVersion,
      patternData,
      customTopicWeightages,
      grade
    });

    res.json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== TEACHER: SAVE GENERATED QP ====================

exports.saveGeneratedQP = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      totalMarks,
      durationMins,
      instructions,
      difficulty,
      patternMode,
      board,
      patternVersion,
      patternData,
      templateId,
      questions
    } = req.body;

    const teacherId = req.user.teacherId;

    if (!questions?.length) {
      return res.status(400).json({ success: false, message: 'No questions provided' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // 1. Save all questions to DB with questionType & optional topicId
    const savedQuestions = await Promise.all(
      questions.map(q =>
        prisma.question.create({
          data: {
            questionText: q.questionText,
            marks: Number(q.marks),
            difficulty: q.difficulty || difficulty || 'MEDIUM',
            questionType: q.type || q.questionType || (q.options?.length ? 'MCQ' : 'SHORT'),
            chapterId: q.chapterId,
            topicId: q.topicId || null,
            options: q.options || null,
            answerKey: q.answerKey || null
          }
        })
      )
    );

    // 2. Create question paper with pattern snapshot and linked questions
    const qp = await prisma.questionPaper.create({
      data: {
        title,
        totalMarks: Number(totalMarks),
        durationMins: Number(durationMins),
        instructions: instructions || null,
        difficulty: difficulty || 'MEDIUM',
        status: 'DRAFT',
        patternMode: patternMode || 'CUSTOM',
        board: board || null,
        patternVersion: patternVersion || null,
        patternData: patternData || null,
        teacherId,
        subjectId,
        templateId: templateId || null,
        questions: {
          create: savedQuestions.map(q => ({ questionId: q.id }))
        }
      },
      include: {
        subject: true,
        teacher: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        questions: { include: { question: true } },
        template: true
      }
    });

    res.status(201).json({ success: true, data: qp });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};