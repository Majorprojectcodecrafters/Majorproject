# Quick Setup Guide

Get the backend running in 5 minutes!

## Prerequisites

- Node.js 20+ - [Download](https://nodejs.org/)
- PostgreSQL 14+ - [Download](https://www.postgresql.org/download/)
- Groq API Key - [Get one](https://console.groq.com)
- Git - [Download](https://git-scm.com/)

## Option 1: Local Development (Fastest)

### Step 1: Setup Environment
```bash
cd backend
cp .env.example .env
# Edit .env - set your database URL and Groq API key
```

### Step 2: Install & Prepare Database
```bash
npm install
npx prisma migrate deploy
npm run seed
```

### Step 3: Start Services (in separate terminals)

**Terminal 1 - ChromaDB:**
```bash
npm run chroma:setup
npm run chroma
```

**Terminal 2 - Server:**
```bash
npm run dev
```

### Step 4: Verify
```bash
# In a new terminal
curl http://localhost:5000/health
```

✅ **Done!** API is running at `http://localhost:5000`

---

## Option 2: Docker (Recommended)

### Step 1: Prepare Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### Step 2: Start Everything
```bash
docker-compose up -d
```

### Step 3: Initialize Database
```bash
docker-compose exec backend npm run seed
```

### Step 4: Verify
```bash
docker-compose logs backend
curl http://localhost:5000/health
```

✅ **Done!** All services running:
- API: `http://localhost:5000`
- Postgres: `localhost:5432`
- ChromaDB: `http://localhost:8000`

---

## Environment Variables

Copy `.env.example` to `.env` and update these:

| Variable | Example | Required |
|----------|---------|----------|
| DATABASE_URL | postgresql://user:pass@localhost:5432/school_db | Yes |
| JWT_SECRET | your-secret-key-here | Yes |
| GROQ_API_KEY | gsk_xxx | Yes (for AI features) |
| SCHOOL_NAME | Your School | Yes |
| CHROMA_HOST | localhost | Yes |
| CHROMA_PORT | 8000 | Yes |

---

## Common Commands

```bash
# Development
npm run dev              # Start with hot reload

# Testing
npm test                 # Run tests
npm run test:watch      # Run tests in watch mode

# Database
npx prisma studio      # Visual database explorer
npx prisma migrate dev  # Create & run migration
npm run seed            # Seed initial data

# PDF Processing
npm run ingest          # Ingest PDFs

# Production
npm start               # Start server
docker-compose up -d    # Start with Docker
```

---

## Quick API Tests

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "TEACHER",
    "dob": "1990-01-15",
    "education": "M.Sc",
    "experienceYears": 5
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

---

## Seed Data

After running `npm run seed`, you have:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |
| Teacher | teacher@school.com | teacher123 |

---

## API Documentation

Interactive API docs available at:
```
http://localhost:5000/api-docs
```

---

## Troubleshooting

### "Port 5000 already in use"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### "Database connection refused"
```bash
# Check PostgreSQL is running
psql -U postgres

# Check connection string in .env
# Format: postgresql://user:password@localhost:5432/database
```

### "ChromaDB connection refused"
```bash
# Check if running
curl http://localhost:8000/api/v1

# Restart
npm run chroma:setup
npm run chroma
```

### Tests failing
```bash
# Ensure database is set up
npx prisma migrate deploy

# Run migrations
npm run seed

# Try tests again
npm test
```

---

## Next Steps

1. **Read Full Documentation**: [API-DOCS.md](./API-DOCS.md)
2. **Deploy Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **View Database**: `npx prisma studio`
4. **API Explorer**: `http://localhost:5000/api-docs`
5. **Create .frontend directory** for React app

---

## Need Help?

1. Check logs: `npm run dev 2>&1 | tee debug.log`
2. Test database: `npx prisma db push`
3. Review [API-DOCS.md](./API-DOCS.md) for endpoints
4. Check `.env.example` for all variables

---

**You're all set! Happy coding! 🚀**
