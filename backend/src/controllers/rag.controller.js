const path = require('path');
const fs = require('fs');
const os = require('os');
const { ingestPDF } = require('../rag/ragPipeline');
const { generateQuestionPaper } = require('../rag/qpGenerator');
const { getStats, deleteBySource, deleteBySourceId, deleteBySubject, deleteByGrade } = require('../rag/vectorStore');
const { uploadFileToDrive, downloadFileFromDrive, getFileStreamFromDrive, deleteFileFromDrive, ensureFolderStructure } = require('../services/drive.service');
const prisma = require('../config/prisma');

// Default priority mapping for knowledge sources (textbooks have highest precedence)
const SOURCE_PRIORITY_MAP = {
  TEXTBOOK: 10,
  QUESTION_GLOSSARY: 8,
  QUESTION_BANK: 8,
  CHAPTER_NOTES: 7,
  TEACHER_NOTES: 7,
  PREVIOUS_BOARD_PAPER: 6,
  SAMPLE_PAPER: 6,
  REFERENCE_MATERIAL: 4,
  STUDY_MATERIAL: 4,
  OTHER: 2
};

// ==================== INGEST KNOWLEDGE SOURCE ====================

exports.ingestPDF = async (req, res) => {
  let file = req.file;
  let tempFilePath = file?.path;

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
      grade,
      version = '1.0',
      academicYear
    } = req.body;

    if (!file) return res.status(400).json({ success: false, message: 'No PDF file uploaded' });

    let subjectName = '';
    let chapterName = '';
    let className = '12th';
    let boardName = 'MSB';
    let streamName = 'Science';

    if (subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (subject) subjectName = subject.name;
    }
    if (classId) {
      const cls = await prisma.class.findUnique({ where: { id: classId } });
      if (cls) className = cls.name;
    }
    if (chapterId) {
      const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
      if (chapter) chapterName = chapter.name;
    }

    // 1. Resolve target Google Drive folder
    const targetFolderId = await ensureFolderStructure({
      board: boardName,
      stream: streamName,
      className,
      subjectName,
      category: sourceType || 'Textbooks'
    });

    // 2. Upload file stream to Google Drive
    const driveResult = await uploadFileToDrive(
      tempFilePath,
      file.originalname,
      file.mimetype || 'application/pdf',
      targetFolderId
    );

    const sourcePriority = SOURCE_PRIORITY_MAP[sourceType] || 10;

    // 3. Create KnowledgeSource record in Prisma DB with driveFileId reference
    const ks = await prisma.knowledgeSource.create({
      data: {
        title: title || file.originalname,
        sourceType: sourceType || 'TEXTBOOK',
        fileName: file.originalname,
        filePath: driveResult.driveFileId,
        fileSize: file.size,
        status: 'PROCESSING',
        uploadedBy: req.user?.id || 'system',
        description: description || null,
        boardId: boardId || null,
        streamId: streamId || null,
        classId: classId || null,
        subjectId: subjectId || null,
        unitId: unitId || null,
        chapterId: chapterId || null,
        topicId: topicId || null,
        driveFileId: driveResult.driveFileId,
        driveFolderId: driveResult.driveFolderId,
        mimeType: file.mimetype || 'application/pdf',
        fileUrl: driveResult.webViewLink || null,
        version: version || '1.0',
        academicYear: academicYear || null,
        isActive: true,
        sourcePriority
      }
    });

    // 4. Ingest into ChromaDB vector store
    let result;
    try {
      result = await ingestPDF(tempFilePath, {
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
        grade: grade || '',
        version: version || '1.0',
        academicYear: academicYear || '',
        isActive: true,
        sourcePriority
      });

      // Mark status PROCESSED upon successful indexing
      await prisma.knowledgeSource.update({
        where: { id: ks.id },
        data: { status: 'PROCESSED' }
      });

    } catch (ingestError) {
      console.error('❌ ChromaDB Vector Ingestion failed:', ingestError.message);
      // Mark status FAILED while preserving original file in Google Drive
      await prisma.knowledgeSource.update({
        where: { id: ks.id },
        data: { status: 'FAILED' }
      });

      return res.status(207).json({
        success: false,
        message: 'File preserved safely in Google Drive, but vector indexing failed. Use the reprocess option to retry.',
        data: { knowledgeSourceId: ks.id, status: 'FAILED', error: ingestError.message }
      });
    } finally {
      // 5. Clean up temporary local upload file from backend disk
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
      }
    }

    res.status(201).json({ success: true, data: { ...result, knowledgeSource: ks } });

  } catch (error) {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== REPROCESS KNOWLEDGE SOURCE ====================

exports.reprocessKnowledgeSource = async (req, res) => {
  let tempPath = null;
  try {
    const { id } = req.params;
    const ks = await prisma.knowledgeSource.findUnique({
      where: { id },
      include: { subject: true, chapter: true }
    });

    if (!ks) return res.status(404).json({ success: false, message: 'Knowledge source not found' });
    if (!ks.driveFileId) return res.status(400).json({ success: false, message: 'No Google Drive file reference found' });

    tempPath = path.join(os.tmpdir(), `reprocess_${Date.now()}_${ks.fileName}`);

    // 1. Download file stream from Google Drive
    await downloadFileFromDrive(ks.driveFileId, tempPath);

    // 2. Clear old chunks if any
    await deleteBySourceId(ks.id);

    // 3. Re-ingest into ChromaDB
    const result = await ingestPDF(tempPath, {
      knowledgeSourceId: ks.id,
      sourceType: ks.sourceType,
      boardId: ks.boardId || '',
      streamId: ks.streamId || '',
      classId: ks.classId || '',
      subjectId: ks.subjectId || '',
      subjectName: ks.subject?.name || '',
      unitId: ks.unitId || '',
      chapterId: ks.chapterId || '',
      chapterName: ks.chapter?.name || '',
      topicId: ks.topicId || '',
      version: ks.version || '1.0',
      academicYear: ks.academicYear || '',
      isActive: ks.isActive,
      sourcePriority: ks.sourcePriority
    });

    // 4. Update status to PROCESSED
    await prisma.knowledgeSource.update({
      where: { id: ks.id },
      data: { status: 'PROCESSED' }
    });

    res.json({ success: true, message: `Knowledge source "${ks.title}" reprocessed successfully`, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: `Reprocessing failed: ${error.message}` });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch (e) {}
    }
  }
};

