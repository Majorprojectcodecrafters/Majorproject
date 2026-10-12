const prisma = require('../config/prisma');
const { sendServerError } = require('../utils/responseHandler');

const safeTeacherInclude = {
  include: {
    user: {
      select: { id: true, name: true, email: true, role: true }
    }
  }
};

// CREATE QP
exports.createQP = async (req, res) => {
  try {
    const {
      title,
      totalMarks,
      durationMins,
      instructions,
      difficulty,
      subjectId,
      templateId,
      questionIds
    } = req.body;

    const teacherId = req.user.teacherId;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    if (req.user && req.user.role === 'TEACHER') {
      const assignment = await prisma.teacherAssignment.findFirst({
        where: { teacherId, subjectId }
      });
      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to create question papers for this subject.'
        });
      }
    }

    if (questionIds?.length) {
      const foundQuestions = await prisma.question.findMany({
        where: { id: { in: questionIds } }
      });
      if (foundQuestions.length !== questionIds.length) {
        return res.status(400).json({ success: false, message: 'One or more questions not found' });
      }
    }

    const qp = await prisma.questionPaper.create({
      data: {
        title,
        totalMarks,
        durationMins,
        instructions,
        difficulty,
        subjectId,
        teacherId,
        templateId: templateId || null,
        status: 'DRAFT',
        questions: {
          create: questionIds?.map(questionId => ({ questionId })) || []
        }
      },
      include: {
        subject: true,
        teacher: safeTeacherInclude,
        questions: { include: { question: true } },
        template: true
      }
    });

    res.status(201).json({ success: true, data: qp });

  } catch (error) {
    sendServerError(res, error, 'Failed to create question paper');
  }
};

// GET ALL QP
exports.getAllQP = async (req, res) => {
  try {
    const { status, subjectId, difficulty, page = 1, limit = 10 } = req.query;

    // Teachers view strictly their own generated papers; Admins view papers across all teachers
    const isTeacher = req.user?.role === 'TEACHER' || (req.user?.teacherId && req.user?.role !== 'ADMIN');
    const where = {
      isDeleted: false,
      ...(isTeacher && req.user?.teacherId ? { teacherId: req.user.teacherId } : {}),
      ...(status && { status }),
      ...(subjectId && { subjectId }),
      ...(difficulty && { difficulty })
    };

    const [qps, total] = await Promise.all([
      prisma.questionPaper.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          subject: true,
          teacher: safeTeacherInclude,
          questions: { include: { question: true } },
          template: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.questionPaper.count({ where })
    ]);

    res.json({
      success: true,
      data: qps,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    sendServerError(res, error, 'Failed to retrieve question papers');
  }
};

// GET QP BY ID
exports.getQPById = async (req, res) => {
  try {
    const { id } = req.params;

    const qp = await prisma.questionPaper.findFirst({
      where: { id, isDeleted: false },
      include: {
        subject: true,
        teacher: safeTeacherInclude,
        questions: {
          include: { question: { include: { chapter: true } } },
          orderBy: { orderInt: 'asc' }
        },
        template: true,
        examResults: true
      }
    });

    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Students cannot view unpublished draft question papers
    if (req.user?.role === 'STUDENT' && qp.status !== 'PUBLISHED') {
      return res.status(403).json({ success: false, message: 'Question paper is not published yet' });
    }

    res.json({ success: true, data: qp });

  } catch (error) {
    sendServerError(res, error, 'Failed to retrieve question paper details');
  }
};

// UPDATE QP
exports.updateQP = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      totalMarks,
      durationMins,
      instructions,
      difficulty,
      status,
      templateId,
      questionIds
    } = req.body;

    const existing = await prisma.questionPaper.findFirst({
      where: { id, isDeleted: false }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Enforce ownership: Teachers can only edit their own papers
    if (req.user?.role === 'TEACHER' && existing.teacherId !== req.user?.teacherId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to modify this question paper' });
    }

    const questionsUpdate = questionIds
      ? {
          deleteMany: {},
          create: questionIds.map(questionId => ({ questionId }))
        }
      : undefined;

    const qp = await prisma.questionPaper.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(totalMarks && { totalMarks }),
        ...(durationMins && { durationMins }),
        ...(instructions && { instructions }),
        ...(difficulty && { difficulty }),
        ...(status && { status }),
        ...(templateId !== undefined && { templateId }),
        ...(questionsUpdate && { questions: questionsUpdate })
      },
      include: {
        subject: true,
        teacher: safeTeacherInclude,
        questions: { include: { question: true } },
        template: true
      }
    });

    res.json({ success: true, data: qp });

  } catch (error) {
    sendServerError(res, error, 'Failed to update question paper');
  }
};

// SOFT DELETE QP
exports.deleteQP = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.questionPaper.findFirst({
      where: { id, isDeleted: false }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Enforce ownership: Teachers can only delete their own papers
    if (req.user?.role === 'TEACHER' && existing.teacherId !== req.user?.teacherId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to delete this question paper' });
    }

    await prisma.questionPaper.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.json({ success: true, message: 'Question paper deleted successfully' });

  } catch (error) {
    sendServerError(res, error, 'Failed to delete question paper');
  }
};

