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

exports.getMyStudents = async (req, res) => {
  try {
    const { classId, streamId, page = 1, limit = 10 } = req.query;

    const assignments = await prisma.teacherStudent.findMany({
      where: { teacherId: req.user.teacherId },
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, dob: true } },
            class: true,
            stream: true
          }
        }
      }
    });

    let students = assignments.map(a => a.student);

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
    // Verify student is assigned to this teacher
    const assignment = await prisma.teacherStudent.findUnique({
      where: {
        teacherId_studentId: {
          teacherId: req.user.teacherId,
          studentId: req.params.id
        }
      }
    });

    if (!assignment) return res.status(403).json({ success: false, message: 'Student not assigned to you' });

    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
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
        semesterResults: { orderBy: { semester: 'asc' } }
      }
    });

    res.json({ success: true, data: student });

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
      examType,
      semester,
      academicYear,
      isPassed,
      remarks
    } = req.body;

    // Verify student is assigned to this teacher
    const assignment = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId: req.user.teacherId, studentId } }
    });
    if (!assignment) return res.status(403).json({ success: false, message: 'Student not assigned to you' });

    // Verify QP exists and belongs to this teacher
    const qp = await prisma.questionPaper.findFirst({
      where: { id: questionPaperId, teacherId: req.user.teacherId, isDeleted: false }
    });
    if (!qp) return res.status(404).json({ success: false, message: 'Question paper not found' });

    // Check duplicate
    const existing = await prisma.examResult.findUnique({
      where: { studentId_questionPaperId: { studentId, questionPaperId } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Result already exists for this student and paper' });

    const result = await prisma.examResult.create({
      data: {
        teacherId: req.user.teacherId,
        studentId,
        questionPaperId,
        obtainedMarks: Number(obtainedMarks),
        examDate: new Date(examDate),
        examType,
        semester: Number(semester),
        academicYear,
        isPassed: isPassed ?? true,
        remarks: remarks || null
      },
      include: {
        student: { include: { user: { select: { name: true } } } },
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