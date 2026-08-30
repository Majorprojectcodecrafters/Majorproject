require('dotenv').config();
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
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
};

async function syncAndVerify() {
  console.log('====================================================');
  console.log('🔄 SYNCING GOOGLE DRIVE HIERARCHY AS ADMIN');
  console.log('====================================================');

  try {
    // 1. Login as Admin
    const adminLogin = await makeReq('/api/auth/login', 'POST', { email: 'admin@school.com', password: 'admin123' });
    const adminCookie = adminLogin.headers['set-cookie'] ? adminLogin.headers['set-cookie'][0] : '';
    console.log('1. Admin Login Status:', adminLogin.status);

    // 2. Trigger Google Drive Sync
    console.log('2. Triggering POST /api/student-library/sync ...');
    const syncRes = await makeReq('/api/student-library/sync', 'POST', {}, { Cookie: adminCookie });
    console.log('   Sync Status:', syncRes.status);
    console.log('   Sync Message:', syncRes.body.message);

    // 3. Fetch Synced Study Materials
    const materialsRes = await makeReq('/api/student-library/materials', 'GET', null, { Cookie: adminCookie });
    console.log('\n3. Total Synced Study Materials in System:', materialsRes.body?.data?.length || 0);

    if (materialsRes.body?.data?.length > 0) {
      console.log('\n   📋 Synced Materials Breakdown by Folder & Class:');
      materialsRes.body.data.forEach((item, idx) => {
        console.log(`   [${idx + 1}] "${item.title}"`);
        console.log(`       Category: ${item.category} | Class: ${item.class?.name || 'All'} | Subject: ${item.subject?.name || 'General'}`);
        console.log(`       Folder: ${item.description}`);
      });
    }

    console.log('\n====================================================');
    console.log('✅ HIERARCHY SYNC VERIFICATION COMPLETE!');
    console.log('====================================================');
    process.exit(0);

  } catch (error) {
    console.error('❌ Sync Verification Error:', error.message);
    process.exit(1);
  }
}

syncAndVerify();
