require('dotenv').config();
const { google } = require('googleapis');

async function checkAuthMethods() {
  console.log('🔍 Testing Google Drive Auth Methods...');
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3';

  // Method 1: OAuth Refresh Token
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('\n🔑 Testing OAuth2 Refresh Token...');
    try {
      const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      const driveOAuth = google.drive({ version: 'v3', auth: oAuth2Client });
      const res = await driveOAuth.files.list({
        q: `'${rootId}' in parents and trashed=false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 10
      });
      console.log('✅ OAuth2 Success! Files found:', res.data.files?.length);
      res.data.files?.forEach(f => console.log(`   - "${f.name}" (ID: ${f.id})`));
    } catch (err) {
      console.error('❌ OAuth2 Error:', err.message);
    }
  }

  // Method 2: Service Account
  const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (saEmail && saKey) {
    console.log('\n🔑 Testing Service Account JWT...');
    try {
      const privateKey = saKey.replace(/\\n/g, '\n');
      const auth = new google.auth.JWT(
        saEmail,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/drive']
      );
      const driveSA = google.drive({ version: 'v3', auth });
      const res = await driveSA.files.list({
        q: `'${rootId}' in parents and trashed=false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 10
      });
      console.log('✅ Service Account Success! Files found:', res.data.files?.length);
      res.data.files?.forEach(f => console.log(`   - "${f.name}" (ID: ${f.id})`));
    } catch (err) {
      console.error('❌ Service Account Error:', err.message);
    }
  }

  // Method 3: API Key (for public/shared drive files)
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_DRIVE_API_KEY;
  if (apiKey) {
    console.log('\n🔑 Testing API Key...');
    try {
      const driveApiKey = google.drive({ version: 'v3', auth: apiKey });
      const res = await driveApiKey.files.list({
        q: `'${rootId}' in parents and trashed=false`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 10
      });
      console.log('✅ API Key Success! Files found:', res.data.files?.length);
      res.data.files?.forEach(f => console.log(`   - "${f.name}" (ID: ${f.id})`));
    } catch (err) {
      console.error('❌ API Key Error:', err.message);
    }
  }
}

checkAuthMethods();
