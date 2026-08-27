const prisma = require('../config/prisma');

// ==================== PROFILE ====================

exports.getProfile = async (req, res) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.user.teacherId },
      include: {
        user: { select: { id: true, name: true, email: true, dob: true, role: true } },
        students: {
          include: {
            student: {
              include: {
                user: { select: { name: true, email: true } },
                class: true,
                stream: true
              }
            }
          }
        },
        questionPapers: {
          where: { isDeleted: false },
          include: { subject: true }
        }
      }
    });

    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    res.json({ success: true, data: teacher });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { education, experienceYears } = req.body;

    const updated = await prisma.teacher.update({
      where: { id: req.user.teacherId },
      data: {
        ...(education && { education }),
        ...(experienceYears && { experienceYears: Number(experienceYears) })
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STUDENTS ====================

exports.getAssignedClasses = async (req, res) => {
  try {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId: req.user.teacherId },
      include: {
        class: true,
        subject: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: assignments });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMyStudents = async (req, res) => {
  try {
    const { classId, streamId, page = 1, limit = 50 } = req.query;
    const teacherId = req.user.teacherId;

    // 1. Get class IDs assigned to teacher via TeacherAssignment
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      select: { classId: true }
    });
    const assignedClassIds = teacherAssignments.map(a => a.classId);

    // 2. Get students assigned directly or via assigned classes
    const [directAssignments, classStudents] = await Promise.all([
      prisma.teacherStudent.findMany({
        where: { teacherId },
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true, dob: true } },
              class: true,
              stream: true
            }
          }
        }
      }),
      assignedClassIds.length > 0 ? prisma.student.findMany({
        where: { classId: { in: assignedClassIds } },
        include: {
          user: { select: { name: true, email: true, dob: true } },
          class: true,
          stream: true
        }
      }) : []
    ]);

    // 3. Merge and deduplicate
    const studentMap = new Map();
    directAssignments.forEach(a => {
      if (a.student) studentMap.set(a.student.id, a.student);
    });
    classStudents.forEach(s => {
      studentMap.set(s.id, s);
    });

    let students = Array.from(studentMap.values());

    // Filter
    if (classId)  students = students.filter(s => s.classId === classId);
    if (streamId) students = students.filter(s => s.streamId === streamId);

    // Paginate
    const total = students.length;
    const paginated = students.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: paginated,
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

exports.getStudentById = async (req, res) => {
  try {
    const teacherId = req.user.teacherId;
    const studentId = req.params.id;

    // Verify student is assigned to this teacher directly or via assigned class
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      select: { classId: true }
    });
    const assignedClassIds = teacherAssignments.map(a => a.classId);

    const directAssignment = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } }
    });

    const targetStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true, dob: true } },
        class: true,
        stream: { include: { subjects: true } },
        examResults: {
          include: {
            questionPaper: { include: { subject: true } }
          },
          orderBy: { examDate: 'desc' }
        },
        quizAttempts: {
          include: { quiz: { include: { subject: true } } },
          orderBy: { submittedAt: 'desc' }
        },
        practiceAttempts: {
          include: { subject: true, chapter: true },
          orderBy: { submittedAt: 'desc' }
        },
        semesterResults: { orderBy: { semester: 'asc' } }
      }
    });

    if (!targetStudent) return res.status(404).json({ success: false, message: 'Student not found' });

    const isAssignedViaClass = assignedClassIds.includes(targetStudent.classId);
    if (!directAssignment && !isAssignedViaClass) {
      return res.status(403).json({ success: false, message: 'Student is not assigned to your classes' });
    }

    res.json({ success: true, data: targetStudent });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== QUESTIONS ====================

