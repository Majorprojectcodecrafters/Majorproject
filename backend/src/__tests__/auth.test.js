const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

describe('Auth API', () => {
  // Clean up after tests
  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123',
          role: 'STUDENT',
          dob: '2000-01-15',
          uniqueId: 'STU001',
          contact: '9876543210',
          classId: '550e8400-e29b-41d4-a716-446655440000',
          streamId: '550e8400-e29b-41d4-a716-446655440001'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('john@example.com');
    });

    it('should reject duplicate emails', async () => {
      const email = 'duplicate@example.com';
      
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User One',
          email,
          password: 'Password123',
          role: 'STUDENT',
          dob: '2000-01-15',
          uniqueId: 'STU002',
          contact: '9876543210',
          classId: '550e8400-e29b-41d4-a716-446655440000',
          streamId: '550e8400-e29b-41d4-a716-446655440001'
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'User Two',
          email,
          password: 'Password123',
          role: 'STUDENT',
          dob: '2000-01-15',
          uniqueId: 'STU003',
          contact: '9876543210',
          classId: '550e8400-e29b-41d4-a716-446655440000',
          streamId: '550e8400-e29b-41d4-a716-446655440001'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john2@example.com',
          password: 'SecurePass123',
          role: 'INVALID_ROLE',
          dob: '2000-01-15',
          uniqueId: 'STU004',
          contact: '9876543210',
          classId: '550e8400-e29b-41d4-a716-446655440000',
          streamId: '550e8400-e29b-41d4-a716-446655440001'
        });

      expect(response.status).toBe(400);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john3@example.com'
          // Missing password, role, dob
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
          role: 'ADMIN',
          dob: new Date('1990-01-01')
        }
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('API Health', () => {
  it('should return API status', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('running');
  });

  it('should return health check status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  it('should return 404 for non-existent route', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });
});
