const { listAllDriveFilesRecursive } = require('../src/services/drive.service');
const prisma = require('../src/config/prisma');

async function inspectDrive() {
  console.log('🔍 Inspecting Google Drive Folder Tree for Root ID: 1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3...');
  try {
    const { files, folderTree } = await listAllDriveFilesRecursive();
    console.log(`\n📁 Total Folders Discovered: ${folderTree.length}`);
    console.log('----------------------------------------------------');
    folderTree.forEach(f => {
      console.log(`Folder ID: ${f.id} | Name: "${f.name}" | Path: "${f.path}"`);
    });

    console.log(`\n📄 Total Files Discovered: ${files.length}`);
    console.log('----------------------------------------------------');
    files.forEach(f => {
      console.log(`File ID: ${f.id} | Name: "${f.name}" | Mime: "${f.mimeType}" | Folder Path: "${f.folderPath}"`);
    });

  } catch (error) {
    console.error('❌ Drive Inspection Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDrive();
