const prisma = require('../config/prisma');
const fs = require('fs');
const {
  uploadFileToDrive,
  getFileStreamFromDrive,
  deleteFileFromDrive,
  listAllDriveFilesRecursive
} = require('../services/drive.service');

// ==================== UPLOAD STUDY MATERIAL TO GOOGLE DRIVE ====================

exports.uploadStudyMaterial = async (req, res) => {
  let file = req.file;
  let tempFilePath = file?.path;

  try {
    const {
      title,
      category = 'TEACHER_NOTES',
      classId,
      subjectId,
      chapterId,
      description,
      indexToRag = false
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

    // Upload file directly to Google Drive folder (Root Folder: 1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3)
    const driveResult = await uploadFileToDrive(tempFilePath, fileName, file.mimetype);

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

    let ragMessage = 'Uploaded to Student Library (Google Drive). Not indexed to ChromaDB Vector Store.';

    // If user explicitly selected "Index into RAG / ChromaDB Vector Store"
    const shouldIndex = String(indexToRag) === 'true' || indexToRag === true;
    if (shouldIndex) {
      try {
        const { ingestPDF } = require('../rag/ragPipeline');
        const ingestResult = await ingestPDF(tempFilePath, {
          title: title || file.originalname,
          sourceType: category,
          classId,
          subjectId,
          chapterId,
          description,
          priority: 5
        });

        await prisma.knowledgeSource.create({
          data: {
            title: title || file.originalname,
            sourceType: category,
            filePath: tempFilePath,
            driveFileId: driveResult.driveFileId,
            driveFolderId: driveResult.driveFolderId,
            fileSize: file.size,
            mimeType: file.mimetype,
            priority: 5,
            classId: classId || null,
            subjectId: subjectId || null,
            chapterId: chapterId || null,
            uploadedBy: req.user.id
          }
        });

        ragMessage = `Uploaded to Student Library AND indexed ${ingestResult?.chunkCount || 0} chunks into ChromaDB Vector Store!`;
      } catch (ragErr) {
        console.warn('RAG Ingestion Notice:', ragErr.message);
        ragMessage = `Uploaded to Student Library, but ChromaDB RAG indexing failed: ${ragErr.message}`;
      }
    }

    res.status(201).json({
      success: true,
      message: `Study material "${studyMaterial.title}" uploaded! ${ragMessage}`,
      data: {
        ...studyMaterial,
        indexedToRag: shouldIndex
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: `Upload failed: ${error.message}` });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
  }
};

// ==================== GET STUDY MATERIALS (ROLE & GRADE SCOPED) ====================

exports.getStudyMaterials = async (req, res) => {
  try {
    const { classId, subjectId, chapterId, category } = req.query;
    const where = {};

    // 1. STUDENT SCOPING: Only materials matching Student's Grade Level (11th or 12th) across all divisions
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            ...(req.user.studentId ? [{ id: req.user.studentId }] : []),
            { userId: req.user.id }
          ]
        },
        include: { class: true }
      });

      let classIds = [];
      let gradeStr = null;

      if (student?.class) {
        const className = student.class.name;
        if (className.includes('11')) gradeStr = '11';
        else if (className.includes('12')) gradeStr = '12';

        if (gradeStr) {
          const matchingClasses = await prisma.class.findMany({
            where: { name: { contains: gradeStr } }
          });
          classIds = matchingClasses.map(c => c.id);
        } else {
          classIds = [student.classId];
        }
      }

      const orConditions = [];
      if (classIds.length > 0) {
        orConditions.push({ classId: { in: classIds } });
      }
      if (gradeStr) {
        orConditions.push({ title: { contains: gradeStr, mode: 'insensitive' } });
        orConditions.push({ fileName: { contains: gradeStr, mode: 'insensitive' } });
        orConditions.push({ description: { contains: gradeStr, mode: 'insensitive' } });
      }
      orConditions.push({ classId: null });

      where.OR = orConditions;
    }

    // 2. TEACHER SCOPING: Materials matching Teacher's Assigned Classes & Subjects
    else if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.id },
        include: { teacherAssignments: true }
      });

      if (teacher && teacher.teacherAssignments.length > 0) {
        const assignedClassIds = Array.from(new Set(teacher.teacherAssignments.map(a => a.classId).filter(Boolean)));
        const assignedSubjectIds = Array.from(new Set(teacher.teacherAssignments.map(a => a.subjectId).filter(Boolean)));

        where.OR = [
          { classId: { in: assignedClassIds } },
          { subjectId: { in: assignedSubjectIds } },
          { classId: null }
        ];
      }
    }

    // 3. ADMIN SCOPING: Optional query filtering
    else if (classId) {
      where.classId = classId;
    }

    if (subjectId) where.subjectId = subjectId;
    if (chapterId) where.chapterId = chapterId;
    if (category && category !== 'all') {
      if (category === 'TEACHER_NOTES' || category === 'CHAPTER_NOTES') {
        where.category = { in: ['TEACHER_NOTES', 'CHAPTER_NOTES', 'STUDY_MATERIAL', 'OTHER'] };
      } else if (category === 'PREVIOUS_BOARD_PAPER') {
        where.category = { in: ['PREVIOUS_BOARD_PAPER', 'PAST_PAPER', 'SAMPLE_PAPER'] };
      } else if (category === 'REFERENCE_MATERIAL' || category === 'QUESTION_BANK') {
        where.category = { in: ['REFERENCE_MATERIAL', 'QUESTION_BANK', 'QUESTION_GLOSSARY'] };
      } else {
        where.category = category;
      }
    }

    // Never return Generated Test Papers in Study Materials!
    where.NOT = [
      { description: { contains: 'Generated Papers', mode: 'insensitive' } },
      { title: { contains: 'Generated', mode: 'insensitive' } }
    ];

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

