require('dotenv').config();
const prisma = require('../src/config/prisma');
const http = require('http');

async function testTeacherLogin() {
  try {
    // 1. Find teacher user from database
    const teacherUser = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });

    if (!teacherUser) {
      console.log('❌ No teacher user found in database');
      process.exit(1);
    }

    console.log(`🔍 Found Teacher in DB: Email: ${teacherUser.email}, Name: ${teacherUser.name}`);

    // Try logging in with standard teacher password 'teacher123'
    const postData = JSON.stringify({
      email: teacherUser.email,
      password: 'teacher123'
    });

    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n🔑 Login Status Code: ${res.statusCode}`);
        console.log('Cookie Header Set:', res.headers['set-cookie'] ? 'YES (HttpOnly Cookie Set!)' : 'NO');
        console.log('Login Response:', body);
        process.exit(0);
      });
    });

    req.on('error', err => {
      console.error('❌ HTTP Request Error:', err.message);
      process.exit(1);
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.error('❌ Script Error:', error.message);
    process.exit(1);
  }
}

testTeacherLogin();
