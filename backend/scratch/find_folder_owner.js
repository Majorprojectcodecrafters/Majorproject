require('dotenv').config();
const { google } = require('googleapis');
const https = require('https');

async function findFolderOwner() {
  const folderId = '16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw';
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log(`Checking folder ID: ${folderId}`);
  console.log(`OAuth Client ID:   ${clientId}`);

  // 1. Get access token from refresh token using OAuth2 token endpoint
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

  if (!tokenRes.access_token) {
    console.log('❌ Token Error:', tokenRes);
    process.exit(1);
  }

  const accessToken = tokenRes.access_token;
  console.log('🔑 Access token obtained successfully!');

  // 2. Query Google UserInfo / TokenInfo to find logged in Gmail account
  const userInfoRes = await new Promise((resolve, reject) => {
    https.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });

  console.log('\n👤 OAuth User Account Details:', userInfoRes);

  // 3. Query Google Drive API for folder fields (owners, sharingUser)
  const drive = google.drive({ version: 'v3', headers: { Authorization: `Bearer ${accessToken}` } });

  try {
    const folderMetadata = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, owners, sharingUser, permissions'
    });

    console.log('\n📁 Folder Metadata Details:', JSON.stringify(folderMetadata.data, null, 2));

    if (folderMetadata.data.owners && folderMetadata.data.owners.length > 0) {
      console.log(`\n👑 Folder Owner Email: ${folderMetadata.data.owners[0].emailAddress}`);
    }
  } catch (err) {
    console.log('Folder Metadata Fetch Error:', err.message);
  }

  process.exit(0);
}

findFolderOwner();
