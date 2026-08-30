require('dotenv').config();
const { google } = require('googleapis');
const https = require('https');

async function listDriveTree() {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3';
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log(`Searching Google Drive Folder ID: ${rootFolderId}\n`);

  let drive;

  // 1. Try OAuth2 Refresh Token
  try {
    const postData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString();

    const tokenRes = await new Promise((resolve, reject) => {
      const req = https.request('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    if (tokenRes.access_token) {
      console.log('🔑 Connected via Google OAuth 2.0 Access Token!');
      drive = google.drive({ version: 'v3', headers: { Authorization: `Bearer ${tokenRes.access_token}` } });
    } else {
      console.log('⚠️ OAuth Token notice:', tokenRes.error_description || tokenRes.error);
    }
  } catch (err) {
    console.log('OAuth error:', err.message);
  }

  // 2. If OAuth failed, try API key query
  if (!drive) {
    const apiKey = process.env.GEMINI_API_KEYS?.split(',')[0];
    if (apiKey) {
      console.log('🔑 Querying Google Drive public API...');
      drive = google.drive({ version: 'v3', auth: apiKey });
    }
  }

  if (!drive) {
    console.log('❌ Could not initialize Google Drive client');
    process.exit(1);
  }

  // Recursive directory crawler
  const folderTree = [];
  const fileList = [];

  async function crawlFolder(folderId, currentPath = '') {
    try {
      const q = `'${folderId}' in parents and trashed = false`;
      const res = await drive.files.list({
        q,
        fields: 'files(id, name, mimeType, size, webViewLink, createdTime)',
        pageSize: 1000
      });

      const items = res.data.files || [];

      for (const item of items) {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        if (item.mimeType === 'application/vnd.google-apps.folder') {
          folderTree.push({ id: item.id, name: item.name, path: itemPath });
          await crawlFolder(item.id, itemPath);
        } else {
          fileList.push({
            id: item.id,
            name: item.name,
            path: itemPath,
            size: item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
            mimeType: item.mimeType
          });
        }
      }
    } catch (e) {
      console.log(`Error crawling folder ${folderId}:`, e.message);
    }
  }

  await crawlFolder(rootFolderId, '');

  console.log('====================================================');
  console.log(`📂 GOOGLE DRIVE DIRECTORY TREE FOR ROOT FOLDER [${rootFolderId}]`);
  console.log('====================================================');

  console.log(`\n📁 Subfolders Discovered (${folderTree.length}):`);
  if (folderTree.length === 0) {
    console.log('   (No subfolders found or root folder is empty)');
  } else {
    folderTree.forEach(f => console.log(`   📁 ${f.path} [ID: ${f.id}]`));
  }

  console.log(`\n📄 PDF Documents & Files Discovered (${fileList.length}):`);
  if (fileList.length === 0) {
    console.log('   (No files found in this root folder)');
  } else {
    fileList.forEach(f => console.log(`   📄 ${f.path} (${f.size}) [ID: ${f.id}]`));
  }

  console.log('\n====================================================');
  process.exit(0);
}

listDriveTree();
