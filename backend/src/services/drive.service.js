const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Google Drive Storage Service
 * Handles folder structure creation, document upload, private stream downloads,
 * and synchronized deletion for QPGen business account storage.
 */

function isDriveConfigured() {
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const hasServiceAccount = saEmail && saKey;
  const hasOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN;
  return Boolean(hasServiceAccount || hasOAuth);
}

function getDriveClient() {
  if (!isDriveConfigured()) {
    return null;
  }

  try {
    const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
    const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_DRIVE_PRIVATE_KEY;

    if (saEmail && saKey) {
      const privateKey = saKey.replace(/\\n/g, '\n');
      const auth = new google.auth.JWT(
        saEmail,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/drive']
      );
      return google.drive({ version: 'v3', auth });
    }

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      return google.drive({ version: 'v3', auth: oAuth2Client });
    }
  } catch (error) {
    console.error('❌ Failed to initialize Google Drive client:', error.message);
    return null;
  }
}

/**
 * Get or create folder under parent folder
 */
async function getOrCreateFolder(drive, folderName, parentId = null) {
  if (!drive) return null;

  try {
    const parentQuery = parentId ? `'${parentId}' in parents and` : '';
    const query = `${parentQuery} name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name)'
    });

    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    // Create new folder
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {})
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    return folder.data.id;
  } catch (error) {
    console.error(`⚠️ Failed to resolve folder "${folderName}" on Google Drive:`, error.message);
    return parentId;
  }
}

/**
 * Ensure folder structure: QPGen / Board / Stream / Class / Subject / Category
 */
async function ensureFolderStructure({ board = 'MSB', stream = 'Science', className = '12th', subjectName = 'Physics', category = 'Textbooks' }) {
  const drive = getDriveClient();
  if (!drive) return null;

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
  const qpgenFolder = await getOrCreateFolder(drive, 'QPGen', rootId);
  const boardFolder = await getOrCreateFolder(drive, board || 'MSB', qpgenFolder);
  const streamFolder = await getOrCreateFolder(drive, stream || 'General', boardFolder);
  const classFolder = await getOrCreateFolder(drive, className || '12th', streamFolder);
  const subjectFolder = await getOrCreateFolder(drive, subjectName || 'Subject', classFolder);
  const categoryFolder = await getOrCreateFolder(drive, category || 'Documents', subjectFolder);

  return categoryFolder;
}

/**
 * Upload file to Google Drive from local path
 */
async function uploadFileToDrive(filePath, fileName, mimeType = 'application/pdf', folderId = null) {
  const drive = getDriveClient();

  if (!drive) {
    console.log(`ℹ️ Google Drive API credentials not configured. Staging file locally.`);
    return {
      driveFileId: `local-sim-${Date.now()}`,
      driveFolderId: null,
      webViewLink: null
    };
  }

  try {
    const parentFolder = folderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
    const fileMetadata = {
      name: fileName,
      ...(parentFolder ? { parents: [parentFolder] } : {})
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink'
    });

    return {
      driveFileId: response.data.id,
      driveFolderId: parentFolder,
      webViewLink: response.data.webViewLink
    };
  } catch (error) {
    console.error('❌ Failed to upload file to Google Drive:', error.message);
    throw error;
  }
}

/**
 * Download file stream from Google Drive to local destination path for chunking/processing
 */
async function downloadFileFromDrive(driveFileId, destinationPath) {
  const drive = getDriveClient();
  if (!drive || driveFileId.startsWith('local-sim-')) {
    return false;
  }

  try {
    const destStream = fs.createWriteStream(destinationPath);
    const res = await drive.files.get(
      { fileId: driveFileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      res.data
        .on('end', () => resolve(true))
        .on('error', err => reject(err))
        .pipe(destStream);
    });
  } catch (error) {
    console.error(`❌ Failed to download file (${driveFileId}) from Google Drive:`, error.message);
    throw error;
  }
}

/**
 * Get readable stream for private file access
 */
async function getFileStreamFromDrive(driveFileId) {
  const drive = getDriveClient();
  if (!drive || driveFileId.startsWith('local-sim-')) {
    return null;
  }

  const res = await drive.files.get(
    { fileId: driveFileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return res.data;
}

/**
 * Delete file from Google Drive for synchronized cleanup
 */
async function deleteFileFromDrive(driveFileId) {
  if (!driveFileId || driveFileId.startsWith('local-sim-')) return true;
  const drive = getDriveClient();
  if (!drive) return false;

  try {
    await drive.files.delete({ fileId: driveFileId });
    console.log(`✅ Deleted file (${driveFileId}) from Google Drive.`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Failed to delete file (${driveFileId}) from Google Drive:`, error.message);
    return false;
  }
}

/**
 * List files and subfolders from connected Google Drive folder for automatic sync
 */
async function listDriveFilesAndFolders(parentFolderId = null) {
  const drive = getDriveClient();
  if (!drive) return [];

  const folderId = parentFolderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!folderId) return [];

  try {
    const query = `'${folderId}' in parents and trashed=false`;
    const res = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, size, createdTime)',
      pageSize: 100
    });

    return res.data.files || [];
  } catch (error) {
    console.error('❌ Failed to list Google Drive files:', error.message);
    return [];
  }
}

/**
 * Recursively list all files and subfolders in Google Drive folder tree
 */
async function listAllDriveFilesRecursive(folderId = null) {
  const drive = getDriveClient();
  if (!drive) return { files: [], folderTree: [] };

  const rootId = folderId || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) return { files: [], folderTree: [] };

  const allFiles = [];
  const folderTree = [];

  async function crawlFolder(currentFolderId, folderPath = '') {
    try {
      const query = `'${currentFolderId}' in parents and trashed=false`;
      const res = await drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, webViewLink, size, createdTime, parents)',
        pageSize: 100
      });

      const items = res.data.files || [];

      for (const item of items) {
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          const currentPath = folderPath ? `${folderPath} / ${item.name}` : item.name;
          folderTree.push({
            id: item.id,
            name: item.name,
            path: currentPath,
            parentId: currentFolderId
          });
          await crawlFolder(item.id, currentPath);
        } else {
          allFiles.push({
            ...item,
            folderPath: folderPath || 'Root Folder'
          });
        }
      }
    } catch (err) {
      console.warn(`⚠️ Failed to crawl Drive folder (${currentFolderId}):`, err.message);
    }
  }

  await crawlFolder(rootId, '');
  return { files: allFiles, folderTree };
}

module.exports = {
  isDriveConfigured,
  ensureFolderStructure,
  uploadFileToDrive,
  downloadFileFromDrive,
  getFileStreamFromDrive,
  deleteFileFromDrive,
  listDriveFilesAndFolders,
  listAllDriveFilesRecursive
};
