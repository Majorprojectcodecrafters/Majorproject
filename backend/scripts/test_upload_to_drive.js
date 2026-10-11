require('dotenv').config();
const { uploadFileToDrive, ensureFolderStructure } = require('../src/services/drive.service');
const fs = require('fs');
const path = require('path');

async function testUpload() {
  const dummyFile = path.join(__dirname, 'test_dummy.txt');
  fs.writeFileSync(dummyFile, 'Hello Google Drive! Testing integration with QPGen.');

  console.log('Resolving folder structure...');
  const folderId = await ensureFolderStructure({
    board: 'MSB',
    stream: 'Science',
    className: '12th Science',
    subjectName: 'Physics',
    category: 'TEXTBOOK'
  });
  console.log('Resolved Target Folder ID:', folderId);

  console.log('Uploading test_dummy.txt to Google Drive...');
  const res = await uploadFileToDrive(dummyFile, 'test_dummy.txt', 'text/plain', folderId);
  console.log('Upload Result:', res);

  try { fs.unlinkSync(dummyFile); } catch (e) {}
}

testUpload().catch(console.error);
