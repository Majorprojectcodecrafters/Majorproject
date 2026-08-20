const path = require('path');
const fs = require('fs');
const { ingestPDF } = require('../rag/ragPipeline');
const { generateQuestionPaper } = require('../rag/qpGenerator');
const { getStats, deleteBySource, deleteByGrade, deleteBySubject } = require('../rag/vectorStore');
const prisma = require('../config/prisma');

const TEXTBOOK_DIR = path.join(process.cwd(), 'pdfs', 'textbooks');
const PYQ_DIR = path.join(process.cwd(), 'pdfs', 'pyq');

// Ensure base directories exist
[TEXTBOOK_DIR, PYQ_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==================== ADMIN: INGEST PDF ====================

exports.ingestPDF = async (req, res) => {
  try {
    const { type, subjectId, chapterId, grade } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    if (!['textbook', 'pyq'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be textbook or pyq' });
    }
    if (!['11th', '12th'].includes(grade)) {
      return res.status(400).json({ success: false, message: 'Grade must be 11th or 12th' });
    }

    let subjectName = '';
    let chapterName = '';

    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
      subjectName = subject.name;
    }

    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
      if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });
      chapterName = chapter.name;
    }

    const result = await ingestPDF(file.path, {
      type,
      grade,
      subjectId: subjectId || '',
      subjectName,
      chapterId: chapterId || '',
      chapterName
    });

    res.status(201).json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== ADMIN: GET STATS ====================

exports.getStats = async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== ADMIN: DELETE PDF CHUNKS ====================

exports.deletePDF = async (req, res) => {
  try {
    const { fileName } = req.params;
    await deleteBySource(fileName);
    res.json({ success: true, message: `Chunks deleted for: ${fileName}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== ADMIN: DELETE BY GRADE ====================

exports.deleteByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    if (!['11th', '12th'].includes(grade)) {
      return res.status(400).json({ success: false, message: 'Grade must be 11th or 12th' });
    }
    await deleteByGrade(grade);
    res.json({ success: true, message: `Chunks deleted for grade: ${grade}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== ADMIN: DELETE BY SUBJECT ====================

exports.deleteBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    await deleteBySubject(subjectId);
    res.json({ success: true, message: `Chunks deleted for subjectId: ${subjectId}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== TEACHER: GENERATE QP ====================

exports.generateQP = async (req, res) => {
  try {
    const {
      subjectId,
      chapterIds,
      difficulty,
      totalMarks,
      durationMins,
      instructions,
      mcqCount = 5,
      shortCount = 3,
      longCount = 2,
      grade
    } = req.body;

    if (!subjectId || !chapterIds?.length) {
      return res.status(400).json({ success: false, message: 'subjectId and chapterIds are required' });
    }

    const result = await generateQuestionPaper({
      subjectId,
      chapterIds,
      difficulty: difficulty || 'MEDIUM',
      totalMarks: totalMarks || 50,
      durationMins: durationMins || 60,
      instructions,
      mcqCount: Number(mcqCount),
      shortCount: Number(shortCount),
      longCount: Number(longCount),
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
      templateId,
      questions
    } = req.body;

    const teacherId = req.user.teacherId;

    if (!questions?.length) {
      return res.status(400).json({ success: false, message: 'No questions provided' });
    }

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    // 1. Save all questions to DB
    const savedQuestions = await Promise.all(
      questions.map(q =>
        prisma.question.create({
          data: {
            questionText: q.questionText,
            marks: Number(q.marks),
            difficulty: q.difficulty,
            chapterId: q.chapterId,
            options: q.options || null,
            answerKey: q.answerKey || null
          }
        })
      )
    );

    // 2. Create question paper with linked questions
    const qp = await prisma.questionPaper.create({
      data: {
        title,
        totalMarks: Number(totalMarks),
        durationMins: Number(durationMins),
        instructions: instructions || null,
        difficulty,
        status: 'DRAFT',
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