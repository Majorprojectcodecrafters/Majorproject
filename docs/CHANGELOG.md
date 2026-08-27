# QPGen System Changelog & Version History

All notable updates, architectural changes, database schema modifications, and feature releases for the QPGen system are documented in this log.

## [1.3.0] - 2026-08-27 (Google Drive OAuth Storage & Protected Document Viewer)

### Added
- **Google Drive Storage Integration (`drive.service.js`)**: Linked Google Drive OAuth 2.0 credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `GOOGLE_REFRESH_TOKEN`). Admins and Teachers can upload textbooks, notes, and study material PDFs directly to Google Drive folder `16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw`.
- **Google Drive Lock Down (`copyRequiresWriterPermission: true`)**: Configured Google Drive permissions API to set `copyRequiresWriterPermission: true` on uploaded files, prohibiting downloading, printing, and copying for all reader accounts.
- **Protected Document Viewer (`ProtectedDocumentViewer.jsx`)**: Built a multi-layer protected inline PDF viewer modal for students featuring:
  - **Dynamic Tiled Watermarks**: Renders `CONFIDENTIAL • STUDENT: {NAME} ({ID}) • QPGEN PROTECTED COPY`.
  - **Download & Copy Interception**: Right-click context menu, text selection, drag & drop, and shortcut key combos (`Ctrl+P`, `Ctrl+S`, `Ctrl+C`, `Cmd+P`, `Cmd+S`, `Cmd+C`, `F12`) are strictly disabled.
  - **Anti-Screenshot Deterrent**: Blurs viewer display (`filter: blur(12px)`) when window focus is lost or screen grab utilities are triggered.
  - **Print Shield**: CSS `@media print` rules hide document content on any print trigger.
- **Student Materials Hub (`StudentMaterialsPage.jsx`)**: Students can directly browse and view class study materials in protected mode.

---

## [1.2.5] - 2026-08-27 (Google Drive Service Account Env Binding Standardization)

