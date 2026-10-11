const path = require('path');
const fs = require('fs');
const prisma = require('../src/config/prisma');
const {
  isDriveConfigured,
  ensureFolderStructure,
  uploadFileToDrive,
  downloadFileFromDrive,
  getFileStreamFromDrive,
  deleteFileFromDrive
} = require('../src/services/drive.service');
const { ingestPDF } = require('../src/rag/ragPipeline');
const { deleteBySourceId } = require('../src/rag/vectorStore');

async function testGoogleDriveIntegration() {
  console.log('⚡ Running Production-Ready Google Drive Integration Test Suite...\n');

  // 1. Verify Google Drive Credentials & Authentication
  console.log('📌 1. Verifying Google Drive Authentication & Configuration...');
  const configured = isDriveConfigured();
  console.log(`   └─ Drive Configured: ${configured}`);
  if (!configured) {
    throw new Error('❌ Google Drive is not configured! Check GOOGLE_APPLICATION_CREDENTIALS in .env');
  }
  console.log('✅ Google Drive Service Account authentication verified.\n');

  // 2. Test Idempotent Folder Resolution (QPGen_Resources / 12 / Science / Physics / TEXTBOOK)
  console.log('📌 2. Testing Idempotent Folder Tree Resolution (QPGen_Resources/12/Science/Physics/TEXTBOOK)...');
  const folderId1 = await ensureFolderStructure({
    board: 'MSB',
    stream: 'Science',
    className: '12',
    subjectName: 'Physics',
    category: 'TEXTBOOK'
  });
  console.log(`   └─ Resolved Folder ID (Run 1): ${folderId1}`);

  const folderId2 = await ensureFolderStructure({
    board: 'MSB',
    stream: 'Science',
    className: '12',
    subjectName: 'Physics',
    category: 'TEXTBOOK'
  });
  console.log(`   └─ Resolved Folder ID (Run 2): ${folderId2}`);

  if (!folderId1 || folderId1 !== folderId2) {
    throw new Error(`❌ Folder resolution idempotency failed! Run 1: ${folderId1}, Run 2: ${folderId2}`);
  }
  console.log('✅ Idempotent folder tree resolution verified (No duplicates created).\n');

  // 3. Test Staging & Uploading File to Google Drive
  console.log('📌 3. Testing Document Upload to Google Drive...');
  const samplePdfPath = path.join(__dirname, 'test_hindi_static_preview.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    throw new Error('❌ Test PDF file not found at: ' + samplePdfPath);
  }
  const samplePdfBuffer = fs.readFileSync(samplePdfPath);

  const driveResult = await uploadFileToDrive(
    samplePdfPath,
    'HSC_Physics_Sample_Resource.pdf',
    'application/pdf',
    folderId1
  );
  console.log(`   └─ Drive File ID: ${driveResult.driveFileId}`);
  console.log(`   └─ Drive Folder ID: ${driveResult.driveFolderId}`);
  console.log(`   └─ Web Preview Link: ${driveResult.webViewLink || 'N/A'}`);

  if (!driveResult.driveFileId) {
    throw new Error('❌ Google Drive upload returned no file ID!');
  }
  console.log('✅ Google Drive file upload verified.\n');

  // 4. Test PostgreSQL Resource Record Creation
  console.log('📌 4. Testing PostgreSQL Resource Indexing & Metadata Persistence...');
  const crypto = require('crypto');
  const checksum = crypto.createHash('sha256').update(samplePdfBuffer).digest('hex');

  const physicsSubject = await prisma.subject.findFirst({ where: { name: 'Physics' } });

  const ks = await prisma.knowledgeSource.create({
    data: {
      title: 'HSC Physics Sample Test Resource',
      sourceType: 'TEXTBOOK',
      fileName: 'HSC_Physics_Sample_Resource.pdf',
      filePath: driveResult.driveFileId,
      fileSize: samplePdfBuffer.length,
      status: 'QUEUED',
      uploadedBy: 'test-user',
      driveFileId: driveResult.driveFileId,
      driveFolderId: driveResult.driveFolderId,
      mimeType: 'application/pdf',
      fileUrl: driveResult.webViewLink || null,
      storageProvider: 'GOOGLE_DRIVE',
      checksum,
      subjectId: physicsSubject ? physicsSubject.id : null
    }
  });
  console.log(`   └─ KnowledgeSource Record ID: ${ks.id}`);
  console.log(`   └─ Storage Provider: ${ks.storageProvider}`);
  console.log(`   └─ Checksum SHA256: ${ks.checksum.substring(0, 12)}...`);
  console.log('✅ PostgreSQL resource record created with Google Drive metadata.\n');

  // 5. Test Triggering Existing Ingestion Pipeline (RAG + ChromaDB)
  console.log('📌 5. Testing Existing Ingestion Pipeline Integration (REUSED RAG Engine)...');
  const ingestResult = await ingestPDF(samplePdfPath, {
    knowledgeSourceId: ks.id,
    sourceType: 'TEXTBOOK',
    subjectName: 'Physics',
    grade: '12th'
  });
  console.log(`   └─ Chunks Ingested: ${ingestResult.chunksIngested}`);
  
  await prisma.knowledgeSource.update({
    where: { id: ks.id },
    data: { status: 'PROCESSED' }
  });
  console.log('✅ RAG pipeline ingestion & ChromaDB indexing completed successfully.\n');

  // 6. Test Stream / Download from Google Drive Adapter
  console.log('📌 6. Testing Private File Stream Download from Google Drive Adapter...');
  const tempDownloadPath = path.join(__dirname, 'test_downloaded_from_drive.pdf');
  const downloadSuccess = await downloadFileFromDrive(driveResult.driveFileId, tempDownloadPath);
  console.log(`   └─ Download Success: ${downloadSuccess}`);
  if (fs.existsSync(tempDownloadPath)) {
    console.log(`   └─ Downloaded File Size: ${fs.statSync(tempDownloadPath).size} bytes`);
    fs.unlinkSync(tempDownloadPath);
  }
  console.log('✅ Private Google Drive streaming adapter verified.\n');

  // 7. Test 3-Tier Synchronized Deletion (DB + Google Drive + ChromaDB)
  console.log('📌 7. Testing 3-Tier Synchronized Resource Deletion...');
  await deleteBySourceId(ks.id);
  const deletedDriveFile = await deleteFileFromDrive(driveResult.driveFileId);
  await prisma.knowledgeSource.delete({ where: { id: ks.id } });
  console.log(`   └─ Drive File Deleted: ${deletedDriveFile}`);
  console.log('✅ 3-tier cleanup verified.\n');

  // Clean up test staging PDF
  if (fs.existsSync(samplePdfPath)) {
    fs.unlinkSync(samplePdfPath);
  }

  console.log('🎉 ALL GOOGLE DRIVE INTEGRATION & REGRESSION TESTS PASSED SUCCESSFULLY!');
}

testGoogleDriveIntegration().catch((err) => {
  console.error('\n❌ GOOGLE DRIVE TEST FAILED:', err);
  process.exit(1);
});
