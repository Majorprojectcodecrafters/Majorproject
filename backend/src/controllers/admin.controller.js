const prisma = require('../config/prisma');

// ==================== DASHBOARD ====================

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTeachers,
      totalStudents,
      totalClasses,
      totalStreams,
      totalSubjects,
      totalChapters,
      totalTemplates,
      qpByStatus,
      totalExamResults,
      totalSemesterResults
    ] = await Promise.all([
      prisma.user.count(),
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.class.count(),
      prisma.stream.count(),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.template.count(),
      prisma.questionPaper.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { isDeleted: false }
      }),
      prisma.examResult.count(),
      prisma.semesterResult.count()
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, teachers: totalTeachers, students: totalStudents },
        academic: { classes: totalClasses, streams: totalStreams, subjects: totalSubjects, chapters: totalChapters },
        questionPapers: qpByStatus.reduce((acc, cur) => {
          acc[cur.status] = cur._count.status;
          return acc;
        }, {}),
        results: { examResults: totalExamResults, semesterResults: totalSemesterResults },
        templates: totalTemplates
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== USER MANAGEMENT ====================

exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;

    const where = { ...(role && { role }) };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        select: {
          id: true, name: true, email: true,
          role: true, dob: true, createdAt: true,
          teacher: true,
          student: { include: { class: true, stream: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true,
        role: true, dob: true, createdAt: true,
        teacher: true,
        student: { include: { class: true, stream: true } }
      }
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete role profile first, then user
    if (user.role === 'TEACHER') await prisma.teacher.delete({ where: { userId: id } });
    if (user.role === 'STUDENT') await prisma.student.delete({ where: { userId: id } });

    await prisma.user.delete({ where: { id } });

    res.json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// CREATE USER (ADMIN)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, dob, classId, streamId, education, experienceYears, contact, uniqueId } = req.body;

    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User email already exists' });
    }

    let studentUniqueId = uniqueId || null;
    if (role === 'STUDENT') {
      let resolvedClassId = classId;
      if (!resolvedClassId) {
        const firstClass = await prisma.class.findFirst();
        resolvedClassId = firstClass ? firstClass.id : null;
      }

      let resolvedStreamId = streamId;
      if (!resolvedStreamId && resolvedClassId) {
        const targetClass = await prisma.class.findUnique({ where: { id: resolvedClassId } });
        if (targetClass?.streamId) resolvedStreamId = targetClass.streamId;
      }
      if (!resolvedStreamId) {
        const firstStream = await prisma.stream.findFirst();
        resolvedStreamId = firstStream ? firstStream.id : null;
      }

      const { generateStudentUniqueId } = require('../utils/studentUniqueIdGenerator');
      studentUniqueId = await generateStudentUniqueId({ classId: resolvedClassId, streamId: resolvedStreamId });

      // Update classId and streamId to resolved values
      req.resolvedClassId = resolvedClassId;
      req.resolvedStreamId = resolvedStreamId;
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password || 'qpgen123', 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        dob: dob ? new Date(dob) : new Date('2005-01-01'),

        ...(role === 'TEACHER' && {
          teacher: {
            create: {
              education: education || 'N/A',
              experienceYears: Number(experienceYears || 0)
            }
          }
        }),

        ...(role === 'STUDENT' && {
          student: {
            create: {
              uniqueId: studentUniqueId,
              contact: contact || 'N/A',
              classId: req.resolvedClassId || classId || null,
              streamId: req.resolvedStreamId || streamId || null
            }
          }
        })
      },
      include: {
        teacher: true,
        student: { include: { class: true, stream: true } }
      }
    });

    const { password: _, ...safeUser } = user;
    res.status(201).json({ success: true, data: safeUser });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// UPDATE USER (ADMIN)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, dob, classId, streamId, education, experienceYears, contact, uniqueId } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { teacher: true, student: true }
    });

    if (!existingUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Update User model
    await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(dob && { dob: new Date(dob) })
      }
    });

    // Update role profiles
    if (existingUser.role === 'TEACHER' && existingUser.teacher) {
      await prisma.teacher.update({
        where: { id: existingUser.teacher.id },
        data: {
          ...(education !== undefined && { education }),
          ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) })
        }
      });
    } else if (existingUser.role === 'STUDENT' && existingUser.student) {
      await prisma.student.update({
        where: { id: existingUser.student.id },
        data: {
          ...(classId !== undefined && { classId }),
          ...(streamId !== undefined && { streamId }),
          ...(contact !== undefined && { contact }),
          ...(uniqueId !== undefined && { uniqueId })
        }
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id },
      include: {
        teacher: true,
        student: { include: { class: true, stream: true } }
      }
    });

    const { password: _, ...safeUser } = fullUser;
    res.json({ success: true, data: safeUser });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== CLASS MANAGEMENT ====================

