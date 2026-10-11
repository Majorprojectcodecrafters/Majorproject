require('dotenv').config();
const { getDriveClient } = require('../src/services/drive.service');

async function getOrCreateFolder(drive, folderName, parentId = null) {
  if (!drive) return null;
  try {
    const parentQuery = parentId ? `'${parentId}' in parents and` : '';
    const query = `${parentQuery} name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    if (res.data.files && res.data.files.length > 0) {
      console.log(`Found existing folder "${folderName}":`, res.data.files[0].id);
      return res.data.files[0].id;
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {})
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
      supportsAllDrives: true
    });
    console.log(`Created new folder "${folderName}":`, folder.data.id);
    return folder.data.id;
  } catch (error) {
    console.error(`⚠️ Failed to resolve folder "${folderName}" on Google Drive:`, error.message);
    return parentId;
  }
}

async function testHierarchy() {
  process.env.GOOGLE_DRIVE_ROOT_FOLDER = "1wxE6JxA2_6qXxo0tAforJrH-ZA13IVL8";
  const { isDriveConfigured } = require('../src/services/drive.service');
  console.log("Drive configured:", isDriveConfigured());

  // We can test creating: 12th Standard -> Science -> Textbooks
  const { ensureFolderStructure } = require('../src/services/drive.service');
  const targetFolder = await ensureFolderStructure({
    board: 'MSB',
    stream: 'Science',
    className: '12th Science',
    subjectName: 'Physics',
    category: 'TEXTBOOK'
  });
  console.log("Target folder ID:", targetFolder);
}

testHierarchy();
