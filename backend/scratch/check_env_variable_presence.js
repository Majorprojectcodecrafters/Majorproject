require('dotenv').config();

console.log('🔍 Checking Environment Variable Configuration Status (NO VALUES SHOWN):');

const saEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
const saKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_DRIVE_PRIVATE_KEY;
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

console.log('----------------------------------------------------');
console.log('1. Service Account Configuration:');
console.log('   - GOOGLE_SERVICE_ACCOUNT_EMAIL:', saEmail ? 'Configured ✅' : 'Missing ❌');
console.log('   - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:', saKey ? 'Configured ✅' : 'Missing ❌');
console.log('   -> Service Account Active:', Boolean(saEmail && saKey) ? 'YES ✅' : 'NO ❌');

console.log('\n2. OAuth2 Configuration:');
console.log('   - GOOGLE_CLIENT_ID:', clientId ? 'Configured ✅' : 'Missing ❌');
console.log('   - GOOGLE_CLIENT_SECRET:', clientSecret ? 'Configured ✅' : 'Missing ❌');
console.log('   - GOOGLE_REFRESH_TOKEN:', refreshToken ? 'Configured ✅' : 'Missing ❌');
console.log('   -> OAuth2 Active:', Boolean(clientId && clientSecret && refreshToken) ? 'YES ✅' : 'NO ❌');

console.log('\n3. Google Drive Root Folder:');
console.log('   - GOOGLE_DRIVE_ROOT_FOLDER_ID:', rootFolderId ? 'Configured ✅' : 'Missing ❌');
console.log('----------------------------------------------------');
