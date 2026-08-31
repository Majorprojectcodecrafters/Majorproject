const { google } = require('googleapis');

async function testApiKey() {
  const rootId = '1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3';
  console.log(`🔍 Testing unauthenticated public Drive listing for root ${rootId}...`);

  try {
    const drive = google.drive({ version: 'v3' });
    const res = await drive.files.list({
      q: `'${rootId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 20
    });

    console.log('✅ Success! Files listed in root folder:');
    res.data.files?.forEach(f => console.log(`   - "${f.name}" (ID: ${f.id}, Mime: ${f.mimeType})`));
  } catch (err) {
    console.error('❌ Direct public Drive list failed:', err.message);
  }
}

testApiKey();
