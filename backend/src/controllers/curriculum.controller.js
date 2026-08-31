const prisma = require('../config/prisma');

// Get all boards
exports.getBoards = async (req, res) => {
  try {
    const boards = await prisma.board.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: boards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get classes (optionally filtered by boardId or streamId)
exports.getClasses = async (req, res) => {
  try {
    const { boardId, streamId } = req.query;
    const where = {};
    if (boardId) where.boardId = boardId;
    if (streamId) where.streamId = streamId;

    const classes = await prisma.class.findMany({
      where,
      include: {
        stream: true,
        board: true
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get subjects for a selected class (Class-First Cascading)
exports.getSubjectsByClass = async (req, res) => {
  try {
    const { classId } = req.query;

    if (!classId) {
      // Fallback: list all subjects
      const subjects = await prisma.subject.findMany({
        include: { stream: true },
        orderBy: { name: 'asc' }
      });
      return res.json({ success: true, data: subjects });
    }

    const classSubjects = await prisma.classSubject.findMany({
      where: { classId },
      include: {
        subject: {
          include: { stream: true }
        }
      }
    });

    const subjects = classSubjects.map(cs => cs.subject);
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get units for a subject
exports.getUnits = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    const units = await prisma.unit.findMany({
      where: { subjectId },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: units });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get chapters for a subject (including topics & page ranges)
exports.getChapters = async (req, res) => {
  try {
    const { subjectId, unitId } = req.query;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    const where = { subjectId };
    if (unitId) where.unitId = unitId;

    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        unit: true,
        topics: { orderBy: { name: 'asc' } },
        chapterWeightages: true
      },
      orderBy: [
        { chapterNo: 'asc' },
        { name: 'asc' }
      ]
    });
    res.json({ success: true, data: chapters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get topics for a chapter
exports.getTopics = async (req, res) => {
  try {
    const { chapterId } = req.query;
    if (!chapterId) return res.status(400).json({ success: false, message: 'chapterId is required' });

    const topics = await prisma.topic.findMany({
      where: { chapterId },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get official board weightage for class + subject
exports.getWeightage = async (req, res) => {
  try {
    const { classId, subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ success: false, message: 'subjectId is required' });

    const where = { subjectId };
    if (classId) where.classId = classId;

    const weightages = await prisma.chapterWeightage.findMany({
      where,
      include: {
        unit: true,
        chapter: {
          include: { topics: true }
        }
      }
    });

    res.json({ success: true, data: weightages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Trigger automated official MSB syllabus topics mapping & sync
exports.syncSyllabusTopics = async (req, res) => {
  try {
    const { syncOfficialSyllabusTopics } = require('../services/syllabusMapperService');
    const result = await syncOfficialSyllabusTopics();
    res.json({
      success: true,
      message: 'Official MSB syllabus topics mapped and synchronized successfully.',
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
