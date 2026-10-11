require('dotenv').config();
const prisma = require('../src/config/prisma');
const fs = require('fs');
const path = require('path');
const { ensureFolderStructure, uploadFileToDrive } = require('../src/services/drive.service');

async function syncFilesToDrive() {
  console.log('--- SYNCING LOCAL FILES TO GOOGLE DRIVE ---');

  // 1. Fetch StudyMaterial records with local-sim IDs
  const materials = await prisma.studyMaterial.findMany({
    include: { class: true, subject: true }
  });

  console.log(`Checking ${materials.length} StudyMaterial record(s)...`);

  for (const mat of materials) {
    if (!mat.driveFileId || mat.driveFileId.startsWith('local-sim-')) {
      let localPath = mat.fileUrl;
      if (!localPath || !fs.existsSync(localPath)) {
        if (mat.fileName) {
          const p = path.join(__dirname, '../uploads/student_library', mat.fileName);
          if (fs.existsSync(p)) localPath = p;
        }
      }

      if (localPath && fs.existsSync(localPath)) {
        console.log(`Uploading StudyMaterial "${mat.title}" (${localPath}) to Google Drive...`);
        const targetFolderId = await ensureFolderStructure({
          board: 'MSB',
          stream: mat.subject?.stream?.name || 'Science',
          className: mat.class?.name || '12th Standard',
          subjectName: mat.subject?.name || 'Physics',
          category: mat.category
        });

        const uploadRes = await uploadFileToDrive(
          localPath,
          mat.fileName || mat.title,
          mat.mimeType || 'application/pdf',
          targetFolderId
        );

        if (uploadRes?.driveFileId && !uploadRes.driveFileId.startsWith('local-sim-')) {
          console.log(`✅ Uploaded to Drive! ID: ${uploadRes.driveFileId}`);
          await prisma.studyMaterial.update({
            where: { id: mat.id },
            data: {
              driveFileId: uploadRes.driveFileId,
              driveFolderId: uploadRes.driveFolderId || targetFolderId
            }
          });
        }
      }
    }
  }

  // 2. Fetch KnowledgeSource records with local-sim IDs
  const sources = await prisma.knowledgeSource.findMany({
    include: { class: true, subject: true }
  });

  console.log(`Checking ${sources.length} KnowledgeSource record(s)...`);

  for (const src of sources) {
    if (!src.driveFileId || src.driveFileId.startsWith('local-sim-')) {
      let localPath = src.filePath;
      if (!localPath || !fs.existsSync(localPath)) {
        if (src.fileName) {
          const p = path.join(__dirname, '../uploads/student_library', src.fileName);
          if (fs.existsSync(p)) localPath = p;
        }
      }

      if (localPath && fs.existsSync(localPath)) {
        console.log(`Uploading KnowledgeSource "${src.title}" (${localPath}) to Google Drive...`);
        const targetFolderId = await ensureFolderStructure({
          board: 'MSB',
          stream: src.subject?.stream?.name || 'Science',
          className: src.class?.name || '12th Standard',
          subjectName: src.subject?.name || 'Physics',
          category: src.sourceType
        });

        const uploadRes = await uploadFileToDrive(
          localPath,
          src.fileName || src.title,
          src.mimeType || 'application/pdf',
          targetFolderId
        );

        if (uploadRes?.driveFileId && !uploadRes.driveFileId.startsWith('local-sim-')) {
          console.log(`✅ Uploaded KnowledgeSource to Drive! ID: ${uploadRes.driveFileId}`);
          await prisma.knowledgeSource.update({
            where: { id: src.id },
            data: {
              driveFileId: uploadRes.driveFileId,
              driveFolderId: uploadRes.driveFolderId || targetFolderId
            }
          });
        }
      }
    }
  }

  console.log('--- COMPLETED GOOGLE DRIVE SYNC ---');
  await prisma.$disconnect();
}

syncFilesToDrive().catch(err => {
  console.error('Error during Drive sync:', err);
  prisma.$disconnect();
});