exports.createQuestion = async (req, res) => {
  try {
    const { questionText, marks, difficulty, chapterId, options, answerKey } = req.body;

    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' });

    const question = await prisma.question.create({
      data: {
        questionText,
        marks: Number(marks),
        difficulty,
        chapterId,
        options: options || null,
        answerKey: answerKey || null
      },
      include: { chapter: { include: { subject: true } } }
    });

    res.status(201).json({ success: true, data: question });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const { chapterId, difficulty, page = 1, limit = 10 } = req.query;

    const where = {
      ...(chapterId && { chapterId }),
      ...(difficulty && { difficulty })
    };

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: { chapter: { include: { subject: { include: { stream: true } } } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.question.count({ where })
    ]);

    res.json({
      success: true,
      data: questions,
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

exports.getQuestionById = async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: { chapter: { include: { subject: { include: { stream: true } } } } }
    });

    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    res.json({ success: true, data: question });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const { questionText, marks, difficulty, chapterId, options, answerKey } = req.body;

    const existing = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Question not found' });

    const updated = await prisma.question.update({
      where: { id: req.params.id },
      data: {
        ...(questionText && { questionText }),
        ...(marks && { marks: Number(marks) }),
        ...(difficulty && { difficulty }),
        ...(chapterId && { chapterId }),
        ...(options !== undefined && { options }),
        ...(answerKey !== undefined && { answerKey })
      },
      include: { chapter: { include: { subject: true } } }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const existing = await prisma.question.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Question not found' });

    await prisma.question.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Question deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== EXAM RESULTS ====================

exports.createExamResult = async (req, res) => {
  try {
    const {
      studentId,
      questionPaperId,
      obtainedMarks,
      examDate,
      examType = 'Internal Test',
      semester = 1,
      academicYear = '2026-2027',
      remarks
    } = req.body;

    const teacherId = req.user.teacherId;

    // Verify QP exists and belongs to this teacher
    const qp = await prisma.questionPaper.findFirst({
      where: { id: questionPaperId, teacherId, isDeleted: false }
    });
    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Validate marks
    const numericObtained = Number(obtainedMarks);
    if (isNaN(numericObtained) || numericObtained < 0 || numericObtained > qp.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Obtained marks (${obtainedMarks}) must be between 0 and total marks (${qp.totalMarks})`
      });
    }

    // Auto-calculate pass/fail (>= 35%)
    const passThreshold = 0.35 * qp.totalMarks;
    const computedIsPassed = numericObtained >= passThreshold;

    const result = await prisma.examResult.upsert({
      where: {
        studentId_questionPaperId: { studentId, questionPaperId }
      },
      create: {
        teacherId,
        studentId,
        questionPaperId,
        obtainedMarks: numericObtained,
        examDate: examDate ? new Date(examDate) : (qp.examDate || new Date()),
        examType,
        semester: Number(semester),
        academicYear,
        isPassed: computedIsPassed,
        remarks: remarks || null
      },
      update: {
        obtainedMarks: numericObtained,
        examDate: examDate ? new Date(examDate) : (qp.examDate || new Date()),
        isPassed: computedIsPassed,
        remarks: remarks || null
      },
      include: {
        student: { include: { user: { select: { name: true } }, class: true } },
        questionPaper: { include: { subject: true } }
      }
    });

    res.status(201).json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExamResults = async (req, res) => {
  try {
    const { studentId, semester, academicYear, page = 1, limit = 10 } = req.query;

    const where = {
      teacherId: req.user.teacherId,
      ...(studentId && { studentId }),
      ...(semester && { semester: Number(semester) }),
      ...(academicYear && { academicYear })
    };

    const [results, total] = await Promise.all([
      prisma.examResult.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
          questionPaper: { include: { subject: true } }
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

exports.updateExamResult = async (req, res) => {
  try {
    const { obtainedMarks, isPassed, remarks, examDate } = req.body;

    const existing = await prisma.examResult.findFirst({
      where: { id: req.params.id, teacherId: req.user.teacherId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Result not found' });

    const updated = await prisma.examResult.update({
      where: { id: req.params.id },
      data: {
        ...(obtainedMarks !== undefined && { obtainedMarks: Number(obtainedMarks) }),
        ...(isPassed !== undefined && { isPassed }),
        ...(remarks !== undefined && { remarks }),
        ...(examDate && { examDate: new Date(examDate) })
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
        questionPaper: { include: { subject: true } }
      }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteExamResult = async (req, res) => {
  try {
    const existing = await prisma.examResult.findFirst({
      where: { id: req.params.id, teacherId: req.user.teacherId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Result not found' });

    await prisma.examResult.delete({ where: { id: req.params.id } });

    res.json({ success: true, message: 'Exam result deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SEMESTER RESULTS ====================

exports.createSemesterResult = async (req, res) => {
  try {
    const { studentId, semester, academicYear, sgpa, cgpa, totalCredits, earnedCredits } = req.body;

    // Verify student is assigned to this teacher
    const assignment = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId: req.user.teacherId, studentId } }
    });
    if (!assignment) return res.status(403).json({ success: false, message: 'Student not assigned to you' });

    const existing = await prisma.semesterResult.findUnique({
      where: { studentId_semester_academicYear: { studentId, semester: Number(semester), academicYear } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Semester result already exists' });

    const result = await prisma.semesterResult.create({
      data: {
        studentId,
        semester: Number(semester),
        academicYear,
        sgpa: Number(sgpa),
        cgpa: Number(cgpa),
        totalCredits: Number(totalCredits),
        earnedCredits: Number(earnedCredits)
      },
      include: {
        student: { include: { user: { select: { name: true } } } }
      }
    });

    res.status(201).json({ success: true, data: result });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSemesterResults = async (req, res) => {
  try {
    const { studentId, semester, academicYear } = req.query;

    // Verify student is assigned if studentId provided
    if (studentId) {
      const assignment = await prisma.teacherStudent.findUnique({
        where: { teacherId_studentId: { teacherId: req.user.teacherId, studentId } }
      });
      if (!assignment) return res.status(403).json({ success: false, message: 'Student not assigned to you' });
    }

    const results = await prisma.semesterResult.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(semester && { semester: Number(semester) }),
        ...(academicYear && { academicYear }),
        student: {
          teachers: { some: { teacherId: req.user.teacherId } }
        }
      },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } }
      },
      orderBy: { semester: 'asc' }
    });

    res.json({ success: true, data: results });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSemesterResult = async (req, res) => {
  try {
    const { sgpa, cgpa, totalCredits, earnedCredits } = req.body;

    // Verify result belongs to an assigned student
    const existing = await prisma.semesterResult.findFirst({
      where: {
        id: req.params.id,
        student: { teachers: { some: { teacherId: req.user.teacherId } } }
      }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Semester result not found' });

    const updated = await prisma.semesterResult.update({
      where: { id: req.params.id },
      data: {
        ...(sgpa !== undefined && { sgpa: Number(sgpa) }),
        ...(cgpa !== undefined && { cgpa: Number(cgpa) }),
        ...(totalCredits !== undefined && { totalCredits: Number(totalCredits) }),
        ...(earnedCredits !== undefined && { earnedCredits: Number(earnedCredits) })
      },
      include: {
        student: { include: { user: { select: { name: true } } } }
      }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SUBJECTS & CHAPTERS ====================

exports.getSubjects = async (req, res) => {
  try {
    const { streamId } = req.query;

    const subjects = await prisma.subject.findMany({
      where: { ...(streamId && { streamId }) },
      include: {
        stream: true,
        chapters: true,
        _count: { select: { questionPapers: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: subjects });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getChaptersBySubject = async (req, res) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.subjectId }
    });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const chapters = await prisma.chapter.findMany({
      where: { subjectId: req.params.subjectId },
      include: {
        _count: { select: { questions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: chapters });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== RESULT EXPORTS ====================

const { generateResultExcel } = require('../utils/resultExcelExporter');
const { generateResultPdf } = require('../utils/resultPdfExporter');

exports.exportExamResultsExcel = async (req, res) => {
  try {
    const { questionPaperId } = req.query;
    const teacherId = req.user.teacherId;

    if (!questionPaperId) {
      return res.status(400).json({ success: false, message: 'Question paper ID is required' });
    }

    const qp = await prisma.questionPaper.findFirst({
      where: { id: questionPaperId, teacherId, isDeleted: false },
      include: { subject: true }
    });
    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    const results = await prisma.examResult.findMany({
      where: { questionPaperId, teacherId },
      include: {
        student: { include: { user: { select: { name: true, email: true } }, class: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const buffer = await generateResultExcel(qp, results);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${qp.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Results.xlsx"`);
    res.send(buffer);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.exportExamResultsPdf = async (req, res) => {
  try {
    const { questionPaperId } = req.query;
    const teacherId = req.user.teacherId;

    if (!questionPaperId) {
      return res.status(400).json({ success: false, message: 'Question paper ID is required' });
    }

    const qp = await prisma.questionPaper.findFirst({
      where: { id: questionPaperId, teacherId, isDeleted: false },
      include: { subject: true }
    });
    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    const results = await prisma.examResult.findMany({
      where: { questionPaperId, teacherId },
      include: {
        student: { include: { user: { select: { name: true, email: true } }, class: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const pdfBuffer = await generateResultPdf(qp, results);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${qp.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Results.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};