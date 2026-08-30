require('dotenv').config();
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

async function checkFolder() {
  const currentLinkedId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID; // 16_gh9hL3CHaHQ59KU7N2ejhIdKQ0rhJw
  const userProvidedId = '1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3';

  console.log(`Current Linked Root Folder ID in WebApp: ${currentLinkedId}`);
  console.log(`User Shared Folder ID:                  ${userProvidedId}`);

  try {
    const res1 = await drive.files.get({ fileId: currentLinkedId, fields: 'id, name' });
    console.log(`\n📁 Current WebApp Folder Name: "${res1.data.name}" (${res1.data.id})`);
  } catch (e) {
    console.log(`Current WebApp Folder Error: ${e.message}`);
  }

  try {
    const res2 = await drive.files.get({ fileId: userProvidedId, fields: 'id, name' });
    console.log(`📁 User Shared Folder Name:   "${res2.data.name}" (${res2.data.id})`);
  } catch (e) {
    console.log(`User Shared Folder Error: ${e.message}`);
  }

  process.exit(0);
}

checkFolder();
