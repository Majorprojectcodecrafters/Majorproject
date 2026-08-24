const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { isDriveConfigured, ensureFolderStructure, uploadFileToDrive, deleteFileFromDrive } = require('../src/services/drive.service');
const fs = require('fs');
const os = require('os');

async function testLiveDrive() {
  console.log('🔄 Testing Live Google Drive OAuth 2.0 Integration...\n');

  if (!isDriveConfigured()) {
    console.error('❌ Google Drive credentials missing in backend/.env!');
    console.error('Please ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and GOOGLE_DRIVE_ROOT_FOLDER_ID are set.');
    process.exit(1);
  }

  const tempTestFile = path.join(os.tmpdir(), `qpgen_live_test_${Date.now()}.txt`);
  fs.writeFileSync(tempTestFile, 'QPGen Live Google Drive Integration Test File');

  try {
    // 1. Resolve / Create Folder on Google Drive
    console.log('1️⃣ Resolving Google Drive Folder Structure...');
    const folderId = await ensureFolderStructure({
      board: 'MSB',
      stream: 'Science',
      className: '12th',
      subjectName: 'Physics',
      category: 'Textbooks'
    });
    console.log(`  ✅ Folder Resolved on Drive. ID: ${folderId}`);

    // 2. Upload Test File to Google Drive
    console.log('\n2️⃣ Uploading Test File to Google Drive...');
    const uploadRes = await uploadFileToDrive(
      tempTestFile,
      `QPGen_Live_Test_${Date.now()}.txt`,
      'text/plain',
      folderId
    );
    console.log(`  ✅ Upload Successful! Drive File ID: ${uploadRes.driveFileId}`);

    // 3. Clean up Test File from Google Drive
    console.log('\n3️⃣ Cleaning Up Test File from Google Drive...');
    await deleteFileFromDrive(uploadRes.driveFileId);
    console.log('  ✅ Test File Purged from Google Drive');

    console.log('\n==================================================');
    console.log('🎉 GOOGLE DRIVE OAUTH INTEGRATION IS FULLY LIVE!');
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Live Google Drive Test Failed:', error.message);
    process.exit(1);
  } finally {
    if (fs.existsSync(tempTestFile)) {
      try { fs.unlinkSync(tempTestFile); } catch (e) {}
    }
  }
}

testLiveDrive();
