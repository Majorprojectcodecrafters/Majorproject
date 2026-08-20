# QPGen Frontend

Minimal React + Vite frontend for the RAG-based Question Paper Generator backend.

## Features

- **Login** - JWT authentication with demo credentials
- **Teacher Dashboard** - View past generated papers
- **Question Paper Generator** - Form to generate papers with RAG
- **Paper Viewer** - Display generated papers with sources panel
- **Admin Knowledge Base** - Upload and manage knowledge base documents
- **Role-Based Routing** - Teacher, Admin, and Student views
- **React Query** - Data fetching with caching and refetch
- **Zod Validation** - Type-safe form validation
- **Tailwind CSS** - Minimal, functional styling

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.jsx       # JWT auth state
├── components/
│   ├── Navbar.jsx            # Navigation bar
│   └── ProtectedRoute.jsx    # Role-based route guard
├── pages/
│   ├── LoginPage.jsx
│   ├── TeacherDashboard.jsx
│   ├── QPGeneratorPage.jsx
│   ├── PaperViewerPage.jsx
│   ├── AdminDashboardPage.jsx
│   ├── AdminKnowledgeBasePage.jsx
│   └── UnauthorizedPage.jsx
├── lib/
│   ├── api.js                # Axios client with JWT interceptor
│   └── schemas.js            # Zod schemas
├── App.jsx                   # Main app + routing
├── main.jsx                  # React entry point
└── index.css                 # Tailwind + custom styles
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Start frontend dev server:**
   ```bash
   npm run dev
   ```

   Frontend will run on **http://localhost:5173**

4. **Ensure backend is running:**
   ```bash
   # In the backend folder:
   npm run dev
   ```

   Backend should be on **http://localhost:5000**

## Demo Credentials

- **Teacher**: teacher@school.com / teacher123
- **Admin**: admin@school.com / admin123

## Features Implemented

✅ **Login Page** - JWT auth against `/api/auth/login`  
✅ **Teacher Dashboard** - Lists papers from `/api/question-papers`  
✅ **QP Generator Form** - Generates papers via `/api/rag/generate` and saves with `/api/rag/save`  
✅ **Paper Viewer** - Displays questions, allows PDF download  
✅ **Admin Dashboard** - Shows stats from `/api/admin/dashboard`  
✅ **Knowledge Base Screen** - Upload PDFs to `/api/rag/ingest`  
✅ **Role-Based Routing** - Teacher/Admin/Student views  
✅ **React Query** - Caching, refetch, mutations  
✅ **Zod Schemas** - Form validation  
✅ **Tailwind CSS** - Clean, functional styling  

## API Integration

All API calls are made through `src/lib/api.js`, which automatically:
- Attaches JWT token from localStorage as `Authorization: Bearer <token>`
- Redirects to login if token expires (401)
- Points to `http://localhost:5000/api` base URL

## Next Steps

- Add React Hook Form for more complex forms
- Add error boundaries for crash handling
- Add toast notifications for user feedback
- Add loading skeletons for better UX
- Add more admin features (user management, document deprecation)
- Deploy to cloud (Vercel, Netlify, AWS)
