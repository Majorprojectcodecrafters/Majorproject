const prisma = require('../config/prisma');

// ==================== PROFILE ====================

exports.getProfile = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: {
        user: { select: { id: true, name: true, email: true, dob: true, role: true } },
        class: true,
        stream: { include: { subjects: { include: { chapters: true } } } },
        teachers: {
          include: {
            teacher: { include: { user: { select: { name: true, email: true } } } }
          }
        }
      }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data: student });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { contact } = req.body;

    const updated = await prisma.student.update({
      where: { id: req.user.studentId },
      data: { ...(contact && { contact }) },
      include: {
        user: { select: { id: true, name: true, email: true, dob: true } },
        class: true,
        stream: true
      }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== EXAM RESULTS ====================

exports.getExamResults = async (req, res) => {
  try {
    const { semester, academicYear, page = 1, limit = 10 } = req.query;

    const where = {
      studentId: req.user.studentId,
      ...(semester && { semester: Number(semester) }),
      ...(academicYear && { academicYear })
    };

    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          questionPaper: {
            include: {
              subject: { include: { stream: true } },
              teacher: { include: { user: { select: { name: true } } } }
            }
          }
        },
        orderBy: { examDate: 'desc' }
      }),
      prisma.examResult.count({ where })
    ]);

    res.json({
      success: true,
      data: results,
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

exports.getExamResultById = async (req, res) => {
  try {
    const result = await prisma.examResult.findFirst({
      where: {
        id: req.params.id,
        studentId: req.user.studentId
      },
      include: {
        questionPaper: {
          include: {
            subject: { include: { stream: true } },
            questions: { include: { question: { include: { chapter: true } } } },
            teacher: { include: { user: { select: { name: true, email: true } } } }
          }
        }
      }
    });

    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    res.json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SEMESTER RESULTS ====================

exports.getSemesterResults = async (req, res) => {
  try {
    const { semester, academicYear } = req.query;

    const results = await prisma.semesterResult.findMany({
      where: {
        studentId: req.user.studentId,
        ...(semester && { semester: Number(semester) }),
        ...(academicYear && { academicYear })
      },
      orderBy: { semester: 'asc' }
    });

    // Latest CGPA
    const latest = results[results.length - 1];

    res.json({
      success: true,
      data: {
        results,
        summary: {
          currentCGPA: latest?.cgpa || null,
          totalSemesters: results.length,
          totalCredits: latest?.totalCredits || null,
          earnedCredits: latest?.earnedCredits || null
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSemesterResultById = async (req, res) => {
  try {
    const result = await prisma.semesterResult.findFirst({
      where: {
        id: req.params.id,
        studentId: req.user.studentId
      }
    });

    if (!result) return res.status(404).json({ success: false, message: 'Semester result not found' });

    res.json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== QUESTION PAPERS ====================

/**
 * Helper function to determine if a question paper test schedule is completed (over)
 */
function isTestOver(qp) {
  if (!qp) return false;
  if (qp.status !== 'PUBLISHED') return false;

  const now = new Date();
  const startTime = qp.examDate ? new Date(qp.examDate) : new Date(qp.createdAt);
  const durationMins = qp.durationMins || 60;
  const endTime = new Date(startTime.getTime() + durationMins * 60 * 1000);

  return now > endTime;
}

exports.getPublishedQPs = async (req, res) => {
  try {
    const { subjectId, difficulty, page = 1, limit = 10 } = req.query;

    // Get student's streamId
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      select: { streamId: true }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    // Fetch published QPs from student's stream
    const where = {
      isDeleted: false,
      status: 'PUBLISHED',
      subject: { streamId: student.streamId },
      ...(subjectId && { subjectId }),
      ...(difficulty && { difficulty })
    };

    const allQps = await prisma.questionPaper.findMany({
      where,
      include: {
        subject: { include: { stream: true } },
        teacher: { include: { user: { select: { name: true } } } },
        template: true,
        questions: { include: { question: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Strictly filter out papers whose test schedule is NOT over yet
    const completedQps = allQps.filter(qp => isTestOver(qp));

    const total = completedQps.length;
    const paginated = completedQps.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getQPById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      select: { streamId: true }
    });

    const qp = await prisma.questionPaper.findFirst({
      where: {
        id: req.params.id,
        isDeleted: false,
        status: 'PUBLISHED',
        subject: { streamId: student.streamId }
      },
      include: {
        subject: { include: { stream: true } },
        teacher: { include: { user: { select: { name: true } } } },
        questions: { include: { question: { include: { chapter: true } } } },
        template: true
      }
    });

    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Enforce test completion check
    if (!isTestOver(qp)) {
      return res.status(403).json({
        success: false,
        message: 'This question paper is for an upcoming or ongoing exam. It will become available for viewing and download once the test duration is completed.'
      });
    }

    res.json({ success: true, data: qp });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportStudentQP = async (req, res) => {
  try {
    const { exportQPToPDF } = require('../utils/pdfExporter');

    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      select: { streamId: true }
    });

    const qp = await prisma.questionPaper.findFirst({
      where: {
        id: req.params.id,
        isDeleted: false,
        status: 'PUBLISHED',
        subject: { streamId: student.streamId }
      },
      include: {
        subject: true,
        questions: { include: { question: true } }
      }
    });

    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    if (!isTestOver(qp)) {
      return res.status(403).json({
        success: false,
        message: 'This question paper is for an upcoming or ongoing exam. It will become available for download once the test duration is completed.'
      });
    }

    const pdfBuffer = await exportQPToPDF(qp, false);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${qp.title}-student.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== ASSIGNED TEACHERS ====================

exports.getMyTeachers = async (req, res) => {
  try {
    const assignments = await prisma.teacherStudent.findMany({
      where: { studentId: req.user.studentId },
      include: {
        teacher: {
          include: {
            user: { select: { name: true, email: true, dob: true } }
          }
        }
      }
    });

    res.json({ success: true, data: assignments.map(a => a.teacher) });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STREAM & SUBJECTS ====================

exports.getMyStream = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      include: {
        stream: {
          include: {
            subjects: {
              include: { chapters: true }
            }
          }
        }
      }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    res.json({ success: true, data: student.stream });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSubjectById = async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.studentId },
      select: { streamId: true }
    });

    const subject = await prisma.subject.findFirst({
      where: {
        id: req.params.id,
        streamId: student.streamId
      },
      include: { chapters: true, stream: true }
    });

    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found in your stream' });

    res.json({ success: true, data: subject });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};