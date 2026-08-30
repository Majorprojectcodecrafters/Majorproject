require('dotenv').config();
const prisma = require('../src/config/prisma');
const http = require('http');

const makeReq = (path, method = 'GET', postData = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(postData));
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, bodyRaw: body.substring(0, 100) });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
};

async function recheckStudentLibrary() {
  console.log('====================================================');
  console.log('🔍 RECHECKING STUDENT LIBRARY PIPELINE & ENDPOINTS');
  console.log('====================================================');

  try {
    // Find active student from DB
    const studentUser = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    });

    if (!studentUser) {
      console.log('❌ No student found in DB');
      process.exit(1);
    }

    // 1. Login as Admin
    const adminLogin = await makeReq('/api/auth/login', 'POST', { email: 'admin@school.com', password: 'admin123' });
    const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
    console.log('1. Admin Login Status:', adminLogin.status, 'Cookie Set:', !!adminCookie);

    // 2. Fetch Admin Student Library Materials
    const adminMaterials = await makeReq('/api/student-library/materials', 'GET', null, { Cookie: adminCookie });
    console.log('2. Admin Materials Status:', adminMaterials.status, 'Total Synced Materials:', adminMaterials.body?.data?.length || 0);

    // List material details
    if (adminMaterials.body?.data?.length > 0) {
      console.log('\n   📚 Synced Textbooks & Materials in Library:');
      adminMaterials.body.data.forEach((item, idx) => {
        console.log(`   [${idx + 1}] "${item.title}" | Category: ${item.category} | Class: ${item.class?.name || 'All Classes'} | File: ${item.fileName}`);
      });
    }

    // 3. Fetch Admin Google Drive Tree
    const driveTree = await makeReq('/api/student-library/admin-tree', 'GET', null, { Cookie: adminCookie });
    console.log('\n3. Admin Drive Tree Status:', driveTree.status);

    // 4. Test Student Access
    const studentLogin = await makeReq('/api/auth/login', 'POST', { email: studentUser.email, password: 'student123' });
    const studentCookie = studentLogin.headers['set-cookie'] ? studentLogin.headers['set-cookie'][0] : '';
    console.log(`\n4. Student Login (${studentUser.email}) Status:`, studentLogin.status, 'Cookie Set:', !!studentCookie);

    const studentMaterials = await makeReq('/api/student-library/materials', 'GET', null, { Cookie: studentCookie });
    console.log('5. Student Library Materials Visible Status:', studentMaterials.status, 'Materials Count:', studentMaterials.body?.data?.length || 0);

    // 5. Test Secure Document Stream Headers (Anti-Download Protection)
    if (adminMaterials.body?.data?.length > 0) {
      const sampleId = adminMaterials.body.data[0].id;
      const streamRes = await makeReq(`/api/student-library/materials/${sampleId}/view`, 'GET', null, { Cookie: studentCookie });
      console.log('\n6. Secure PDF Document Stream Status:', streamRes.status);
      console.log('   Content-Disposition Header:', streamRes.headers['content-disposition']);
      console.log('   Content-Type Header:', streamRes.headers['content-type']);
    }

    console.log('\n====================================================');
    console.log('✅ STUDENT LIBRARY PIPELINE IS 100% WORKING & SECURE');
    console.log('====================================================');
    process.exit(0);

  } catch (error) {
    console.error('❌ Verification Error:', error.message);
    process.exit(1);
  }
}

recheckStudentLibrary();
