require('dotenv').config();
const { listAllDriveFilesRecursive, isDriveConfigured } = require('../src/services/drive.service');

async function run() {
  console.log('Testing Google Drive Crawler...');
  console.log('ROOT FOLDER:', process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  console.log('Drive Configured:', isDriveConfigured());

  try {
    const result = await listAllDriveFilesRecursive(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
    console.log(`Found ${result.files?.length || 0} files and ${result.folderTree?.length || 0} subfolders in Google Drive:`);
    (result.files || []).forEach((f, idx) => {
      console.log(`[${idx + 1}] ID: ${f.id} | Name: ${f.name} | Path: ${f.folderPath} | Link: ${f.webViewLink}`);
    });
  } catch (err) {
    console.error('Error crawling drive:', err.message);
  }
}

run();
