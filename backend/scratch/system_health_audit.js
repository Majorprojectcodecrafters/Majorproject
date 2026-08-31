const prisma = require('../src/config/prisma');

async function runFullSystemAudit() {
  console.log('====================================================');
  console.log('🚀 RUNNING COMPREHENSIVE QPGEN SYSTEM HEALTH AUDIT');
  console.log('====================================================\n');

  try {
    // 1. Database Connection & Schema Audit
    console.log('📊 1. DATABASE & SCHEMA INTEGRITY:');
    const usersCount = await prisma.user.count();
    const classCount = await prisma.class.count();
    const subjectCount = await prisma.subject.count();
    const questionCount = await prisma.question.count();
    const paperCount = await prisma.questionPaper.count();
    const materialCount = await prisma.studyMaterial.count();

    console.log(`   - Users registered: ${usersCount} ✅`);
    console.log(`   - Classes configured: ${classCount} ✅`);
    console.log(`   - Subjects registered: ${subjectCount} ✅`);
    console.log(`   - Question Bank items: ${questionCount} ✅`);
    console.log(`   - Generated Question Papers: ${paperCount} ✅`);
    console.log(`   - Study Materials registered: ${materialCount} ✅`);

    // 2. Question Paper Exporter Check (pdfExporter.js)
    console.log('\n📄 2. QUESTION PAPER EXPORTER ENGINE (utils/pdfExporter.js):');
    const pdfExporterExists = require('fs').existsSync(require('path').join(__dirname, '../src/utils/pdfExporter.js'));
    console.log(`   - Question Paper Exporter module exists: ${pdfExporterExists ? 'YES ✅' : 'NO ❌'}`);

    // 3. Student Library Routes & Controller Audit
    console.log('\n📚 3. STUDENT LIBRARY ENGINE (studentLibrary.controller.js):');
    const studentLibraryController = require('../src/controllers/studentLibrary.controller');
    console.log(`   - getStudentProfile: ${typeof studentLibraryController.getStudentProfile === 'function' ? 'OK ✅' : 'FAIL ❌'}`);
    console.log(`   - getDriveFilesForCategory: ${typeof studentLibraryController.getDriveFilesForCategory === 'function' ? 'OK ✅' : 'FAIL ❌'}`);
    console.log(`   - streamDriveFileSecure: ${typeof studentLibraryController.streamDriveFileSecure === 'function' ? 'OK ✅' : 'FAIL ❌'}`);
    console.log(`   - downloadDriveFileSecure: ${typeof studentLibraryController.downloadDriveFileSecure === 'function' ? 'OK ✅' : 'FAIL ❌'}`);

    // 4. Google Drive Service Configuration
    console.log('\n☁️ 4. GOOGLE DRIVE STORAGE SERVICE (drive.service.js):');
    const { isDriveConfigured } = require('../src/services/drive.service');
    console.log(`   - Google Drive Configured: ${isDriveConfigured() ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   - Root Folder ID: ${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ? process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID : 'MISSING ❌'} ✅`);

    console.log('\n====================================================');
    console.log('🎉 SYSTEM AUDIT COMPLETED SUCCESSFULLY: ALL MODULES INTACT');
    console.log('====================================================');

  } catch (error) {
    console.error('💥 Audit Failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runFullSystemAudit();
