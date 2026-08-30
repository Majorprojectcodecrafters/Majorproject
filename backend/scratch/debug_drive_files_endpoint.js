const prisma = require('../src/config/prisma');
const studentLibraryController = require('../src/controllers/studentLibrary.controller');

async function debugEndpoint() {
  console.log('🔍 Debugging GET /api/student-library/drive-files...');
  const req = {
    query: {
      stream: '12th Science',
      subject: 'Physics',
      category: 'Notes'
    },
    user: { id: 'test-user-id', role: 'STUDENT' }
  };

  const res = {
    json: (data) => console.log('✅ Success Response:', JSON.stringify(data, null, 2)),
    status: (code) => {
      console.log('❌ HTTP Status Code:', code);
      return {
        json: (data) => console.log('❌ Error Response Body:', JSON.stringify(data, null, 2))
      };
    }
  };

  try {
    await studentLibraryController.getDriveFilesForCategory(req, res);
  } catch (err) {
    console.error('💥 Controller Exception Thrown:', err);
  } finally {
    await prisma.$disconnect();
  }
}

debugEndpoint();