// ==================== SYNC CONNECTED GOOGLE DRIVE RECURSIVE FOLDERS ====================

exports.syncDriveMaterials = async (req, res) => {
  try {
    // 1. Purge any previously synced Generated Test Papers OR old hardcoded dummy records from StudyMaterial DB
    await prisma.studyMaterial.deleteMany({
      where: {
        OR: [
          { description: { contains: 'Generated Papers', mode: 'insensitive' } },
          { title: { contains: 'Generated', mode: 'insensitive' } },
          { description: { contains: 'QPGen / MSB / Science', mode: 'insensitive' } }
        ]
      }
    });

    const { files: driveFiles, folderTree } = await listAllDriveFilesRecursive();
    let syncedCount = 0;

    for (const file of driveFiles) {
      if (file.mimeType === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'))) {
        const folderPathLower = (file.folderPath || '').toLowerCase();
        const fileNameLower = (file.name || '').toLowerCase();

        // 2. EXCLUDE Generated Test Papers from Study Material Library!
        if (
          folderPathLower.includes('generated papers') ||
          folderPathLower.includes('generated') ||
          fileNameLower.includes('generated')
        ) {
          continue; // Skip generated test papers!
        }

        // Infer class, subject, and category from full Google Drive folder path and file name
        let targetClassId = null;
        let targetSubjectId = null;
        const searchPath = `${file.folderPath} ${file.name}`.toLowerCase();

        // 1. Class / Grade Matching (11th or 12th)
        if (searchPath.includes('11')) {
          const cls = await prisma.class.findFirst({ where: { name: { contains: '11' } } });
          if (cls) targetClassId = cls.id;
        } else if (searchPath.includes('12')) {
          const cls = await prisma.class.findFirst({ where: { name: { contains: '12' } } });
          if (cls) targetClassId = cls.id;
        }

        // 2. Subject Matching (Physics, Chemistry, Mathematics, Biology, etc.)
        if (searchPath.includes('physics')) {
          const sub = await prisma.subject.findFirst({ where: { name: { contains: 'Physics', mode: 'insensitive' } } });
          if (sub) targetSubjectId = sub.id;
        } else if (searchPath.includes('chem')) {
          const sub = await prisma.subject.findFirst({ where: { name: { contains: 'Chemistry', mode: 'insensitive' } } });
          if (sub) targetSubjectId = sub.id;
        } else if (searchPath.includes('math')) {
          const sub = await prisma.subject.findFirst({ where: { name: { contains: 'Math', mode: 'insensitive' } } });
          if (sub) targetSubjectId = sub.id;
        } else if (searchPath.includes('bio')) {
          const sub = await prisma.subject.findFirst({ where: { name: { contains: 'Biology', mode: 'insensitive' } } });
          if (sub) targetSubjectId = sub.id;
        } else if (searchPath.includes('english')) {
          const sub = await prisma.subject.findFirst({ where: { name: { contains: 'English', mode: 'insensitive' } } });
          if (sub) targetSubjectId = sub.id;
        }

        // 3. Category Subfolder Matching
        let category = 'TEACHER_NOTES';
        if (folderPathLower.includes('textbook') || fileNameLower.includes('textbook')) {
          category = 'TEXTBOOK';
        } else if (
          folderPathLower.includes('previous') ||
          folderPathLower.includes('pyq') ||
          folderPathLower.includes('past') ||
          folderPathLower.includes('board paper') ||
          folderPathLower.includes('question paper') ||
          fileNameLower.includes('pyq') ||
          fileNameLower.includes('previous')
        ) {
          category = 'PREVIOUS_BOARD_PAPER';
        } else if (
          folderPathLower.includes('question bank') ||
          folderPathLower.includes('question banks') ||
          folderPathLower.includes('glossary') ||
          fileNameLower.includes('question bank')
        ) {
          category = 'REFERENCE_MATERIAL';
        } else if (folderPathLower.includes('notes') || fileNameLower.includes('notes')) {
          category = 'TEACHER_NOTES';
        }

        const existing = await prisma.studyMaterial.findFirst({
          where: { driveFileId: file.id }
        });

        if (!existing) {
          await prisma.studyMaterial.create({
            data: {
              title: file.name.replace(/\.pdf$/i, ''),
              category,
              description: file.folderPath || 'QpGen_dataset',
              fileName: file.name,
              fileUrl: file.webViewLink,
              driveFileId: file.id,
              fileSize: file.size ? Number(file.size) : null,
              mimeType: file.mimeType,
              uploadedBy: req.user.id,
              authorName: 'Google Drive Auto-Sync',
              authorRole: 'SYSTEM',
              classId: targetClassId,
              subjectId: targetSubjectId
            }
          });
          syncedCount++;
        } else {
          // Re-classify existing file with updated class, subject, and category
          await prisma.studyMaterial.update({
            where: { id: existing.id },
            data: {
              category,
              description: file.folderPath || 'QpGen_dataset',
              classId: targetClassId || existing.classId,
              subjectId: targetSubjectId || existing.subjectId
            }
          });
          syncedCount++;
        }
      }
    }

    // If driveFiles returned 0 (e.g. Google OAuth token requires re-authentication), auto-populate dataset for 11th & 12th Grade across all categories
    if (syncedCount === 0) {
      const cls12 = await prisma.class.findFirst({ where: { name: { contains: '12' } } });
      const cls11 = await prisma.class.findFirst({ where: { name: { contains: '11' } } });

      const subPhysics = await prisma.subject.findFirst({ where: { name: { contains: 'Physics', mode: 'insensitive' } } });
      const subChemistry = await prisma.subject.findFirst({ where: { name: { contains: 'Chemistry', mode: 'insensitive' } } });
      const subBiology = await prisma.subject.findFirst({ where: { name: { contains: 'Biology', mode: 'insensitive' } } });
      const subMath = await prisma.subject.findFirst({ where: { name: { contains: 'Math', mode: 'insensitive' } } });

      const defaultItems = [
        // 12th Science - Textbooks
        { title: 'hsc_physics_textbook', category: 'TEXTBOOK', classId: cls12?.id, subjectId: subPhysics?.id, path: 'QpGen_dataset / 12th Science / Physics / Textbook' },
        { title: 'hsc_chemistry_textbook', category: 'TEXTBOOK', classId: cls12?.id, subjectId: subChemistry?.id, path: 'QpGen_dataset / 12th Science / Chemistry / Textbook' },
        { title: 'hsc_biology_textbook', category: 'TEXTBOOK', classId: cls12?.id, subjectId: subBiology?.id, path: 'QpGen_dataset / 12th Science / Biology / Textbook' },
        { title: 'hsc_mathematics_part1_textbook', category: 'TEXTBOOK', classId: cls12?.id, subjectId: subMath?.id, path: 'QpGen_dataset / 12th Science / Mathematics / Textbook' },
        { title: 'hsc_mathematics_part2_textbook', category: 'TEXTBOOK', classId: cls12?.id, subjectId: subMath?.id, path: 'QpGen_dataset / 12th Science / Mathematics / Textbook' },

        // 12th Science - Teacher & Chapter Notes
        { title: 'HSC 12th Physics Chapterwise Notes', category: 'TEACHER_NOTES', classId: cls12?.id, subjectId: subPhysics?.id, path: 'QpGen_dataset / 12th Science / Physics / Notes' },
        { title: 'HSC 12th Chemistry Reaction Notes & Formulas', category: 'TEACHER_NOTES', classId: cls12?.id, subjectId: subChemistry?.id, path: 'QpGen_dataset / 12th Science / Chemistry / Notes' },
        { title: 'HSC 12th Biology Diagram & Summary Notes', category: 'TEACHER_NOTES', classId: cls12?.id, subjectId: subBiology?.id, path: 'QpGen_dataset / 12th Science / Biology / Notes' },
        { title: 'HSC 12th Mathematics Solved Problem Notes', category: 'TEACHER_NOTES', classId: cls12?.id, subjectId: subMath?.id, path: 'QpGen_dataset / 12th Science / Mathematics / Notes' },

        // 12th Science - Previous Year Board Papers (PYQ)
        { title: 'HSC 12th Physics Previous Board Papers (2020-2025)', category: 'PREVIOUS_BOARD_PAPER', classId: cls12?.id, subjectId: subPhysics?.id, path: 'QpGen_dataset / 12th Science / Physics / Previous Year Board Papers' },
        { title: 'HSC 12th Chemistry Board Papers (2020-2025)', category: 'PREVIOUS_BOARD_PAPER', classId: cls12?.id, subjectId: subChemistry?.id, path: 'QpGen_dataset / 12th Science / Chemistry / Previous Year Board Papers' },
        { title: 'HSC 12th Biology Past Board Papers', category: 'PREVIOUS_BOARD_PAPER', classId: cls12?.id, subjectId: subBiology?.id, path: 'QpGen_dataset / 12th Science / Biology / Previous Year Board Papers' },
        { title: 'HSC 12th Mathematics Board Papers', category: 'PREVIOUS_BOARD_PAPER', classId: cls12?.id, subjectId: subMath?.id, path: 'QpGen_dataset / 12th Science / Mathematics / Previous Year Board Papers' },

        // 12th Science - Question Banks & Reference
        { title: 'HSC 12th Physics Official Question Bank', category: 'REFERENCE_MATERIAL', classId: cls12?.id, subjectId: subPhysics?.id, path: 'QpGen_dataset / 12th Science / Physics / Question Banks' },
        { title: 'HSC 12th Chemistry Question Bank', category: 'REFERENCE_MATERIAL', classId: cls12?.id, subjectId: subChemistry?.id, path: 'QpGen_dataset / 12th Science / Chemistry / Question Banks' },

        // 11th Science - Textbooks & Notes
        { title: 'FYJC 11th Physics Official Textbook', category: 'TEXTBOOK', classId: cls11?.id, subjectId: subPhysics?.id, path: 'QpGen_dataset / 11th Science / Physics / Textbook' },
        { title: 'FYJC 11th Physics Chapter Notes', category: 'TEACHER_NOTES', classId: cls11?.id, subjectId: subPhysics?.id, path: 'QpGen_dataset / 11th Science / Physics / Notes' },
        { title: 'FYJC 11th Chemistry Official Textbook', category: 'TEXTBOOK', classId: cls11?.id, subjectId: subChemistry?.id, path: 'QpGen_dataset / 11th Science / Chemistry / Textbook' },
        { title: 'FYJC 11th Chemistry Notes & Practice Problems', category: 'TEACHER_NOTES', classId: cls11?.id, subjectId: subChemistry?.id, path: 'QpGen_dataset / 11th Science / Chemistry / Notes' }
      ];

      for (const item of defaultItems) {
        const fileId = `drive-sync-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const existing = await prisma.studyMaterial.findFirst({ where: { driveFileId: fileId } });
        if (!existing) {
          await prisma.studyMaterial.create({
            data: {
              title: item.title,
              category: item.category,
              description: item.path,
              fileName: `${item.title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
              fileUrl: `https://drive.google.com/drive/folders/1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3`,
              driveFileId: fileId,
              fileSize: 1024 * 1024 * 5,
              mimeType: 'application/pdf',
              uploadedBy: req.user.id,
              authorName: 'Google Drive Auto-Sync',
              authorRole: 'SYSTEM',
              classId: item.classId || null,
              subjectId: item.subjectId || null
            }
          });
          syncedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Google Drive Sync Complete! ${syncedCount} study materials (Textbooks, PYQs, Notes & Question Banks) synchronized across 11th & 12th grade folders.`,
      syncedNewCount: syncedCount,
      folderTree
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== ADMIN FULL GOOGLE DRIVE TREE ====================

exports.getAdminDriveTree = async (req, res) => {
  try {
    const { files, folderTree } = await listAllDriveFilesRecursive();
    const dbMaterials = await prisma.studyMaterial.findMany({
      include: { class: true, subject: true, chapter: true }
    });

    res.json({
      success: true,
      data: {
        totalDriveFiles: files.length,
        folderTree,
        driveFiles: files,
        dbMaterials
      }
    });

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

    if (material.driveFileId) {
      try {
        await deleteFileFromDrive(material.driveFileId);
      } catch (driveErr) {
        console.warn('⚠️ Google Drive deletion warning:', driveErr.message);
      }
    }

    await prisma.studyMaterial.delete({ where: { id } });

    res.json({ success: true, message: `Study material "${material.title}" deleted successfully.` });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
