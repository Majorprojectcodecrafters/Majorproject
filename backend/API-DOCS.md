# School Backend API - Complete Guide

A complete backend API for a comprehensive school management system with RAG (Retrieval-Augmented Generation) integration for AI-powered question paper generation.

## Features

✅ **User Management**
- Multi-role authentication (Admin, Teacher, Student)
- JWT-based authorization
- Role-based access control

✅ **Question Paper Management**
- Create and manage question papers
- Multiple question types (MCQ, Short Answer, Long Answer)
- Question difficulty levels
- Question paper templates

✅ **RAG/PDF Pipeline**
- PDF ingestion and processing
- Vector embeddings with ChromaDB
- Semantic search across PDFs
- AI-powered question generation

✅ **Exam Management**
- Student exam results tracking
- Semester-wise result analysis
- Exam scheduling

✅ **School Administration**
- Class management
- Stream/Section management
- Subject management
- Chapter organization

✅ **Security & Production Ready**
- Input validation (Joi)
- Rate limiting
- Security headers (Helmet)
- Logging system
- Error handling
- CORS support

## Tech Stack

- **Node.js 20+** - Runtime
- **Express.js 5** - Web framework
- **PostgreSQL** - Database
- **Prisma ORM** - Database client
- **JWT** - Authentication
- **ChromaDB** - Vector database
- **Groq API** - AI integration
- **Docker** - Containerization

## Prerequisites

### Local Development
- Node.js 20 or later
- PostgreSQL 14+
- ChromaDB running locally
- Groq API key (for AI features)

### Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+

## Installation & Setup

### Option 1: Local Development

```bash
# 1. Clone and extract the project
cd backend

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env and fill in your credentials

# 4. Set up database
npx prisma generate
npx prisma migrate deploy

# 5. Seed initial data (optional)
npm run seed

# 6. Start ChromaDB in one terminal
npm run chroma:setup
npm run chroma

# 7. Start the server in another terminal
npm run dev
```

### Option 2: Docker Deployment

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env with your configuration

# 2. Build and start all services
docker-compose up -d

# 3. Run migrations and seeding (first time)
docker-compose exec backend npm run seed

# 4. Check logs
docker-compose logs -f backend
```

### Accessing the Application

- **API Base URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`
- **PostgreSQL**: `localhost:5432`
- **ChromaDB**: `http://localhost:8000`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| GET | `/api/admin/dashboard` | Admin dashboard | Yes (Admin) |
| GET | `/api/admin/users` | Get all users | Yes (Admin) |
| POST | `/api/admin/classes` | Create class | Yes (Admin) |
| GET | `/api/admin/classes` | Get all classes | Yes (Admin) |
| POST | `/api/admin/subjects` | Create subject | Yes (Admin) |
| GET | `/api/admin/subjects` | Get all subjects | Yes (Admin) |

### Teacher Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| GET | `/api/teacher/profile` | Get teacher profile | Yes (Teacher) |
| POST | `/api/teacher/questions` | Create question | Yes (Teacher) |
| GET | `/api/teacher/questions` | Get all questions | Yes (Teacher) |
| POST | `/api/teacher/exam-results` | Create exam result | Yes (Teacher) |
| GET | `/api/teacher/students` | Get assigned students | Yes (Teacher) |

### Student Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| GET | `/api/student/profile` | Get student profile | Yes (Student) |
| GET | `/api/student/results` | Get exam results | Yes (Student) |
| GET | `/api/student/question-papers` | Get available papers | Yes (Student) |

### Question Papers

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/question-papers` | Create question paper | Yes (Teacher) |
| GET | `/api/question-papers` | Get all papers | Yes |
| GET | `/api/question-papers/:id` | Get paper by ID | Yes |
| PUT | `/api/question-papers/:id` | Update paper | Yes (Teacher) |
| DELETE | `/api/question-papers/:id` | Delete paper | Yes (Teacher) |

### RAG/PDF

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---|
| POST | `/api/rag/ingest` | Ingest PDF file | Yes (Teacher/Admin) |
| GET | `/api/rag/stats` | Get RAG stats | Yes |
| DELETE | `/api/rag/pdf/:id` | Delete PDF | Yes (Admin) |
| POST | `/api/rag/query` | Search across PDFs | Yes |

## Authentication

### Login Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@school.com",
    "password": "teacher123"
  }'

# Response
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "teacher@school.com",
      "role": "TEACHER"
    }
  }
}
```

