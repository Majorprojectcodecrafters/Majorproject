const prisma = require('../config/prisma');

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
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET ALL QP
exports.getAllQP = async (req, res) => {
  try {
    const { status, subjectId, difficulty, page = 1, limit = 10 } = req.query;

    const where = {
      isDeleted: false,
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
    res.status(500).json({ success: false, error: error.message });
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

    res.json({ success: true, data: qp });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
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

    await prisma.questionPaper.update({
      where: { id },
      data: { isDeleted: true }
    });

    res.json({ success: true, message: 'Question paper deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    if (existing.status === 'PUBLISHED') {
      return res.status(400).json({ success: false, message: 'Question paper already published' });
    }

    const qp = await prisma.questionPaper.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    res.json({ success: true, data: qp });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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

    const pdfBuffer = await exportQPToPDF(qp, false);

    // Stream generated PDF to Google Drive asynchronously
    tempPdfPath = path.join(os.tmpdir(), `QP_${qp.id}_student.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    ensureFolderStructure({
      board: qp.board || 'MSB',
      stream: 'Science',
      className: '12th',
      subjectName: qp.subject?.name || 'Subject',
      category: 'Generated Papers'
    }).then(folderId => {
      return uploadFileToDrive(tempPdfPath, `${qp.title}-Student.pdf`, 'application/pdf', folderId);
    }).then(driveRes => {
      if (driveRes?.driveFileId) {
        prisma.questionPaper.update({
          where: { id: qp.id },
          data: { driveFileId: driveRes.driveFileId, pdfUrl: driveRes.webViewLink || null }
        }).catch(err => console.warn('⚠️ Failed to update QP driveFileId:', err.message));
      }
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        try { fs.unlinkSync(tempPdfPath); } catch (e) {}
      }
    }).catch(err => {
      console.warn('⚠️ Google Drive background PDF upload skipped/failed:', err.message);
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        try { fs.unlinkSync(tempPdfPath); } catch (e) {}
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${qp.title}-student.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try { fs.unlinkSync(tempPdfPath); } catch (e) {}
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// EXPORT QP — TEACHER VERSION (with answers)
exports.exportQPTeacher = async (req, res) => {
  let tempPdfPath = null;
  try {
    const { id } = req.params;

    const qp = await prisma.questionPaper.findFirst({
      where: { id, isDeleted: false, teacherId: req.user.teacherId },
      include: {
        subject: true,
        questions: { include: { question: true } }
      }
    });

    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    const pdfBuffer = await exportQPToPDF(qp, true);

    // Stream generated PDF to Google Drive asynchronously
    tempPdfPath = path.join(os.tmpdir(), `QP_${qp.id}_answerkey.pdf`);
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    ensureFolderStructure({
      board: qp.board || 'MSB',
      stream: 'Science',
      className: '12th',
      subjectName: qp.subject?.name || 'Subject',
      category: 'Generated Papers'
    }).then(folderId => {
      return uploadFileToDrive(tempPdfPath, `${qp.title}-AnswerKey.pdf`, 'application/pdf', folderId);
    }).then(driveRes => {
      if (driveRes?.driveFileId) {
        prisma.questionPaper.update({
          where: { id: qp.id },
          data: { driveFileId: driveRes.driveFileId, pdfUrl: driveRes.webViewLink || null }
        }).catch(err => console.warn('⚠️ Failed to update QP driveFileId:', err.message));
      }
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        try { fs.unlinkSync(tempPdfPath); } catch (e) {}
      }
    }).catch(err => {
      console.warn('⚠️ Google Drive background PDF upload skipped/failed:', err.message);
      if (tempPdfPath && fs.existsSync(tempPdfPath)) {
        try { fs.unlinkSync(tempPdfPath); } catch (e) {}
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${qp.title}-answer-key.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    if (tempPdfPath && fs.existsSync(tempPdfPath)) {
      try { fs.unlinkSync(tempPdfPath); } catch (e) {}
    }
    res.status(500).json({ success: false, error: error.message });
  }
};