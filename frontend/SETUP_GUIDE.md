# QPGen Frontend - Complete Setup & Run Guide

## 🎯 Overview

This is a complete, production-ready React 18 + Vite frontend for the QPGen RAG-based Question Paper Generator. It includes:

- ✅ JWT authentication with role-based access control
- ✅ Teacher dashboard with paper management
- ✅ Interactive question paper generator form
- ✅ Paper viewer with download functionality
- ✅ Admin knowledge base management
- ✅ React Query for data fetching and caching
- ✅ Zod for type-safe form validation
- ✅ Tailwind CSS for clean, functional styling
- ✅ Role-based routing (Teacher, Admin, Student)

## 📁 Frontend Location

```
c:\Users\Anuja Ankush Sable\Downloads\backend\frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx       # JWT auth, login/logout/register
│   ├── components/
│   │   ├── Navbar.jsx            # Top nav with role-based links
│   │   └── ProtectedRoute.jsx    # Role-based route guard
│   ├── pages/
│   │   ├── LoginPage.jsx         # Auth entry point
│   │   ├── TeacherDashboard.jsx  # List of generated papers
│   │   ├── QPGeneratorPage.jsx   # Form to generate papers
│   │   ├── PaperViewerPage.jsx   # Display + download papers
│   │   ├── AdminDashboardPage.jsx     # Admin stats
│   │   ├── AdminKnowledgeBasePage.jsx # Upload PDFs
│   │   └── UnauthorizedPage.jsx  # 403 page
│   ├── lib/
│   │   ├── api.js                # Axios client with JWT auto-attach
│   │   └── schemas.js            # Zod schemas for all forms
│   ├── App.jsx                   # Main app + React Router setup
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Tailwind + custom styles
├── index.html
├── package.json                  # All dependencies listed
├── vite.config.js                # Vite config with /api proxy
├── tailwind.config.js
├── postcss.config.js
├── .env.example                  # Environment template
├── README.md
└── SETUP_GUIDE.md                # This file
```

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Node Modules

**Windows:**
```bash
cd c:\Users\Anuja Ankush Sable\Downloads\backend\frontend
npm install
```

**Mac/Linux:**
```bash
cd ~/path/to/backend/frontend
npm install
```

This installs all dependencies:
- react 18.3.1
- vite 5.0.8
- tailwindcss 3.4.1
- @tanstack/react-query 5.28.0
- zod 3.22.4
- react-router-dom 6.21.1
- axios 1.6.5
- react-hook-form 7.50.0

**Expected duration:** 30-60 seconds

### Step 2: Create .env File

Copy the example and update if needed:
```bash
cp .env.example .env
```

**Content of .env:**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

This is already configured for local development. Change only if your backend runs on a different port.

### Step 3: Start Frontend Dev Server

```bash
npm run dev
```

