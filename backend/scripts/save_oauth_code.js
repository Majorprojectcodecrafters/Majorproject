const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

async function exchangeCode(code, redirectUri = 'http://localhost:3000/oauth2callback') {
  console.log(`Exchanging code using redirect URI: ${redirectUri}`);
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, redirectUri);

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    if (tokens.refresh_token) {
      console.log('✅ Fresh Refresh Token Received:', tokens.refresh_token);
      const envPath = path.join(__dirname, '../.env');
      let envContent = fs.readFileSync(envPath, 'utf8');

      if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
        envContent = envContent.replace(
          /GOOGLE_REFRESH_TOKEN=.*/g,
          `GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`
        );
      } else {
        envContent += `\nGOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"\n`;
      }

      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('💾 Updated backend/.env successfully!');

      // Verify connection
      oAuth2Client.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth: oAuth2Client });
      const driveRes = await drive.files.list({ pageSize: 5 });
      console.log('🚀 Google Drive Connection Verified! Files found:', driveRes.data.files.length);
    } else {
      console.log('⚠️ Tokens received but no refresh_token included. Response:', tokens);
    }
  } catch (err) {
    console.error('❌ Code exchange failed:', err.message);
  }
}

const input = process.argv[2];
if (input) {
  let code = input;
  let redirectUri = 'http://localhost:3000/oauth2callback';
  if (input.includes('code=')) {
    const match = input.match(/code=([^&]+)/);
    if (match) code = decodeURIComponent(match[1]);
  }
  if (process.argv[3]) redirectUri = process.argv[3];
  exchangeCode(code, redirectUri);
} else {
  console.log('Usage: node scripts/save_oauth_code.js <AUTH_CODE_OR_REDIRECT_URL>');
}
