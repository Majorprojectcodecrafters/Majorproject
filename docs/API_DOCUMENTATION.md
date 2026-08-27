# QPGen API Documentation

Complete REST API reference for QPGen backend services. All protected endpoints require a JWT token in the `Authorization: Bearer <token>` header.

---

## 1. Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate user and return JWT token.
- `POST /api/auth/register`: Register new user/student with dynamic class assignment.
- `GET /api/auth/me`: Fetch authenticated user profile.

---

## 2. Admin Module (`/api/admin`)
- `GET /api/admin/teachers`: List all teachers.
- `GET /api/admin/students`: List all students.
- `GET /api/admin/classes`: List all classes/divisions.
- `POST /api/admin/teacher-assignments`: Create `TeacherAssignment` (`teacherId`, `classId`, `subjectId`).
- `GET /api/admin/teacher-assignments`: Fetch active allocations.
- `DELETE /api/admin/teacher-assignments/:id`: Remove allocation.

---

## 3. Teacher Module (`/api/teacher`)
- `GET /api/teacher/assigned-classes`: Fetch teacher's allocated classes.
- `GET /api/teacher/students`: Fetch scoped student roster.
- `POST /api/teacher/results`: Submit student exam result (auto pass/fail $\ge 35\%$).
- `GET /api/teacher/results/export/excel`: Download class results spreadsheet (`.xlsx`).
- `GET /api/teacher/results/export/pdf`: Download class results institutional PDF sheet (`.pdf`).

---

## 4. Formal Quiz System (`/api/quiz`)
- `POST /api/quiz/generate`: Generate objective quiz for class.
- `POST /api/quiz/publish`: Publish quiz to class.
- `GET /api/quiz/student`: List student's published quizzes.
- `GET /api/quiz/student/:id`: Get quiz questions (masks correct answers/explanations before attempt).
- `POST /api/quiz/submit`: Submit quiz attempt and receive instant score review.

---

## 5. Gamified MHT-CET Practice Arena (`/api/practice`) [v1.2.0]
- `GET /api/practice/subjects`: Fetch subjects and chapters for practice selection.
- `POST /api/practice/generate`: Generate MHT-CET standard practice MCQs for selected chapter and question count (5, 10, 15, 20).
- `POST /api/practice/submit`: Submit practice attempt, calculate Base XP + Streak Bonus + Speed Bonus, update accuracy and chapter mastery.
- `GET /api/practice/progress`: Fetch student's Total XP, level, chapter mastery heatmap, recent attempts, and Class Leaderboard rankings.
- `POST /api/practice/challenge`: Create a classmate practice challenge.
- `GET /api/practice/challenges`: List incoming and outgoing classmate challenges.
- `POST /api/practice/challenge/submit`: Submit attempt for classmate challenge and declare winner.

---

## 6. Announcement & Notice System (`/api/announcements`) [v1.2.0]
- `POST /api/announcements`: Create announcement with optional PNG, JPG, or PDF file attachment (10 MB limit). Uploads to Google Drive API or local `/uploads` fallback. Teachers target assigned classes; Admins broadcast to all.
- `GET /api/announcements`: List announcements scoped to authenticated student/teacher/admin.
- `DELETE /api/announcements/:id`: Delete notice (Admin or creator teacher).
