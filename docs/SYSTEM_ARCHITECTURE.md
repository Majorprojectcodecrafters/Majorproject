# QPGen System Architecture & Technical Documentation

This document describes the high-level architecture, module breakdown, security controls, and design patterns of the **QPGen** system.

---

## 1. System Overview & Technology Stack

- **Backend**: Express.js REST API on Node.js.
- **Database & ORM**: PostgreSQL database managed via Prisma ORM (`schema.prisma`).
- **Vector Database & Search**: ChromaDB vector store + BM25 Sparse Search + Hybrid RRF Fusion + Cross-Encoder Reranking.
- **Frontend**: React (Vite) SPA with React Router v6, Tailwind CSS, `@tanstack/react-query`, and KaTeX math rendering.
- **Export & Storage Engines**: Puppeteer (PDF exporter), ExcelJS (Spreadsheet exporter), Google Drive API (File Attachment Storage).

---

## 2. System Modules

### Module 1: Question Paper Generation Pipeline (Protected Core)
- **RAG Retrieval**: Dense embedding search + BM25 keyword search $\rightarrow$ RRF Fusion $\rightarrow$ Cross-Encoder reranking.
- **Paper Generator**: LLM generation grounded in chapter curriculum chunks.
- **PDF Exporter**: Puppeteer html-to-pdf exporter rendering institutional header, sections, instructions, and KaTeX math.

### Module 2: Academic Hierarchy, Class Allocation & Role Scoping
- **Roles**: `ADMIN`, `TEACHER`, `STUDENT`.
- **Allocations**: `TeacherAssignment` (`teacherId`, `classId`, `subjectId`) links teachers to classes. Teachers access only students belonging to their assigned classes.

### Module 3: Test Results & Online Quizzes
- **Result Management**: Teacher enters marks for paper; auto-evaluates pass/fail ($\ge 35\%$). Exports Excel spreadsheet & PDF result sheet.
- **Online Quizzes**: Teacher creates and publishes objective quizzes. Students attempt timed quiz with instant score review.

### Module 4: Gamified MHT-CET Chapterwise Practice Quiz & Progress
- **Practice Arena**: Student selects Subject, Chapter, and Question Count (5, 10, 15, 20).
- **Gamification Mechanics**:
  - Base XP: 10 XP per correct MHT-CET MCQ.
  - Streak Bonus: 3-streak ($1.5\times$ XP = 15 XP), 5-streak ($2.0\times$ XP = 20 XP).
  - Speed Bonus: +5 XP if answered in under 15 seconds.
  - Leveling: $\lfloor \text{Total XP} / 100 \rfloor + 1$.
- **Classmate Challenges**: Peer-to-peer challenge system with identical question constraints and winner declaration.
- **Class Leaderboard**: Ranks students in division by Total XP.
- **Chapter Mastery Heatmap**: Categorizes chapters into Mastered ($>80\%$), Intermediate ($50-80\%$), Needs Practice ($<50\%$).

### Module 5: Announcement & Notice System
- **Composer**: Teachers & Admins post notices with text content, target class, and attachments.
- **Google Drive Storage**: Attachments (PNG, JPG, PDF up to 10 MB limit) stored in Google Drive (or local `/uploads` fallback).
- **Student Hub**: Notice feed with embedded PDF document viewer modal and image lightbox previews.

---

## 3. Directory Layout

```text
Majorproject/
├── docs/                               # System Change Logs & Technical Documentation
│   ├── CHANGELOG.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── API_DOCUMENTATION.md
├── backend/                            # Express.js REST API Server
│   ├── prisma/
│   │   └── schema.prisma              # PostgreSQL Prisma Models
│   ├── scripts/                        # Database Seeding & Integration Test Suites
│   ├── src/
│   │   ├── app.js                     # Express App Initialization & Router Mounting
│   │   ├── config/                    # Prisma & DB Configuration
│   │   ├── controllers/               # Business Logic Controllers
│   │   ├── middlewares/               # JWT Auth & Role Guard Middlewares
│   │   ├── rag/                       # Vector Search & RAG Paper Generator Core
│   │   ├── routes/                    # API Route Definitions
│   │   └── utils/                     # Exporters (PDF, Excel, Google Drive)
│   └── uploads/                       # Local File Attachment Storage Fallback
└── frontend/                           # React + Vite Client Application
    ├── src/
    │   ├── App.jsx                    # Client Router & Protected Route Declarations
    │   ├── components/                # Reusable UI Components & Navbar
    │   ├── contexts/                  # AuthContext & ToastContext
    │   ├── lib/                       # Axios Client Setup
    │   └── pages/                     # Application Page Views
```
