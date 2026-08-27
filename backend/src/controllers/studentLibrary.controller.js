const prisma = require('../config/prisma');
const fs = require('fs');
const { uploadFileToDrive, getFileStreamFromDrive, deleteFileFromDrive } = require('../services/drive.service');

// ==================== UPLOAD STUDY MATERIAL TO GOOGLE DRIVE ====================

exports.uploadStudyMaterial = async (req, res) => {
  let file = req.file;
  let tempFilePath = file?.path;

  try {
    const {
      title,
      category = 'TEACHER_NOTES', // "TEACHER_NOTES", "CHAPTER_NOTES", "TEXTBOOK", "PAST_PAPER", "REFERENCE"
      classId,
      subjectId,
      chapterId,
      description
    } = req.body;

    if (!file) return res.status(400).json({ success: false, message: 'No PDF note or study material file uploaded' });

    let subjectName = 'General';
    let className = '12th';

    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (subject) subjectName = subject.name;
    }
    if (classId) {
      const cls = await prisma.class.findUnique({ where: { id: classId } });
      if (cls) className = cls.name;
    }

    const fileName = `${className}_${subjectName}_${Date.now()}_${file.originalname}`;

    // 1. Upload file directly to Google Drive folder (with copy/download lockdown)
    const driveResult = await uploadFileToDrive(tempFilePath, fileName, file.mimetype);

    // 2. Save metadata in StudyMaterial table (Separate from RAG KnowledgeSource)
    const studyMaterial = await prisma.studyMaterial.create({
      data: {
        title: title || file.originalname,
        category,
        description,
        fileName: file.originalname,
        fileUrl: driveResult.webViewLink,
        driveFileId: driveResult.driveFileId,
        driveFolderId: driveResult.driveFolderId,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: req.user.id,
        authorName: req.user.name,
        authorRole: req.user.role,
        classId: classId || null,
        subjectId: subjectId || null,
        chapterId: chapterId || null
      },
      include: {
        class: true,
        subject: true,
        chapter: true
      }
    });

    res.status(201).json({
      success: true,
      message: `Study material "${studyMaterial.title}" uploaded cleanly to Google Drive!`,
      data: studyMaterial
    });

  } catch (error) {
    res.status(500).json({ success: false, error: `Upload failed: ${error.message}` });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
  }
};

// ==================== GET STUDY MATERIALS ====================

exports.getStudyMaterials = async (req, res) => {
  try {
    const { classId, subjectId, chapterId, category } = req.query;
    const where = {};

    // Filter by student class if student role
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { id: req.user.studentId } });
      if (student?.classId) {
        where.OR = [
          { classId: student.classId },
          { classId: null }
        ];
      }
    } else if (classId) {
      where.classId = classId;
    }

    if (subjectId) where.subjectId = subjectId;
    if (chapterId) where.chapterId = chapterId;
    if (category && category !== 'all') where.category = category;

    const materials = await prisma.studyMaterial.findMany({
      where,
      include: {
        class: true,
        subject: true,
        chapter: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: materials });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SECURE STREAM INLINE (NO DOWNLOAD) ====================

exports.streamStudyMaterialSecure = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await prisma.studyMaterial.findUnique({ where: { id } });

    if (!material) return res.status(404).json({ success: false, message: 'Study material not found' });

    res.setHeader('Content-Type', material.mimeType || 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="protected_study_material.pdf"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    if (material.driveFileId) {
      const stream = await getFileStreamFromDrive(material.driveFileId);
      if (stream) {
        return stream.pipe(res);
      }
    }

    res.status(404).json({ success: false, message: 'Study material stream unavailable' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== DELETE STUDY MATERIAL ====================

exports.deleteStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const material = await prisma.studyMaterial.findUnique({ where: { id } });

    if (!material) return res.status(404).json({ success: false, message: 'Study material not found' });

    // Delete from Google Drive
    if (material.driveFileId) {
      try {
        await deleteFileFromDrive(material.driveFileId);
      } catch (driveErr) {
        console.warn('⚠️ Google Drive deletion warning:', driveErr.message);
      }
    }

    // Delete Prisma DB record
    await prisma.studyMaterial.delete({ where: { id } });

    res.json({ success: true, message: `Study material "${material.title}" deleted successfully.` });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
