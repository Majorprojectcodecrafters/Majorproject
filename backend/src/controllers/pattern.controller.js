const prisma = require('../config/prisma');
const { getBoardPatternForSubject, getAllBoardPatterns } = require('../config/boardPatterns');

// ==================== BOARD PATTERNS ====================

exports.getBoardPatterns = async (req, res) => {
  try {
    const patterns = getAllBoardPatterns();
    res.json({ success: true, data: patterns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBoardPatternBySubject = async (req, res) => {
  try {
    const { subjectName } = req.params;
    const pattern = getBoardPatternForSubject(subjectName);

    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: `Board pattern is currently unavailable for subject: "${subjectName}". Please use Customized Pattern mode.`
      });
    }

    res.json({ success: true, data: pattern });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== CUSTOM PATTERNS (TEACHER CRUD & OWNERSHIP) ====================

// 1. Create Custom Pattern
exports.createCustomPattern = async (req, res) => {
  try {
    const { name, totalMarks, durationMins, patternData } = req.body;
    const teacherId = req.user.teacherId;

    if (!name || !totalMarks || !durationMins || !patternData) {
      return res.status(400).json({
        success: false,
        message: 'name, totalMarks, durationMins, and patternData are required'
      });
    }

    const customPattern = await prisma.customPattern.create({
      data: {
        name,
        teacherId,
        totalMarks: Number(totalMarks),
        durationMins: Number(durationMins),
        patternData
      }
    });

    res.status(201).json({ success: true, data: customPattern });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. List Custom Patterns (Enforce Teacher Ownership)
exports.getCustomPatterns = async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN'
      ? {}
      : { teacherId: req.user.teacherId };

    const patterns = await prisma.customPattern.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: patterns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Get Custom Pattern by ID (Ownership Check)
exports.getCustomPatternById = async (req, res) => {
  try {
    const { id } = req.params;

    const pattern = await prisma.customPattern.findUnique({
      where: { id }
    });

    if (!pattern) {
      return res.status(404).json({ success: false, message: 'Custom pattern not found' });
    }

    if (req.user.role !== 'ADMIN' && pattern.teacherId !== req.user.teacherId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this pattern' });
    }

    res.json({ success: true, data: pattern });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Update Custom Pattern by ID (Ownership Check)
exports.updateCustomPattern = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, totalMarks, durationMins, patternData } = req.body;

    const existing = await prisma.customPattern.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Custom pattern not found' });
    }

    if (req.user.role !== 'ADMIN' && existing.teacherId !== req.user.teacherId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this pattern' });
    }

    const updated = await prisma.customPattern.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(totalMarks && { totalMarks: Number(totalMarks) }),
        ...(durationMins && { durationMins: Number(durationMins) }),
        ...(patternData && { patternData })
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Delete Custom Pattern by ID (Ownership Check)
exports.deleteCustomPattern = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.customPattern.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Custom pattern not found' });
    }

    if (req.user.role !== 'ADMIN' && existing.teacherId !== req.user.teacherId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not own this pattern' });
    }

    await prisma.customPattern.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Custom pattern deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
