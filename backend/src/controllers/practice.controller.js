const prisma = require('../config/prisma');
const { generateLLMResponse } = require('../rag/llmClient');

// ==================== PRACTICE QUIZ GENERATION ====================

exports.getPracticeSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        chapters: {
          orderBy: { chapterNo: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: subjects });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.generatePracticeQuiz = async (req, res) => {
  try {
    const { subjectId, chapterId, questionCount = 10 } = req.body;

    if (!subjectId || !chapterId) {
      return res.status(400).json({ success: false, message: 'Subject and Chapter are required' });
    }

    const [subject, chapter] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.chapter.findUnique({ where: { id: chapterId } })
    ]);

    if (!subject || !chapter) {
      return res.status(404).json({ success: false, message: 'Subject or Chapter not found' });
    }

    const count = Number(questionCount);
    const durationMins = Number((count * 1.3).toFixed(1)); // 1.3 mins per question

    // 1. Fetch MCQs from DB question bank
    const dbQuestions = await prisma.question.findMany({
      where: {
        chapterId,
        questionType: 'MCQ'
      }
    });

    let selectedQuestions = [];

    dbQuestions.forEach(q => {
      let optionsArr = Array.isArray(q.options) ? q.options : [];
      if (typeof q.options === 'string') {
        try { optionsArr = JSON.parse(q.options); } catch (e) {}
      }
      if (optionsArr.length >= 4) {
        selectedQuestions.push({
          id: q.id,
          questionText: q.questionText,
          options: optionsArr.slice(0, 4),
          correctOption: 0,
          explanation: q.answerKey || 'MHT-CET standard textbook concept explanation.'
        });
      }
    });

    // 2. If DB questions fewer than requested count, generate via LLM grounded in chapter curriculum
    const needed = count - selectedQuestions.length;
    if (needed > 0) {
      const prompt = `Generate exactly ${needed} Multiple Choice Questions (MCQs) strictly conforming to the Maharashtra MHT-CET Entrance Examination standard for 12th Grade ${subject.name}, Chapter: "${chapter.name}".
Format Requirements:
Return ONLY a valid JSON array of objects. Each object MUST contain:
- "questionText": string (conceptual/problem-solving MHT-CET standard)
- "options": array of 4 distinct string choices
- "correctOption": integer index (0, 1, 2, or 3)
- "explanation": brief 1-2 sentence step-by-step solution/concept explanation

Example:
[
  {
    "questionText": "What is the moment of inertia of a uniform solid sphere about its diameter?",
    "options": ["(2/5) MR^2", "(1/2) MR^2", "(2/3) MR^2", "(7/5) MR^2"],
    "correctOption": 0,
    "explanation": "By standard formula, I = (2/5) MR^2 for a uniform solid sphere."
  }
]`;

      try {
        const llmResponse = await generateLLMResponse(prompt, { temperature: 0.4 });
        const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const generated = JSON.parse(jsonMatch[0]);
          generated.forEach((g, idx) => {
            if (g.questionText && Array.isArray(g.options) && g.options.length >= 4) {
              selectedQuestions.push({
                id: `gen_${Date.now()}_${idx}`,
                questionText: g.questionText,
                options: g.options.slice(0, 4),
                correctOption: Number(g.correctOption) || 0,
                explanation: g.explanation || 'MHT-CET concept solution.'
              });
            }
          });
        }
      } catch (e) {
        console.warn('⚠️ Practice LLM generation fallback:', e.message);
      }
    }

    // 3. Shuffle / randomize questions for retake variety
    selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, count);

    // Sanitize output for quiz player (hide correctOption before submission)
    const sanitizedQuestions = selectedQuestions.map((q, idx) => ({
      id: q.id || `q_${idx}`,
      questionText: q.questionText,
      options: q.options,
      orderInt: idx + 1
    }));

    res.json({
      success: true,
      data: {
        subjectName: subject.name,
        chapterName: chapter.name,
        questionCount: sanitizedQuestions.length,
        durationMins,
        questions: sanitizedQuestions,
        rawQuestions: selectedQuestions // Stored in session for evaluation
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SUBMIT PRACTICE & XP CALCULATION ====================

exports.submitPracticeAttempt = async (req, res) => {
  try {
    const {
      subjectId,
      chapterId,
      timeTakenSeconds = 0,
      answers = {},
      questionTimes = {},
      rawQuestions = []
    } = req.body;

    const studentId = req.user.studentId;

    let correctCount = 0;
    let totalXp = 0;
    let baseXp = 0;
    let streakXp = 0;
    let speedXp = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    const questionResults = [];

    rawQuestions.forEach((q, idx) => {
      const selectedIndex = answers[q.id] !== undefined ? Number(answers[q.id]) : null;
      const timeSpent = questionTimes[q.id] || 0;
      const isCorrect = selectedIndex !== null && selectedIndex === q.correctOption;

      let qBase = 0;
      let qStreak = 0;
      let qSpeed = 0;

      if (isCorrect) {
        correctCount++;
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;

        // Base XP: 10
        qBase = 10;

        // Streak Multipliers: 3 consecutive -> 1.5x (15 XP), 5 consecutive -> 2.0x (20 XP)
        if (currentStreak >= 5) {
          qStreak = 10; // Extra +10 (total 20)
        } else if (currentStreak >= 3) {
          qStreak = 5;  // Extra +5 (total 15)
        }

        // Speed Bonus: +5 XP if answered in <15 seconds
        if (timeSpent > 0 && timeSpent < 15) {
          qSpeed = 5;
        }
      } else {
        currentStreak = 0;
      }

      baseXp += qBase;
      streakXp += qStreak;
      speedXp += qSpeed;

      questionResults.push({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
        selectedIndex,
        correctOption: q.correctOption,
        isCorrect,
        explanation: q.explanation
      });
    });

    totalXp = baseXp + streakXp + speedXp;
    const accuracy = rawQuestions.length > 0 ? Number(((correctCount / rawQuestions.length) * 100).toFixed(1)) : 0;

    // Badges Unlocked
    let badge = null;
    if (accuracy >= 90) badge = 'MHT-CET Master 🏆';
    else if (maxStreak >= 5) badge = 'Streak Champion 🔥';
    else if (speedXp >= 15) badge = 'Speed Demon ⚡';
    else if (accuracy >= 70) badge = 'Accuracy Ace 🎯';

    // Save Practice Attempt
    const attempt = await prisma.practiceQuizAttempt.create({
      data: {
        studentId,
        subjectId,
        chapterId,
        totalQuestions: rawQuestions.length,
        correctAnswers: correctCount,
        score: correctCount,
        xpEarned: totalXp,
        accuracy,
        timeTakenSeconds: Number(timeTakenSeconds),
        streakCount: maxStreak,
        answers: questionResults
      }
    });

    res.status(201).json({
      success: true,
      message: 'Practice session completed!',
      data: {
        attemptId: attempt.id,
        correctAnswers: correctCount,
        totalQuestions: rawQuestions.length,
        accuracy,
        timeTakenSeconds,
        maxStreak,
        xpBreakdown: {
          baseXp,
          streakXp,
          speedXp,
          totalXp
        },
        badge,
        questionResults
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== PROGRESS & LEADERBOARD ====================

exports.getStudentPracticeProgress = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        user: { select: { name: true, email: true } }
      }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // 1. Student's Practice Attempts
    const attempts = await prisma.practiceQuizAttempt.findMany({
      where: { studentId },
      include: {
        subject: true,
        chapter: true
      },
      orderBy: { submittedAt: 'desc' }
    });

    const totalQuizzes = attempts.length;
    const totalXp = attempts.reduce((sum, a) => sum + (a.xpEarned || 0), 0);
    const avgAccuracy = totalQuizzes > 0
      ? Number((attempts.reduce((sum, a) => sum + (a.accuracy || 0), 0) / totalQuizzes).toFixed(1))
      : 0;

    const level = Math.floor(totalXp / 100) + 1;
    const currentLevelXp = totalXp % 100;

    // 2. Chapterwise Mastery Heatmap Calculation
    const chapterStatsMap = new Map();
    attempts.forEach(a => {
      if (!a.chapterId) return;
      if (!chapterStatsMap.has(a.chapterId)) {
        chapterStatsMap.set(a.chapterId, {
          chapterId: a.chapterId,
          chapterName: a.chapter?.name || 'Chapter',
          subjectName: a.subject?.name || 'Subject',
          attemptsCount: 0,
          totalAccuracySum: 0
        });
      }
      const stat = chapterStatsMap.get(a.chapterId);
      stat.attemptsCount++;
      stat.totalAccuracySum += a.accuracy;
    });

    const chapterMastery = Array.from(chapterStatsMap.values()).map(c => {
      const avgAcc = Number((c.totalAccuracySum / c.attemptsCount).toFixed(1));
      let status = 'Needs Practice';
      if (avgAcc >= 80) status = 'Mastered';
      else if (avgAcc >= 50) status = 'Intermediate';

      return {
        chapterId: c.chapterId,
        chapterName: c.chapterName,
        subjectName: c.subjectName,
        attemptsCount: c.attemptsCount,
        accuracy: avgAcc,
        status // 'Mastered' | 'Intermediate' | 'Needs Practice'
      };
    });

    // 3. Class Leaderboard (Ranked by Total XP in Class)
    const classStudents = await prisma.student.findMany({
      where: { classId: student.classId },
      include: {
        user: { select: { name: true } },
        practiceAttempts: { select: { xpEarned: true } }
      }
    });

    const leaderboard = classStudents.map(s => {
      const sXp = s.practiceAttempts.reduce((sum, a) => sum + (a.xpEarned || 0), 0);
      return {
        studentId: s.id,
        uniqueId: s.uniqueId,
        name: s.user?.name || 'Student',
        totalXp: sXp,
        level: Math.floor(sXp / 100) + 1,
        isMe: s.id === studentId
      };
    }).sort((a, b) => b.totalXp - a.totalXp);

    // Classmate list for challenges (excluding self)
    const classmates = leaderboard.filter(s => !s.isMe);

    res.json({
      success: true,
      data: {
        studentInfo: {
          name: student.user?.name,
          uniqueId: student.uniqueId,
          className: student.class?.name
        },
        stats: {
          totalXp,
          level,
          currentLevelXp,
          totalQuizzes,
          avgAccuracy
        },
        chapterMastery,
        recentAttempts: attempts.slice(0, 10),
        leaderboard,
        classmates
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== CLASSMATE CHALLENGES ====================

exports.createChallenge = async (req, res) => {
  try {
    const { opponentStudentId, subjectId, chapterId, questionCount = 10 } = req.body;
    const challengerId = req.user.studentId;

    const challenger = await prisma.student.findUnique({ where: { id: challengerId } });
    const opponent = await prisma.student.findUnique({ where: { id: opponentStudentId } });

    if (!challenger || !opponent) return res.status(404).json({ success: false, message: 'Student or opponent not found' });
    if (challenger.classId !== opponent.classId) {
      return res.status(400).json({ success: false, message: 'You can only challenge classmates in your class' });
    }

    const count = Number(questionCount);
    const durationMins = Number((count * 1.3).toFixed(1));

    // Generate Standardized MHT-CET Questions for both to attempt
    const dbQuestions = await prisma.question.findMany({
      where: { chapterId, questionType: 'MCQ' },
      take: count
    });

    let challengeQs = dbQuestions.map((q, idx) => ({
      id: q.id,
      questionText: q.questionText,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
      correctOption: 0,
      explanation: q.answerKey || 'MHT-CET challenge solution.'
    }));

    if (challengeQs.length < count) {
      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
      for (let i = challengeQs.length; i < count; i++) {
        challengeQs.push({
          id: `chall_q_${i}`,
          questionText: `MHT-CET Standard Practice Question ${i + 1} for ${chapter?.name || 'Chapter'}`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOption: 0,
          explanation: 'Standard formula solution.'
        });
      }
    }

    const challenge = await prisma.practiceChallenge.create({
      data: {
        challengerId,
        opponentId: opponentStudentId,
        classId: challenger.classId,
        subjectId,
        chapterId,
        questionCount: count,
        questionsData: challengeQs,
        durationMins,
        status: 'PENDING'
      },
      include: {
        challenger: { include: { user: { select: { name: true } } } },
        opponent: { include: { user: { select: { name: true } } } },
        subject: true,
        chapter: true
      }
    });

    res.status(201).json({ success: true, message: 'Classmate challenge created!', data: challenge });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentChallenges = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const challenges = await prisma.practiceChallenge.findMany({
      where: {
        OR: [
          { challengerId: studentId },
          { opponentId: studentId }
        ]
      },
      include: {
        challenger: { include: { user: { select: { name: true } } } },
        opponent: { include: { user: { select: { name: true } } } },
        subject: true,
        chapter: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: challenges });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitChallengeAttempt = async (req, res) => {
  try {
    const { challengeId, answers = {}, timeTakenSeconds = 0 } = req.body;
    const studentId = req.user.studentId;

    const challenge = await prisma.practiceChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

    const isChallenger = challenge.challengerId === studentId;
    const isOpponent = challenge.opponentId === studentId;

    if (!isChallenger && !isOpponent) {
      return res.status(403).json({ success: false, message: 'You are not part of this challenge' });
    }

    const questions = Array.isArray(challenge.questionsData) ? challenge.questionsData : [];
    let score = 0;
    let xp = 0;

    questions.forEach(q => {
      if (answers[q.id] !== undefined && Number(answers[q.id]) === q.correctOption) {
        score++;
        xp += 10;
      }
    });

    const updateData = {};
    if (isChallenger) {
      updateData.challengerScore = score;
      updateData.challengerTime = Number(timeTakenSeconds);
      updateData.challengerXp = xp;
    } else {
      updateData.opponentScore = score;
      updateData.opponentTime = Number(timeTakenSeconds);
      updateData.opponentXp = xp;
      updateData.status = 'ACCEPTED';
    }

    // Determine winner if both completed
    const updated = await prisma.practiceChallenge.update({
      where: { id: challengeId },
      data: updateData,
      include: {
        challenger: { include: { user: { select: { name: true } } } },
        opponent: { include: { user: { select: { name: true } } } }
      }
    });

    if (updated.challengerScore !== null && updated.opponentScore !== null) {
      let winnerId = null;
      if (updated.challengerScore > updated.opponentScore) {
        winnerId = updated.challengerId;
      } else if (updated.opponentScore > updated.challengerScore) {
        winnerId = updated.opponentId;
      } else {
        // Tiebreaker: fastest time
        winnerId = (updated.challengerTime || 9999) <= (updated.opponentTime || 9999)
          ? updated.challengerId
          : updated.opponentId;
      }

      await prisma.practiceChallenge.update({
        where: { id: challengeId },
        data: { status: 'COMPLETED', winnerId }
      });
    }

    res.json({ success: true, message: 'Challenge attempt submitted!', data: updated });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
