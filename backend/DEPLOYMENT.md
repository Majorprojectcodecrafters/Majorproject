# Deployment Guide

Complete guide to deploy the School Backend API to production.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Local](#docker-local)
3. [Docker Production](#docker-production)
4. [Cloud Deployment](#cloud-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Local Development

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with local values
nano .env
```

### Configuration

**Key Variables:**
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_db
JWT_SECRET=dev-secret-key-not-for-production
GROQ_API_KEY=your-groq-api-key
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### Running Services

```bash
# Terminal 1: ChromaDB
npm run chroma:setup
npm run chroma

# Terminal 2: Development Server
npm run dev

# Terminal 3: Database Setup (one-time)
npx prisma migrate deploy
npm run seed
```

### Verification

```bash
# Check server is running
curl http://localhost:5000/health

# Check ChromaDB is running
curl http://localhost:8000/api/v1

# Run tests
npm test
```

---

## Docker Local

### Quick Start

```bash
# 1. Set up environment
cp .env.example .env

# 2. Update .env with local development values
# DATABASE_URL will be auto-configured by docker-compose

# 3. Build and start
docker-compose up -d

# 4. View logs
docker-compose logs -f backend

# 5. Seed database (first time only)
docker-compose exec backend npm run seed
```

### Managing Services

```bash
# View status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs -f postgres
docker-compose logs -f chroma

# Stop services
docker-compose down

# Remove everything (including data)
docker-compose down -v

# Rebuild images
docker-compose up -d --build
```

### Accessing Services

- **API**: `http://localhost:5000`
- **API Docs**: `http://localhost:5000/api-docs`
- **PostgreSQL**: `localhost:5432`
- **ChromaDB**: `http://localhost:8000`

---

## Docker Production

### Pre-Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Generate strong JWT_SECRET
- [ ] Configure database credentials
- [ ] Set GROQ_API_KEY
- [ ] Configure CORS_ORIGIN for frontend
- [ ] Update SCHOOL_* variables
- [ ] Test with `docker-compose up`
- [ ] Review security settings

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:strong_password@prod-db:5432/school_db
JWT_SECRET=generate-with-$(openssl rand -base64 32)
GROQ_API_KEY=your-production-key
SCHOOL_NAME=Your School Name
SCHOOL_EMAIL=contact@school.com
CHROMA_HOST=chroma
CHROMA_PORT=8000
CORS_ORIGIN=https://frontend.school.com
DB_USER=postgres
DB_PASSWORD=strong_password_here
DB_NAME=school_db
```

### Generate Strong Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate DB password
openssl rand -base64 16

# Securely store these values
```

### Deployment

```bash
# 1. Clone repository
git clone <repo-url>
cd backend

# 2. Create production .env
nano .env
# Add all production values

# 3. Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d

# 4. Verify deployment
docker-compose logs -f backend
curl http://localhost:5000/health

# 5. Run migrations and seeding
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed

# 6. Check all services are healthy
docker-compose ps
```

### SSL/TLS Configuration

For HTTPS, use a reverse proxy (Nginx, Caddy):

**Nginx Example:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.school.com;

    ssl_certificate /etc/letsencrypt/live/api.school.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.school.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Database Backup

```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres school_db > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres school_db < backup.sql
```

---

## Cloud Deployment

### AWS ECS/Fargate

```bash
# 1. Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t school-backend:latest .
docker tag school-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-backend:latest

# 2. Update ECS task definition with new image
# 3. Update service to use new task definition
```

### Google Cloud Run

```bash
# 1. Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/school-backend

# 2. Deploy
gcloud run deploy school-backend \
  --image gcr.io/<project-id>/school-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=<your-db-url>,JWT_SECRET=<secret>,GROQ_API_KEY=<key>
```

### Heroku

```bash
# 1. Create app
heroku create school-backend-api

# 2. Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# 3. Set environment variables
heroku config:set JWT_SECRET=<secret>
heroku config:set GROQ_API_KEY=<key>
heroku config:set NODE_ENV=production

# 4. Deploy
git push heroku main

# 5. Run migrations
heroku run npx prisma migrate deploy
heroku run npm run seed
```

### Railway.app

```bash
# 1. Connect GitHub repo
# 2. Create PostgreSQL plugin
# 3. Set environment variables
# 4. Deploy automatically on push
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# API health
curl http://localhost:5000/health

# Database connectivity
docker-compose exec backend node -e "
  const prisma = require('./src/config/prisma');
  prisma.$queryRaw\`SELECT 1\`.then(() => {
    console.log('DB OK');
    process.exit(0);
  }).catch(e => {
    console.error('DB Error:', e.message);
    process.exit(1);
  });
"

# ChromaDB health
curl http://localhost:8000/api/v1
```

### Log Monitoring

```bash
# View logs
docker-compose logs -f

# Log into specific container
docker-compose exec backend tail -f logs/app-*.log

# Search logs
docker-compose logs | grep ERROR

# Export logs
docker-compose logs > deployment-logs.txt
```

### Performance Monitoring

```bash
# Check container stats
docker stats

# Database query logs (development only)
# Enable in .env: DATABASE_LOG=query

# View slow queries
docker-compose logs postgres | grep slow
```

### Database Maintenance

```bash
# Weekly backup
0 2 * * 0 docker-compose exec -T postgres pg_dump -U postgres school_db > /backups/school_db_$(date +%Y%m%d).sql

# Monthly vacuuming
0 3 1 * * docker-compose exec -T postgres vacuumdb -U postgres school_db

# Check database size
docker-compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('school_db'));"
```

### Updates & Patches

```bash
# Update dependencies
npm update

# Update Docker images
docker pull postgres:16-alpine
docker pull chromadb/chroma:latest

# Rebuild containers
docker-compose build --pull
docker-compose up -d

# Verify update
docker-compose logs backend | head -20
```

### Scaling

For horizontal scaling:

1. **Load Balancing**: Use Nginx or HAProxy
2. **Database**: Use managed database service
3. **Cache**: Add Redis for session caching
4. **CDN**: Serve static files via CDN

### Troubleshooting

```bash
# Container won't start
docker-compose logs backend

# Database connection failed
docker-compose exec backend printenv | grep DATABASE

# Out of disk space
docker system prune -a

# Memory issues
docker stats
docker-compose down
docker system prune
docker-compose up -d
```

### Security Hardening

```bash
# Run with specific user (non-root)
# Update Dockerfile:
# USER node

# Scan for vulnerabilities
docker scan school-backend:latest

# Update all packages
npm audit fix

# Check exposed ports
docker-compose port backend
```

---

## Post-Deployment Verification

```bash
# 1. API Endpoints
curl -X GET http://localhost:5000/health
curl -X POST http://localhost:5000/api/auth/login

# 2. Database
docker-compose exec backend node -c "
  const prisma = require('./src/config/prisma');
  prisma.user.count().then(count => console.log('Users:', count));
"

# 3. Logs
docker-compose logs --tail=50 backend

# 4. Performance
docker stats

# 5. Security
curl -I http://localhost:5000
# Check for security headers (X-Content-Type-Options, etc.)
```

## Rollback Procedure

```bash
# If new version has issues:
docker-compose down
docker image rm school-backend:latest
git checkout previous-tag
docker-compose up -d

# Verify old version is running
curl http://localhost:5000/health
```

---

**Production deployment complete!** 🚀

For additional support, check logs in `logs/` directory and review error messages carefully.