### Added
- **Google Drive Storage Services (`drive.service.js` & `googleDriveService.js`)**: Enhanced Google Drive authentication fallbacks so that both `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and `GOOGLE_DRIVE_CLIENT_EMAIL` / `GOOGLE_DRIVE_PRIVATE_KEY` environment variable naming conventions work seamlessly for RAG study material uploads and Announcement file attachments.

---

## [1.2.4] - 2026-08-27 (Duplicate Option Prefix Cleanup Fix)

### Fixed
- **Duplicate Option Letter Prefixes (`practice.controller.js` & `StudentPracticePage.jsx`)**: Implemented `cleanOptionText` helper function using regex `^[\(\[]?[a-dA-D1-4][\)\.\:\-]\s*` to automatically strip any embedded option letters (e.g. `"D) Growth rate"`, `"B) Development"`) before rendering. Resolves duplicate option label bug (`A) D) Growth rate` $\rightarrow$ `A. Growth rate`).

---

## [1.2.3] - 2026-08-27 (Practice Quiz Answer Evaluation & UI Rendering Fix)

### Fixed
- **Answer Key Evaluation (`backend/src/controllers/practice.controller.js`)**: Implemented `parseCorrectOption` helper function to intelligently map database `answerKey` values (letters 'A'-'D', option index '0'-'3', or full text strings) and LLM string options. Implemented `shuffleOptionsAndCorrectIndex` to randomly shuffle MCQ options on every session retake so Option (A) is no longer hardcoded as the correct answer.
- **UI LaTeX Code Cleanup (`frontend/src/pages/StudentPracticePage.jsx`)**: Replaced raw unrendered LaTeX string literals (`$\rightarrow 1.5\times$`) with clean, polished unicode text formatting (`→ 1.5×`).

---

## [1.2.2] - 2026-08-27 (Student Registration Form Bug Fix)

### Fixed
- **Student Self-Registration (`/register`)**: Fixed a UI blocking bug where unauthenticated students visiting `/register` were unable to populate the mandatory Class dropdown due to calls to admin-only protected routes (`/api/admin/classes` and `/api/admin/streams`).
- Created public unauthenticated endpoints `GET /api/auth/classes` and `GET /api/auth/streams` in `auth.controller.js` and `auth.routes.js`.
- Registered test student **Chiku** (`chiku@gg.com` / `stu123456`) successfully with auto-generated ID `STU-759761` and verified instant login capabilities.

---

## [1.2.1] - 2026-08-27 (Server Startup Path Import Fix)

### Fixed
- **App Startup (`backend/src/app.js`)**: Added missing `const path = require('path');` import required for static file serving of `/uploads`. Backend server starts and runs cleanly on port `5000` with HTTP `200 OK` response on `/health` endpoint.

---

## [1.2.0] - 2026-08-27 (Gamified MHT-CET Practice Arena & Announcement System)

### Added
- **Gamified MHT-CET Practice Module (`/student/practice`)**:
  - Chapterwise practice selector (Subject $\rightarrow$ Chapter $\rightarrow$ Question Count).
  - Test session countdown timer calculated at **1.3 minutes per question**.
  - **Gamification Engine**:
    - **Base XP**: 10 XP per correct MHT-CET question.
    - **Streak Multipliers**: 3 consecutive correct $\rightarrow 1.5\times$ XP (15 XP); 5 consecutive correct $\rightarrow 2.0\times$ XP (20 XP).
    - **Speed Bonus**: +5 XP if question answered in under 15 seconds.
    - **Level System**: Level calculated as $\lfloor \text{Total XP} / 100 \rfloor + 1$.
  - **Classmate Challenges**: Challenge a classmate in the same division/class to the same MHT-CET practice quiz. Auto-evaluates winner upon completion.
  - **Class Leaderboard**: Ranks students in the class/division by Total XP earned.
  - **Chapter Mastery Heatmap**: Visual grid tracking chapter performance: Mastered ($>80\%$), Intermediate ($50-80\%$), Needs Practice ($<50\%$).
  - **Teacher Performance Access**: Teachers can view assigned students' practice XP, accuracy %, and chapter mastery under *"Your Students"*.

- **Announcement & Notice System (`/manage/announcements` & `/student/announcements`)**:
  - Notice composer for Admins and Teachers with Title, Content, Target Class, and File Attachments (PNG, JPG, PDF up to 10 MB limit).
  - **Target Scoping**: Teachers target assigned classes (`TeacherAssignment`); Admins can broadcast to all classes.
  - **Google Drive Storage & Fallback**: Attachments uploaded to Google Drive API (or local `/uploads` fallback) with web view links.
  - **Student Hub**: Announcement feed for student's class with image preview lightboxes and in-app PDF document viewer modals.

### Database Schema Additions
- Created `Announcement` model (`id`, `title`, `content`, `attachmentUrl`, `attachmentType`, `driveFileId`, `authorRole`, `authorName`, `authorId`, `classId`, `createdAt`).
- Created `PracticeQuizAttempt` model (`id`, `studentId`, `subjectId`, `chapterId`, `totalQuestions`, `correctAnswers`, `score`, `xpEarned`, `accuracy`, `timeTakenSeconds`, `streakCount`, `answers`, `submittedAt`).
- Created `PracticeChallenge` model (`id`, `challengerId`, `opponentId`, `classId`, `subjectId`, `chapterId`, `questionCount`, `questionsData`, `durationMins`, `challengerScore`, `opponentScore`, `status`, `winnerId`).
- Added relation fields to `Student`, `Class`, `Subject`, `Chapter`.

---

## [1.1.0] - 2026-08-26 (Student, Class Allocation, Results & Online Quiz System)

### Added
- **Role-Based Authentication & Scoping**:
  - Student registration with dynamic Class & Division dropdown (`11th C`, `11th D`).
  - Auto-generated student unique IDs (`STU_XXXXX`).
  - `TeacherAssignment` (`teacherId`, `classId`, `subjectId`) dynamically scoping student roster visibility for teachers.
- **Manual Test Result Entry & Auto Pass/Fail**:
  - Automatic pass/fail evaluation based on $\ge 35\%$ passing mark threshold.
  - Institutional Result Sheet PDF export (Puppeteer).
  - Class Result Spreadsheet Excel export (`exceljs`).
- **Teacher Online Quiz Creator & Evaluation Engine**:
  - Online quiz generation and publishing to targeted class.
  - Student interactive quiz player with countdown timer and instant evaluation.
  - Automatic masking of correct answer keys and explanations before submission.

---

## [1.0.0] - 2026-08-20 (Initial Question Paper Generation Core & RAG Pipeline)

### Added
- Question Paper Generation Pipeline (LLM + Hybrid RAG + ChromaDB + BM25 + Cross-Encoder Reranking).
- Institutional Question Paper PDF exporter (Puppeteer).
- Curriculum & Syllabus mapping system.
