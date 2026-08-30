const { getDriveFolderFilesByPath } = require('../src/services/drive.service');
const prisma = require('../src/config/prisma');

async function testDriveSync() {
  console.log('🔍 Testing Shared Google Drive Folder File Retrieval...');
  const testPaths = [
    ['12th Science', 'Physics', 'Notes'],
    ['12th Science', 'Physics', 'PYQP'],
    ['12th Science', 'Mathematics', 'Textbook'],
    ['12th Science', 'Chemistry', 'Notes'],
    ['11th Science', 'Physics', 'Textbook']
  ];

  for (const pathParts of testPaths) {
    console.log(`\n📂 Crawling Path: ${pathParts.join(' / ')}`);
    const files = await getDriveFolderFilesByPath(pathParts, true);
    console.log(`   Result Files Found: ${files.length}`);
    files.forEach(f => console.log(`   - "${f.name}" (ID: ${f.id}, Size: ${f.size || 'N/A'})`));
  }

  await prisma.$disconnect();
}

testDriveSync();