// PUBLISH QP
exports.publishQP = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.questionPaper.findFirst({
      where: { id, isDeleted: false }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Enforce ownership: Teachers can only publish their own papers
    if (req.user?.role === 'TEACHER' && existing.teacherId !== req.user?.teacherId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to publish this question paper' });
    }

    if (existing.status === 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Question paper already published' });
    }

    const qp = await prisma.questionPaper.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    res.json({ success: true, data: qp });

  } catch (error) {
    sendServerError(res, error, 'Failed to publish question paper');
  }
};

const { exportQPToPDF } = require('../utils/pdfExporter');
const { uploadFileToDrive, ensureFolderStructure } = require('../services/drive.service');
const fs = require('fs');
const path = require('path');
const os = require('os');

// EXPORT QP — STUDENT VERSION
exports.exportQPStudent = async (req, res) => {
  let tempPdfPath = null;
  try {
    const { id } = req.params;

    const qp = await prisma.questionPaper.findFirst({
      where: { id, isDeleted: false },
      include: {
        subject: true,
        questions: { include: { question: true } }
      }
    });

    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Students can only export published papers
    if (req.user?.role === 'STUDENT' && qp.status !== 'PUBLISHED') {
      return res.status(403).json({ success: false, message: 'Question paper is not published yet' });
    }

    const pdfBuffer = await exportQPToPDF(qp, false);

    // Send PDF response immediately to user
    const safeFilename = (qp.title || 'QuestionPaper').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const encodedTitle = encodeURIComponent(`${qp.title || 'QuestionPaper'}-student.pdf`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}-student.pdf"; filename*=UTF-8''${encodedTitle}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

    // Stream generated PDF to Google Drive asynchronously (fire-and-forget, non-blocking)
    setImmediate(async () => {
      let bgTempPath = null;
      try {
        bgTempPath = path.join(os.tmpdir(), `QP_${qp.id}_student_${Date.now()}.pdf`);
        fs.writeFileSync(bgTempPath, pdfBuffer);

        const folderId = await ensureFolderStructure({
          board: qp.board || 'MSB',
          stream: 'Science',
          className: '12th',
          subjectName: qp.subject?.name || 'Subject',
          category: 'Generated Papers'
        });

        const driveRes = await uploadFileToDrive(bgTempPath, `${safeFilename}-Student.pdf`, 'application/pdf', folderId);
        if (driveRes?.driveFileId) {
          await prisma.questionPaper.update({
            where: { id: qp.id },
            data: { driveFileId: driveRes.driveFileId, pdfUrl: driveRes.webViewLink || null }
          }).catch(err => console.warn('⚠️ Failed to update QP driveFileId:', err.message));
        }
      } catch (err) {
        console.warn('⚠️ Google Drive background PDF upload skipped/failed:', err.message);
      } finally {
        if (bgTempPath && fs.existsSync(bgTempPath)) {
          try { fs.unlinkSync(bgTempPath); } catch (e) {}
        }
      }
    });

  } catch (error) {
    console.error('❌ exportQPStudent error:', error);
    sendServerError(res, error, 'Failed to export question paper');
  }
};

// EXPORT QP — TEACHER VERSION (with answers)
exports.exportQPTeacher = async (req, res) => {
  let tempPdfPath = null;
  try {
    const { id } = req.params;

    const where = {
      id,
      isDeleted: false,
      ...(req.user?.role === 'TEACHER' ? { teacherId: req.user.teacherId } : {})
    };

    const qp = await prisma.questionPaper.findFirst({
      where,
      include: {
        subject: true,
        questions: { include: { question: true } }
      }
    });

    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    const pdfBuffer = await exportQPToPDF(qp, true);

    // Send PDF response immediately to user
    const safeFilename = (qp.title || 'QuestionPaper').replace(/[^a-zA-Z0-9_\-]/g, '_');
    const encodedTitle = encodeURIComponent(`${qp.title || 'QuestionPaper'}-answer-key.pdf`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}-answer-key.pdf"; filename*=UTF-8''${encodedTitle}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

    // Stream generated PDF to Google Drive asynchronously (fire-and-forget, non-blocking)
    setImmediate(async () => {
      let bgTempPath = null;
      try {
        bgTempPath = path.join(os.tmpdir(), `QP_${qp.id}_answerkey_${Date.now()}.pdf`);
        fs.writeFileSync(bgTempPath, pdfBuffer);

        const folderId = await ensureFolderStructure({
          board: qp.board || 'MSB',
          stream: 'Science',
          className: '12th',
          subjectName: qp.subject?.name || 'Subject',
          category: 'Generated Papers'
        });

        const driveRes = await uploadFileToDrive(bgTempPath, `${safeFilename}-AnswerKey.pdf`, 'application/pdf', folderId);
        if (driveRes?.driveFileId) {
          await prisma.questionPaper.update({
            where: { id: qp.id },
            data: { driveFileId: driveRes.driveFileId, pdfUrl: driveRes.webViewLink || null }
          }).catch(err => console.warn('⚠️ Failed to update QP driveFileId:', err.message));
        }
      } catch (err) {
        console.warn('⚠️ Google Drive background PDF upload skipped/failed:', err.message);
      } finally {
        if (bgTempPath && fs.existsSync(bgTempPath)) {
          try { fs.unlinkSync(bgTempPath); } catch (e) {}
        }
      }
    });

  } catch (error) {
    console.error('❌ exportQPTeacher error:', error);
    sendServerError(res, error, 'Failed to export answer key');
  }
};