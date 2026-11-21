# QPGen - AI-Powered Question Paper Generator & School Management System 🎓🚀

[![Node.js Version](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.x-blue.svg)](https://react.dev/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange.svg)](https://www.trychroma.com/)
[![License](https://img.shields.io/badge/license-ISC-lightgrey.svg)](LICENSE)

**QPGen** is an enterprise-grade school management platform and AI-assisted question paper generator tailored for educational institutions. Powered by an advanced Hybrid Retrieval-Augmented Generation (RAG) pipeline, QPGen automates curriculum-aligned exam paper creation with rigorous board formatting, KaTeX math rendering, and automated result tracking.

---

## 🌟 Key Features

### 1. 🤖 AI-Powered Question Paper Generator (Hybrid RAG)
- **Advanced Retrieval**: Integrates ChromaDB dense embeddings, BM25 keyword search, Reciprocal Rank Fusion (RRF), and Cross-Encoder reranking.
- **Curriculum & Pattern Alignment**: Supports standard board patterns (e.g., MSBSHSE / CBSE) with strict chapter weighting and section structures.
- **STEM & Math Notation**: High-fidelity LaTeX/KaTeX equation rendering and embedded diagram registry.
- **Production PDF Generation**: One-click print-ready PDF export via headless Chromium (Puppeteer) with official institutional headers.

### 2. 🔐 Multi-Tier Role-Based Access Control (RBAC)
- **Developer**: System oversight and admin provisioning.
- **Admin**: Academic lifecycle management (Classes, Streams, Subjects, Chapters, Teacher Allotments, and Knowledge Base management).
- **Teacher**: Scoped paper generation (restricted to assigned classes and subjects), mark entry, result calculation, and objective quiz creation.
- **Student**: Personalized dashboard, attendance & results tracking, notice feed, and study material viewer.

### 3. 🎮 Gamified MHT-CET Student Practice Arena
- **Chapterwise Practice**: On-demand dynamic MCQs with adaptive difficulty.
- **Gamification Mechanics**: XP progression, streak multipliers (1.5x / 2.0x), speed bonuses, and student level progression.
- **Peer Challenges & Leaderboards**: Real-time classmate challenges and class-wide XP leaderboards.
- **Mastery Heatmaps**: Visual tracking of Mastered (>80%), Intermediate (50-80%), and Needs Practice (<50%) topics.

### 4. 📊 Exam Results & Analytics
- Automated grade evaluation ($\ge 35\%$ pass threshold).
- One-click spreadsheet export (ExcelJS) and formatted PDF scorecards.

### 5. 📢 Announcements & Notice Hub
- Targeted notices per class and division.
- Attachments powered by Google Drive API integration with local fallback staging and in-app PDF/image lightbox preview.

---

## 🏗️ System Architecture

```
Majorproject/
├── backend/                  # Express REST API & AI RAG Pipeline
│   ├── prisma/               # Prisma ORM schema & migrations
│   ├── scripts/              # Database seeding, ingestion & Chroma setup
│   └── src/
│       ├── controllers/      # Modular business logic (Auth, Admin, Teacher, Student, RAG)
│       ├── middlewares/      # JWT auth, Joi validation, rate limiting
│       ├── rag/              # Ingestion, embedder, vector store & LLM generator
│       └── utils/            # Puppeteer PDF exporter, logger, Swagger
├── frontend/                 # React + Vite Single Page Application
│   ├── src/
│   │   ├── components/       # UI components (Navbar, viewer, dialogs)
│   │   ├── contexts/         # Auth & Toast state management
│   │   ├── pages/            # Role-specific dashboard views & arenas
│   │   └── lib/              # Axios client with interceptors, Zod schemas
├── docs/                     # Architecture, API & deployment guides
└── start-local.bat           # 1-Click launcher script for local development
```

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python 3.10+](https://www.python.org/) (for ChromaDB vector server)
- [PostgreSQL](https://www.postgresql.org/) database

### 1-Click Launch (Windows)
Run the automated launcher from the project root:
```cmd
start-local.bat
```
This automatically initializes:
- **ChromaDB Vector Engine** on `http://localhost:8000`
- **Backend API Server** on `http://localhost:5000`
- **Frontend Interface** on `http://localhost:5173`

---

### Manual Setup

#### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials & API keys

# Apply database migrations & seed initial data
npx prisma migrate deploy
npm run seed

# Setup ChromaDB vector engine
npm run chroma:setup
npm run chroma

# Start backend development server (in a new terminal)
npm run dev
```

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start frontend development server
npm run dev
```

Visit **`http://localhost:5173`** to access the web application.

---

## 🔑 Default Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@school.com` | `admin123` |
| **Teacher** | `teacher@school.com` | `teacher123` |
| **Student** | `student@school.com` | `student123` |

---

## 📖 Detailed Documentation

- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Database Schema Reference](docs/DATABASE_SCHEMA.md)
- [Oracle Cloud Deployment Guide](docs/ORACLE_CLOUD_DEPLOYMENT.md)
- [Backend Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)

---

## 🛡️ Security & Performance
- **JWT Authentication** with HTTP-only tokens and tab-session validation.
- **Role-based Scope Enforcement** ensuring teachers only access assigned classes and students.
- **Request Rate Limiting & Helmet** security headers enabled across API endpoints.
- **Joi & Zod Validation** for end-to-end type safety between client and server.

---

## 📄 License
This project is licensed under the ISC License.