// ==================== PRIVATE DOWNLOAD STREAM ====================

exports.downloadKnowledgeSource = async (req, res) => {
  try {
    const { id } = req.params;
    const ks = await prisma.knowledgeSource.findUnique({ where: { id } });
    if (!ks) return res.status(404).json({ success: false, message: 'Document not found' });

    if (ks.driveFileId) {
      const stream = await getFileStreamFromDrive(ks.driveFileId);
      if (stream) {
        res.setHeader('Content-Type', ks.mimeType || 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${ks.fileName}"`);
        return stream.pipe(res);
      }
    }

    // Fallback if file was saved locally
    if (fs.existsSync(ks.filePath)) {
      return res.download(ks.filePath, ks.fileName);
    }

    res.status(404).json({ success: false, message: 'File asset unavailable' });
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
      orderBy: [
        { sourcePriority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ success: true, data: sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete knowledge source with 3-tier synchronized cleanup (DB + Drive + Chroma)
exports.deleteKnowledgeSource = async (req, res) => {
  try {
    const { id } = req.params;

    const ks = await prisma.knowledgeSource.findUnique({ where: { id } });
    if (!ks) return res.status(404).json({ success: false, message: 'Knowledge source not found' });

    // 1. Purge chunks from ChromaDB
    await deleteBySourceId(ks.id);
    await deleteBySource(ks.fileName);

    // 2. Delete file from Google Drive
    if (ks.driveFileId) {
      await deleteFileFromDrive(ks.driveFileId);
    }

    // 3. Delete local temp file if it exists
    if (fs.existsSync(ks.filePath)) {
      try { fs.unlinkSync(ks.filePath); } catch (e) {}
    }

    // 4. Delete record from Prisma DB
    await prisma.knowledgeSource.delete({ where: { id } });

    res.json({ success: true, message: `Knowledge source "${ks.title}" deleted successfully from Database, Google Drive, and ChromaDB.` });
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
      return res.status(400).json({
        success: false,
        statusCode: 400,
        reason: 'MISSING_REQUIRED_INPUTS',
        message: 'subjectId and at least one chapter or topic are required.',
        actionableSuggestion: 'Please select a subject and at least one chapter from Step 1 & Step 3.'
      });
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
    console.error('❌ RAG Question Paper Generation Failed:', error.message);

    let reason = 'QUESTION_PAPER_GENERATION_FAILED';
    let suggestion = 'Please retry generation or adjust your pattern and syllabus parameters.';

    if (error.message.includes('Insufficient curriculum knowledge') || error.message.includes('Insufficient indexed curriculum')) {
      reason = 'INSUFFICIENT_CURRICULUM_KNOWLEDGE';
      suggestion = 'Upload or index relevant textbook chapters/notes for this subject before generating questions.';
    } else if (error.message.includes('content quality validation')) {
      reason = 'CONTENT_QUALITY_VALIDATION_FAILED';
      suggestion = 'The AI model generated questions that did not meet strict curriculum or MCQ choice guidelines. Try re-running generation.';
    } else if (error.message.includes('invalid JSON') || error.message.includes('parse JSON')) {
      reason = 'LLM_OUTPUT_PARSING_ERROR';
      suggestion = 'The AI model response was truncated or malformed. Retrying generation will request a fresh response.';
    } else if (error.message.includes('Board pattern is currently unavailable')) {
      reason = 'BOARD_PATTERN_UNAVAILABLE';
      suggestion = 'Use Customized Pattern Mode to define custom sections for this subject.';
    }

    res.status(422).json({
      success: false,
      statusCode: 422,
      reason,
      message: error.message,
      error: error.message,
      details: error.errors || [error.message],
      actionableSuggestion: suggestion
    });
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

    // 1. Save all questions sequentially to DB to preserve exact pattern sequence
    const savedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const createdQ = await prisma.question.create({
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
      });
      savedQuestions.push(createdQ);
    }

    // 2. Create question paper with pattern snapshot, audit metadata, and linked questions
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
        llmProvider: req.body.llmProvider || process.env.LLM_PROVIDER || 'groq',
        llmModel: req.body.llmModel || process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        generatedAt: new Date(),
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