# QPGen Database Schema & Prisma Models

Documentation of PostgreSQL database models managed by Prisma ORM (`backend/prisma/schema.prisma`).

---

## Core Models & Enums

### Enums
- **`Role`**: `ADMIN`, `TEACHER`, `STUDENT`.
- **`Difficulty`**: `EASY`, `MEDIUM`, `HARD`.
- **`PaperStatus`**: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- **`ChallengeStatus`**: `PENDING`, `ACCEPTED`, `COMPLETED`, `DECLINED`.

---

## Model Summaries

### User & Role Profiles
- **`User`**: Base identity storing `name`, `email`, `password` (hashed), `role`, `dob`.
- **`Teacher`**: Linked to `User`, stores `education`, `experienceYears`.
- **`Student`**: Linked to `User`, stores `uniqueId`, `contact`, `classId`, `streamId`.

### Academic Curriculum
- **`Board`**: Board of Education (e.g. Maharashtra State Board).
- **`Stream`**: Stream (e.g. Science).
- **`Class`**: Academic division (e.g. `11th C`, `11th D`).
- **`Subject`**: Subject details (e.g. Physics, Chemistry).
- **`Chapter`**: Chapter details under a subject.

### Allocations & Scoping
- **`TeacherAssignment`**: Links `teacherId`, `classId`, and `subjectId`.
- **`TeacherStudent`**: Explicit link between teacher and student.

### Formal Assessments & Results
- **`QuestionPaper`**: Generated exam paper record.
- **`ExamResult`**: Saved test marks for a student ($0 \le \text{obtainedMarks} \le \text{totalMarks}$), auto-evaluated pass/fail ($\ge 35\%$).
- **`Quiz`**: Formal online quiz created by teacher.
- **`QuizQuestion`**: MCQ question for formal quiz.
- **`QuizAttempt`**: Saved student submission for formal quiz.

### Gamified MHT-CET Practice & Challenges (v1.2.0)
- **`PracticeQuizAttempt`**:
  - `studentId`, `subjectId`, `chapterId`
  - `totalQuestions`, `correctAnswers`, `score`
  - `xpEarned`: Calculated Base XP + Streak Bonus ($1.5\times$ for 3, $2.0\times$ for 5) + Speed Bonus (+5 XP $<15\text{s}$).
  - `accuracy`: Accuracy percentage.
  - `timeTakenSeconds`, `streakCount`.
  - `answers`: JSON array storing question-by-question review.
- **`PracticeChallenge`**:
  - `challengerId`, `opponentId`, `classId`, `subjectId`, `chapterId`.
  - `questionCount`, `questionsData` (JSON array), `durationMins`.
  - `challengerScore`, `challengerTime`, `challengerXp`.
  - `opponentScore`, `opponentTime`, `opponentXp`.
  - `status`: `PENDING` | `ACCEPTED` | `COMPLETED` | `DECLINED`.
  - `winnerId`: Declared winner student ID.

### Announcements & Notices (v1.2.0)
- **`Announcement`**:
  - `title`, `content`, `attachmentUrl`, `attachmentType` (`IMAGE` | `PDF` | `NONE`), `driveFileId`.
  - `authorRole`, `authorName`, `authorId`.
  - `classId`: Target class ID (null = Broadcast to all classes).
