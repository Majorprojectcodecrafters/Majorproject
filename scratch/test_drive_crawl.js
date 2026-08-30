require('dotenv').config();
const { listAllDriveFilesRecursive, getDriveClient } = require('../backend/src/services/drive.service');

async function run() {
  console.log('Testing Google Drive Crawler...');
  console.log('ROOT FOLDER:', process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
  
  const drive = getDriveClient();
  console.log('Drive Client Configured:', Boolean(drive));

  if (drive) {
    try {
      const files = await listAllDriveFilesRecursive(process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);
      console.log(`Found ${files.length} files in Google Drive:`);
      files.forEach((f, idx) => {
        console.log(`[${idx + 1}] ID: ${f.id} | Name: ${f.name} | Path: ${f.folderPath} | Link: ${f.webViewLink}`);
      });
    } catch (err) {
      console.error('Error crawling drive:', err.message);
    }
  } else {
    console.log('Google Drive API credentials not provided in .env');
  }
}

run();