exports.createClass = async (req, res) => {
  try {
    const { name, academicYear } = req.body;

    const existing = await prisma.class.findUnique({
      where: { name_academicYear: { name, academicYear } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Class already exists for this academic year' });

    const newClass = await prisma.class.create({ data: { name, academicYear } });

    res.status(201).json({ success: true, data: newClass });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: { students: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, academicYear } = req.body;

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Class not found' });

    const updated = await prisma.class.update({
      where: { id },
      data: { ...(name && { name }), ...(academicYear && { academicYear }) }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.class.findUnique({
      where: { id },
      include: { students: true, teacherAssignments: true }
    });

    if (!existing) return res.status(404).json({ success: false, message: 'Class not found' });

    if (existing.students && existing.students.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class "${existing.name}". There are ${existing.students.length} students enrolled in this class. Please reassign students first.`
      });
    }

    // Clean up relations
    await prisma.teacherAssignment.deleteMany({ where: { classId: id } });
    await prisma.classSubject.deleteMany({ where: { classId: id } });

    await prisma.class.delete({ where: { id } });

    res.json({ success: true, message: `Class "${existing.name}" deleted successfully` });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STREAM MANAGEMENT ====================

exports.createStream = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await prisma.stream.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Stream already exists' });

    const stream = await prisma.stream.create({ data: { name } });

    res.status(201).json({ success: true, data: stream });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllStreams = async (req, res) => {
  try {
    const streams = await prisma.stream.findMany({
      include: { subjects: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: streams });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStream = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const existing = await prisma.stream.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Stream not found' });

    const updated = await prisma.stream.update({ where: { id }, data: { name } });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteStream = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.stream.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Stream not found' });

    await prisma.stream.delete({ where: { id } });

    res.json({ success: true, message: 'Stream deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SUBJECT MANAGEMENT ====================

exports.createSubject = async (req, res) => {
  try {
    const { name, streamId } = req.body;

    const stream = await prisma.stream.findUnique({ where: { id: streamId } });
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });

    const existing = await prisma.subject.findUnique({
      where: { name_streamId: { name, streamId } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Subject already exists in this stream' });

    const subject = await prisma.subject.create({
      data: { name, streamId },
      include: { stream: true }
    });

    res.status(201).json({ success: true, data: subject });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllSubjects = async (req, res) => {
  try {
    const { streamId } = req.query;

    const subjects = await prisma.subject.findMany({
      where: { ...(streamId && { streamId }) },
      include: { stream: true, chapters: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: subjects });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, streamId } = req.body;

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Subject not found' });

    const updated = await prisma.subject.update({
      where: { id },
      data: { ...(name && { name }), ...(streamId && { streamId }) },
      include: { stream: true }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Subject not found' });

    await prisma.subject.delete({ where: { id } });

    res.json({ success: true, message: 'Subject deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== CHAPTER MANAGEMENT ====================

exports.createChapter = async (req, res) => {
  try {
    const { name, subjectId } = req.body;

    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const existing = await prisma.chapter.findUnique({
      where: { name_subjectId: { name, subjectId } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Chapter already exists in this subject' });

    const chapter = await prisma.chapter.create({
      data: { name, subjectId },
      include: { subject: true }
    });

    res.status(201).json({ success: true, data: chapter });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllChapters = async (req, res) => {
  try {
    const { subjectId } = req.query;

    const chapters = await prisma.chapter.findMany({
      where: { ...(subjectId && { subjectId }) },
      include: { subject: { include: { stream: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: chapters });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subjectId } = req.body;

    const existing = await prisma.chapter.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Chapter not found' });

    const updated = await prisma.chapter.update({
      where: { id },
      data: { ...(name && { name }), ...(subjectId && { subjectId }) },
      include: { subject: true }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.chapter.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Chapter not found' });

    await prisma.chapter.delete({ where: { id } });

    res.json({ success: true, message: 'Chapter deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== TEACHER-STUDENT ASSIGNMENT ====================

exports.assignTeacherToStudent = async (req, res) => {
  try {
    const { teacherId, studentId } = req.body;

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const existing = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } }
    });
    if (existing) return res.status(400).json({ success: false, message: 'Already assigned' });

    const assignment = await prisma.teacherStudent.create({
      data: { teacherId, studentId },
      include: {
        teacher: { include: { user: true } },
        student: { include: { user: true } }
      }
    });

    res.status(201).json({ success: true, data: assignment });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.unassignTeacherFromStudent = async (req, res) => {
  try {
    const { teacherId, studentId } = req.body;

    const existing = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Assignment not found' });

    await prisma.teacherStudent.delete({
      where: { teacherId_studentId: { teacherId, studentId } }
    });

    res.json({ success: true, message: 'Teacher unassigned from student successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== TEMPLATE MANAGEMENT ====================

exports.createTemplate = async (req, res) => {
  try {
    const { name, pattern } = req.body;

    const existing = await prisma.template.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ success: false, message: 'Template already exists' });

    const template = await prisma.template.create({ data: { name, pattern } });

    res.status(201).json({ success: true, data: template });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      include: { questionPapers: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, pattern } = req.body;

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });

    const updated = await prisma.template.update({
      where: { id },
      data: { ...(name && { name }), ...(pattern && { pattern }) }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.template.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Template not found' });

    await prisma.template.delete({ where: { id } });

    res.json({ success: true, message: 'Template deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== TEACHER-CLASS-SUBJECT ALLOCATION ====================

exports.createTeacherAssignment = async (req, res) => {
  try {
    const { teacherId, classId, subjectId } = req.body;

    const [teacher, targetClass, subject] = await Promise.all([
      prisma.teacher.findUnique({ where: { id: teacherId } }),
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.subject.findUnique({ where: { id: subjectId } })
    ]);

    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    if (!targetClass) return res.status(404).json({ success: false, message: 'Class not found' });
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });

    const existing = await prisma.teacherAssignment.findUnique({
      where: { teacherId_classId_subjectId: { teacherId, classId, subjectId } }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Teacher is already assigned to this Subject and Class' });
    }

    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId, classId, subjectId },
      include: {
        teacher: { include: { user: { select: { name: true, email: true } } } },
        class: true,
        subject: true
      }
    });

    // Also sync TeacherStudent entries for existing students in this class
    const classStudents = await prisma.student.findMany({ where: { classId } });
    for (const student of classStudents) {
      await prisma.teacherStudent.upsert({
        where: { teacherId_studentId: { teacherId, studentId: student.id } },
        create: { teacherId, studentId: student.id },
        update: {}
      }).catch(() => {});
    }

    res.status(201).json({ success: true, data: assignment });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeacherAssignments = async (req, res) => {
  try {
    const { teacherId, classId, subjectId } = req.query;

    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        ...(teacherId && { teacherId }),
        ...(classId && { classId }),
        ...(subjectId && { subjectId })
      },
      include: {
        teacher: { include: { user: { select: { name: true, email: true } } } },
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

exports.deleteTeacherAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.teacherAssignment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Teacher assignment not found' });

    await prisma.teacherAssignment.delete({ where: { id } });

    res.json({ success: true, message: 'Teacher assignment removed successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateStudentClass = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId } = req.body;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const targetClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!targetClass) return res.status(404).json({ success: false, message: 'Class not found' });

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        classId,
        ...(targetClass.streamId && { streamId: targetClass.streamId })
      },
      include: {
        user: { select: { name: true, email: true } },
        class: true,
        stream: true
      }
    });

    res.json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};