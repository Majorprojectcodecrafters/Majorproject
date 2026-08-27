const prisma = require('../config/prisma');
const { generateLLMResponse } = require('../rag/llmClient');

// ==================== TEACHER QUIZ MANAGEMENT ====================

exports.generateQuiz = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      classId,
      chapterIds,
      questionCount = 10,
      durationMins = 15
    } = req.body;

    const teacherId = req.user.teacherId;

    if (!subjectId || !classId || !chapterIds?.length) {
      return res.status(400).json({
        success: false,
        message: 'Subject, class, and at least one chapter are required'
      });
    }

    const [subject, targetClass, chapters] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.class.findUnique({ where: { id: classId } }),
      prisma.chapter.findMany({ where: { id: { in: chapterIds } } })
    ]);

    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found' });
    if (!targetClass) return res.status(404).json({ success: false, message: 'Class not found' });

    // 1. Check existing MCQs from database
    const dbQuestions = await prisma.question.findMany({
      where: {
        chapterId: { in: chapterIds },
        questionType: 'MCQ'
      },
      take: Number(questionCount)
    });

    let selectedQuestions = [];

    // Format DB MCQs
    dbQuestions.forEach(q => {
      let optionsArr = Array.isArray(q.options) ? q.options : [];
      if (typeof q.options === 'string') {
        try { optionsArr = JSON.parse(q.options); } catch (e) {}
      }
      if (optionsArr.length >= 4) {
        selectedQuestions.push({
          questionText: q.questionText,
          options: optionsArr.slice(0, 4),
          correctOption: 0, // default first option if answerKey not mapped
          explanation: q.answerKey || 'Correct choice based on textbook syllabus.'
        });
      }
    });

    // 2. If additional questions needed, generate using LLM from curriculum topics
    const neededCount = Number(questionCount) - selectedQuestions.length;
    if (neededCount > 0) {
      const chapterNames = chapters.map(c => c.name).join(', ');
      const prompt = `Generate exactly ${neededCount} Multiple Choice Questions (MCQs) for 12th Grade ${subject.name} covering chapters: ${chapterNames}.
Format requirements:
Return ONLY a valid JSON array of objects. Each object must have:
- "questionText": string
- "options": array of 4 distinct string choices
- "correctOption": integer index (0, 1, 2, or 3) indicating the correct choice
- "explanation": brief 1-sentence explanation

Example format:
[
  {
    "questionText": "What is the unit of electric field intensity?",
    "options": ["N/C", "J/C", "V/m^2", "W/m"],
    "correctOption": 0,
    "explanation": "Electric field is force per unit charge (N/C)."
  }
]`;

      try {
        const llmResponse = await generateLLMResponse(prompt, { temperature: 0.3 });
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const generated = JSON.parse(jsonMatch[0]);
          generated.forEach(g => {
            if (g.questionText && Array.isArray(g.options) && g.options.length >= 4) {
              selectedQuestions.push({
                questionText: g.questionText,
                options: g.options.slice(0, 4),
                correctOption: Number(g.correctOption) || 0,
                explanation: g.explanation || 'Curriculum answer explanation.'
              });
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ LLM Quiz generation fallback:', e.message);
      }
    }

    // Ensure we have at least minimum questions
    if (!selectedQuestions.length) {
      return res.status(400).json({ success: false, message: 'Could not retrieve or generate quiz questions for selected topics' });
    }

    // Truncate to exact count requested
    selectedQuestions = selectedQuestions.slice(0, Number(questionCount));
    const totalMarks = selectedQuestions.length * 1; // 1 mark per question

    // 3. Create Quiz in Database
    const quiz = await prisma.quiz.create({
      data: {
        title: title || `${subject.name} Online Quiz — ${targetClass.name}`,
        teacherId,
        subjectId,
        classId,
        totalMarks,
        durationMins: Number(durationMins),
        isPublished: false,
        questions: {
          create: selectedQuestions.map((q, idx) => ({
            questionText: q.questionText,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
            marks: 1,
            orderInt: idx + 1
          }))
        }
      },
      include: {
        subject: true,
        class: true,
        questions: true
      }
    });

    res.status(201).json({ success: true, data: quiz });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.publishQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.teacherId;

    const quiz = await prisma.quiz.findFirst({
      where: { id, teacherId }
    });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const updated = await prisma.quiz.update({
      where: { id },
      data: { isPublished: true },
      include: { class: true, subject: true, questions: true }
    });

    res.json({ success: true, message: 'Quiz published to assigned class successfully', data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeacherQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.teacherId;

    const quizzes = await prisma.quiz.findMany({
      where: { teacherId },
      include: {
        subject: true,
        class: true,
        _count: { select: { questions: true, attempts: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: quizzes });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeacherQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.teacherId;

    const quiz = await prisma.quiz.findFirst({
      where: { id, teacherId },
      include: {
        subject: true,
        class: true,
        questions: { orderBy: { orderInt: 'asc' } },
        attempts: {
          include: {
            student: { include: { user: { select: { name: true, email: true } } } }
          },
          orderBy: { score: 'desc' }
        }
      }
    });

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    res.json({ success: true, data: quiz });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.teacherId;

    const existing = await prisma.quiz.findFirst({ where: { id, teacherId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Quiz not found' });

    await prisma.quiz.delete({ where: { id } });

    res.json({ success: true, message: 'Quiz deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STUDENT QUIZ TAKING ====================

exports.getStudentQuizzes = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

    // Fetch published quizzes for student's class
    const quizzes = await prisma.quiz.findMany({
      where: {
        classId: student.classId,
        isPublished: true
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { questions: true } },
        attempts: {
          where: { studentId },
          select: { id: true, score: true, totalMarks: true, isPassed: true, submittedAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = quizzes.map(q => {
      const myAttempt = q.attempts[0] || null;
      return {
        id: q.id,
        title: q.title,
        subject: q.subject?.name || 'Subject',
        teacherName: q.teacher?.user?.name || 'Teacher',
        totalMarks: q.totalMarks,
        durationMins: q.durationMins,
        questionCount: q._count.questions,
        createdAt: q.createdAt,
        attempted: !!myAttempt,
        myAttempt
      };
    });

    res.json({ success: true, data: formatted });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentQuizDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.studentId;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true }
    });

    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
        classId: student.classId,
        isPublished: true
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
        questions: {
          select: {
            id: true,
            questionText: true,
            options: true,
            marks: true,
            orderInt: true
            // Exclude correctOption & explanation before attempt submission
          },
          orderBy: { orderInt: 'asc' }
        },
        attempts: {
          where: { studentId }
        }
      }
    });

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found or not published' });

    const existingAttempt = quiz.attempts[0] || null;

    res.json({
      success: true,
      data: {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject?.name || 'Subject',
        teacherName: quiz.teacher?.user?.name || 'Teacher',
        totalMarks: quiz.totalMarks,
        durationMins: quiz.durationMins,
        questions: quiz.questions,
        alreadyAttempted: !!existingAttempt,
        attempt: existingAttempt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitQuizAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // Object mapping questionId -> selectedOptionIndex (0..3)
    const studentId = req.user.studentId;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { classId: true }
    });

    const quiz = await prisma.quiz.findFirst({
      where: { id, classId: student.classId, isPublished: true },
      include: { questions: true }
    });

    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Check single attempt limit
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: { quizId_studentId: { quizId: id, studentId } }
    });
    if (existingAttempt) {
      return res.status(400).json({ success: false, message: 'You have already attempted this quiz' });
    }

    // Automatic Evaluation
    let score = 0;
    let totalMarks = quiz.totalMarks;
    const questionResults = [];

    quiz.questions.forEach(q => {
      const selectedIndex = answers && answers[q.id] !== undefined ? Number(answers[q.id]) : null;
      const isCorrect = selectedIndex !== null && selectedIndex === q.correctOption;
      if (isCorrect) {
        score += q.marks;
      }
      questionResults.push({
        questionId: q.id,
        questionText: q.questionText,
        options: q.options,
        selectedIndex,
        correctOption: q.correctOption,
        isCorrect,
        explanation: q.explanation
      });
    });

    const isPassed = score >= (0.35 * totalMarks);

    // Save Attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: id,
        studentId,
        score,
        totalMarks,
        isPassed,
        answers: answers || {}
      }
    });

    res.status(201).json({
      success: true,
      message: 'Quiz submitted and evaluated successfully!',
      data: {
        attemptId: attempt.id,
        score,
        totalMarks,
        percentage: Number(((score / totalMarks) * 100).toFixed(1)),
        isPassed,
        submittedAt: attempt.submittedAt,
        details: questionResults
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