### Using Token

Include the token in Authorization header:

```bash
curl -X GET http://localhost:5000/api/teacher/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## Database Seeding

The seed script creates:
- Admin user (admin@school.com / admin123)
- Sample teacher (teacher@school.com / teacher123)
- Classes (11th, 12th)
- Streams (Science, Commerce, Arts)
- Subjects (Physics, Chemistry, Biology, Math)
- Sample chapters and questions

```bash
npm run seed
```

## PDF Ingestion

```bash
# Ingest PDFs from a directory
npm run ingest

# Note: Requires ChromaDB running and GROQ_API_KEY configured
```

## Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/
│   │   └── prisma.js          # Prisma client
│   ├── controllers/           # Route handlers
│   ├── routes/                # API routes
│   ├── middlewares/           # Custom middleware
│   ├── validators/            # Request validation schemas
│   ├── utils/                 # Utility functions
│   ├── rag/                   # RAG pipeline
│   └── __tests__/             # Test files
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── scripts/
│   ├── seed.js                # Database seeding
│   ├── ingestPDFs.js          # PDF ingestion
│   └── setup-chroma.ps1       # ChromaDB setup
├── docker-compose.yml         # Docker compose config
├── Dockerfile                 # Docker image
├── jest.config.js             # Testing config
├── .env.example               # Environment template
└── package.json               # Dependencies
```

## Environment Variables

See `.env.example` for all available variables. Key ones:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/school_db

# JWT
JWT_SECRET=your-secret-key

# AI
GROQ_API_KEY=your-groq-key

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000

# School Info
SCHOOL_NAME=Your School
SCHOOL_EMAIL=school@example.com
SCHOOL_PHONE=123-456-7890
```

## Deployment

### Docker Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Change JWT_SECRET to a strong random value
- [ ] Configure database credentials
- [ ] Set GROQ_API_KEY
- [ ] Configure CORS_ORIGIN for frontend URL
- [ ] Run `docker-compose up -d`
- [ ] Verify logs: `docker-compose logs -f`

### Environment-Specific Config

```bash
# Development
NODE_ENV=development

# Production
NODE_ENV=production
```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -U postgres -h localhost

# Check connection string in .env
DATABASE_URL="postgresql://user:password@localhost:5432/db"
```

### ChromaDB Connection Issues
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1

# Restart ChromaDB
npm run chroma:setup
npm run chroma
```

### Tests Failing
```bash
# Ensure all dependencies are installed
npm install

# Run migrations
npx prisma migrate deploy

# Run tests
npm test
```

## Monitoring & Logs

Logs are stored in `logs/` directory:
- `app-YYYY-MM-DD.log` - Daily log files
- Automatically rotated daily

Logs include:
- Request/response details
- Error stack traces
- Custom application events

## Performance Tips

1. **Database Indexes**: Ensure Prisma migrations run
2. **Rate Limiting**: Configured at 100 req/15min per IP
3. **Caching**: Consider adding Redis for session caching
4. **PDF Processing**: Large files may take time; process async

## Contributing

1. Follow existing code structure
2. Add tests for new features
3. Update API documentation
4. Run `npm test` before committing

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review error responses in API calls
3. Verify environment configuration
4. Check database connections

## Production Readiness Checklist

- [x] Input validation
- [x] Authentication/Authorization
- [x] Rate limiting
- [x] Error handling
- [x] Logging system
- [x] Database migrations
- [x] Security headers
- [x] CORS configuration
- [x] Docker support
- [x] Environment configuration
- [x] API documentation
- [x] Test coverage

## License

ISC

---

**Ready for production deployment!** 🚀
