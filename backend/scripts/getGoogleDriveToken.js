const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function main() {
  console.log('\n==================================================');
  console.log('   🔑 QPGen Google Drive OAuth Automated Setup    ');
  console.log('==================================================\n');

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('👉 Step 1: Open the following URL in your browser:\n');
  console.log(`\x1b[36m%s\x1b[0m`, authUrl);
  console.log('\n--------------------------------------------------');
  console.log('⏳ Listening for authorization on http://localhost:3000/oauth2callback ...\n');

  // Try to open browser automatically
  try {
    const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${start} "${authUrl}"`);
  } catch (e) {}

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith('/oauth2callback')) {
        const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
        const code = qs.get('code');

        res.end('<h1>✅ Google Drive Authorization Successful!</h1><p>You can close this tab now and return to your terminal.</p>');
        server.close();

        if (code) {
          console.log('🔄 Exchanging authorization code for fresh Refresh Token...');
          const { tokens } = await oAuth2Client.getToken(code);

          if (tokens.refresh_token) {
            console.log('\n==================================================');
            console.log('🎉 SUCCESS! Fresh Refresh Token Received:');
            console.log(`\x1b[32m%s\x1b[0m`, tokens.refresh_token);
            console.log('==================================================\n');

            // Update .env file automatically
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
            console.log('💾 Updated backend/.env automatically!');

            // Verify Google Drive connection
            oAuth2Client.setCredentials(tokens);
            const drive = google.drive({ version: 'v3', auth: oAuth2Client });
            const driveRes = await drive.files.list({ pageSize: 5 });

            console.log('🚀 Verified Google Drive Connection! Files found:', driveRes.data.files.length);
          } else {
            console.log('⚠️ Token received without refresh_token. Make sure prompt="consent" is active.');
          }
        }
      }
    } catch (err) {
      console.error('❌ Error during OAuth token exchange:', err.message);
      res.end(`<h1>Error: ${err.message}</h1>`);
    }
  }).listen(3000);
}

main();
