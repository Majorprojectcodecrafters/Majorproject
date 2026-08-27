const fs = require('fs');
const path = require('path');

/**
 * Upload an Announcement file (Image / PDF) to Google Drive if credentials exist in env,
 * or fallback to local disk storage in /uploads directory.
 */
async function uploadAttachmentFile(file) {
  if (!file) return null;

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Try Google Drive API if Service Account / OAuth credentials present
  const googleDriveClientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const googleDrivePrivateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (googleDriveClientEmail && googleDrivePrivateKey) {
    try {
      const { google } = require('googleapis');
      const auth = new google.auth.JWT(
        googleDriveClientEmail,
        null,
        googleDrivePrivateKey.replace(/\\n/g, '\n'),
        ['https://www.googleapis.com/auth/drive.file']
      );

      const drive = google.drive({ version: 'v3', auth });

      const fileMetadata = {
        name: file.originalname,
        ...(googleDriveFolderId && { parents: [googleDriveFolderId] })
      };

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path)
      };

      const driveRes = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      });

      // Set public read permission
      await drive.permissions.create({
        fileId: driveRes.data.id,
        requestBody: { role: 'reader', type: 'anyone' }
      });

      return {
        url: driveRes.data.webViewLink || `https://drive.google.com/file/d/${driveRes.data.id}/view`,
        driveFileId: driveRes.data.id,
        storage: 'GOOGLE_DRIVE'
      };
    } catch (e) {
      console.warn('⚠️ Google Drive API upload fallback to local:', e.message);
    }
  }

  // 2. Local File Storage Fallback
  const fileExt = path.extname(file.originalname) || '';
  const safeFilename = `announcement_${Date.now()}_${Math.floor(Math.random() * 10000)}${fileExt}`;
  const targetPath = path.join(uploadsDir, safeFilename);

  fs.copyFileSync(file.path, targetPath);

  return {
    url: `/uploads/${safeFilename}`,
    driveFileId: null,
    storage: 'LOCAL'
  };
}

module.exports = { uploadAttachmentFile };