**Output should be:**
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Press h + enter to show help
```

✅ Frontend is now running on **http://localhost:5173**

### Step 4: Ensure Backend is Running

In a separate terminal, run:
```bash
cd c:\Users\Anuja Ankush Sable\Downloads\backend\backend
npm run dev
```

✅ Backend should be running on **http://localhost:5000**

## 🔐 Demo Login Credentials

Once both frontend and backend are running, visit **http://localhost:5173** and login with:

### Teacher Account
- **Email:** teacher@school.com
- **Password:** teacher123
- **Permissions:** Generate papers, view own papers, publish

### Admin Account
- **Email:** admin@school.com
- **Password:** admin123
- **Permissions:** All teacher permissions + knowledge base management + dashboard stats

### Student Account (View Only - Not Implemented Yet)
- **Email:** student@school.com (to be created)
- **Password:** student123
- **Permissions:** View published papers

## 🎨 Frontend Architecture

### Authentication Flow
1. User submits login on `LoginPage.jsx`
2. `useAuth()` hook calls `POST /api/auth/login`
3. Backend returns JWT token and user object
4. Token stored in `localStorage` as `token`
5. User stored in `localStorage` as `user`
6. On every API call, token auto-attached via `api.js` interceptor
7. If token expires (401), auto-redirect to `/login`

### Role-Based Routing
- `<ProtectedRoute>` component wraps role-sensitive routes
- Checks `user.role` against `allowedRoles` prop
- Redirects unauthorized users to `/unauthorized`

### Data Fetching
- All data fetching via React Query (TanStack Query)
- Automatic caching (5-minute stale time by default)
- Mutations for POST/PUT/PATCH/DELETE
- Loading and error states built-in

### Form Validation
- Zod schemas defined in `src/lib/schemas.js`
- React Hook Form for form state management
- Automatic error message display

## 📱 Key Pages

### 1. Login Page (`/login`)
- Email/password form
- Shows demo credentials
- Redirects to appropriate dashboard based on role

### 2. Teacher Dashboard (`/dashboard`)
- Lists all question papers for the teacher
- Shows status (DRAFT/PUBLISHED), subject, marks, creation date
- "Generate New Paper" button to start QP creation
- Click paper title to view/download

### 3. QP Generator (`/generator`)
- **Step 1:** Form to select subject, chapters, difficulty, marks, duration, question counts
- Fetches subjects from `GET /api/teacher/subjects`
- Fetches chapters from `GET /api/teacher/subjects/{id}/chapters`
- **Step 2:** Review generated paper (shown after generation)
- Displays questions organized by type (MCQ, Short Answer, Long Answer)
- **Step 3:** Save to database via `POST /api/rag/save`

### 4. Paper Viewer (`/paper/:paperId`)
- Full paper display with all questions
- Sections: Paper metadata, MCQ section, Short answer section, Long answer section
- Download buttons:
  - Download (Student) → PDF without answers
  - Download (Answer Key) → PDF with answer key
- "Show Sources" toggle (shows RAG context retrieval info)
- Publish button (if status = DRAFT)

### 5. Admin Dashboard (`/admin/dashboard`)
- Statistics: Total users, teachers, students, classes, subjects, chapters
- Question paper stats: Draft vs Published counts
- Auto-refreshes data from `GET /api/admin/dashboard`

### 6. Admin Knowledge Base (`/admin/knowledge-base`)
- Upload PDFs with metadata:
  - Document type (Textbook, Past Paper, Marking Scheme)
  - Subject selection
  - Grade (11th or 12th)
- Shows stats: Total chunks, collection name
- Stores PDFs in backend at `pdfs/{type}/{grade}/{subject}/`
- PDFs indexed automatically into ChromaDB for RAG retrieval

## 🔌 API Contracts

### Login
```
POST /api/auth/login
Request: { email, password }
Response: { success, data: { user, token } }
```

### Get Question Papers
```
GET /api/question-papers?status=&subjectId=&difficulty=&page=1&limit=10
Response: { success, data: [...], pagination: {...} }
```

### Generate QP (RAG)
```
POST /api/rag/generate
Request: {
  subjectId,
  chapterIds: [...]
  difficulty: EASY|MEDIUM|HARD
  totalMarks: number
  durationMins: number
  mcqCount: number
  shortCount: number
  longCount: number
  instructions?: string
  grade?: string
}
Response: { success, data: { questions, subject, chapters, totalMarks, contextSources } }
```

### Save Generated QP
```
POST /api/rag/save
Request: {
  title,
  subjectId,
  totalMarks,
  durationMins,
  difficulty,
  instructions?,
  questions: [{ questionText, marks, difficulty, options, answerKey }]
}
Response: { success, data: { id, title, ... } }
```

### Get Paper by ID
```
GET /api/question-papers/{id}
Response: { success, data: { id, title, subject, questions: [...], ... } }
```

### Download Paper PDF
```
GET /api/teacher/qp/{id}/export/{student|teacher}
Response: PDF blob (attachment)
```

### Upload Document to KB
```
POST /api/rag/ingest (multipart/form-data)
Request: { pdf: File, type, subjectId, grade }
Response: { success, data: { ... } }
```

### Get RAG Stats
```
GET /api/rag/stats
Response: { success, data: { totalChunks, collection } }
```

## 🛠 Common Tasks

### Change API Base URL
Edit `.env`:
```
VITE_API_BASE_URL=http://your-backend-url/api
```

### Build for Production
```bash
npm run build
```

Outputs to `dist/` folder (ready for deployment).

### Preview Production Build
```bash
npm run preview
```

### Run Linter (Optional)
```bash
npm run lint
```

### Add New Page
1. Create `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`
3. Use `useQuery` for data, `useMutation` for mutations
4. Use Zod schema for validation if form is involved

### Add New API Endpoint Call
1. Add endpoint call in `src/lib/api.js` or in the component
2. Example:
```javascript
const { data } = useQuery({
  queryKey: ['endpointName'],
  queryFn: async () => {
    const response = await apiClient.get('/endpoint');
    return response.data.data;
  }
});
```

## 📊 Tech Stack Details

| Tech | Version | Purpose |
|------|---------|---------|
| React | 18.3.1 | UI library |
| Vite | 5.0.8 | Build tool (5x faster than CRA) |
| Tailwind CSS | 3.4.1 | Styling |
| React Query | 5.28.0 | Server state management |
| React Router | 6.21.1 | Client-side routing |
| Zod | 3.22.4 | Schema validation |
| React Hook Form | 7.50.0 | Form state management |
| Axios | 1.6.5 | HTTP client |

## ✅ What's Implemented

✅ Complete login/auth flow with JWT  
✅ Teacher dashboard with paper list  
✅ QP generator form with RAG integration  
✅ Paper viewer with PDF export  
✅ Admin dashboard with stats  
✅ Admin knowledge base (upload PDFs)  
✅ Role-based routing and access control  
✅ React Query data fetching and caching  
✅ Zod form validation  
✅ Tailwind CSS styling (clean, functional)  
✅ Error handling and loading states  
✅ Auto-logout on token expiration  
✅ Responsive design  

## ⚠️ Known Limitations / Future Enhancements

- [ ] Student view for published papers not implemented (can be added)
- [ ] Real-time progress tracking for async QP generation (currently uses simple loading)
- [ ] Document approval workflow not in admin KB (can be added to backend schema)
- [ ] Detailed RAG sources panel (shows file names, could show chunk text + similarity)
- [ ] Toast notifications (currently uses alert())
- [ ] Dark mode
- [ ] Advanced search/filter for papers
- [ ] User profile page
- [ ] Bulk document upload
- [ ] API error logging/monitoring

## 🐛 Troubleshooting

### Port Already in Use
If `http://localhost:5173` is already in use:
```bash
npm run dev -- --port 5174
```

### CORS Error
Make sure backend `CORS_ORIGIN=*` in backend `.env`

### 401 Unauthorized
- Ensure backend is running
- Check token in browser DevTools → Application → localStorage
- Try logging in again

### QP Generation Timeout
- RAG generation can take 10-30 seconds
- This is normal (Groq API is being called)
- Don't close the page during generation

### Blank Page After Login
- Check browser console for errors
- Ensure backend `/api/teacher/subjects` returns data
- Verify API proxy works: Open DevTools Network tab and check API requests

## 📞 Support

For issues:
1. Check the backend logs: `c:\Users\Anuja Ankush Sable\Downloads\backend\backend\logs\`
2. Check browser console: F12 → Console tab
3. Check backend is running: `http://localhost:5000/health` should return HTTP 200
4. Check CORS: Backend should have `CORS_ORIGIN=*`

## 🚀 Deployment

### Deploy to Vercel (Recommended for React)
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Deploy to AWS S3 + CloudFront
```bash
npm run build
# Upload dist/ to S3, CloudFront serves it
# Configure API Gateway for backend
```

Remember to update `.env` with production API URL before building for production.

---

## 🎉 You're All Set!

Your frontend is ready to run. Start both frontend and backend, then:

1. Open http://localhost:5173 in your browser
2. Login with teacher@school.com / teacher123
3. Generate your first question paper!

Happy coding! 🚀
