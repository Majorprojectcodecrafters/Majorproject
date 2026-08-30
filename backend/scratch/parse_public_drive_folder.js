const https = require('https');

function fetchPublicFolderHtml(folderId) {
  return new Promise((resolve, reject) => {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function inspectPublicFolder() {
  const folderId = '1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3';
  console.log(`Fetching public folder page for ${folderId}...`);

  try {
    const html = await fetchPublicFolderHtml(folderId);

    // Extract title from HTML
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const folderTitle = titleMatch ? titleMatch[1] : 'Google Drive Folder';

    console.log(`\n📁 Folder Title: "${folderTitle}"`);

    // Search for embedded file names or JSON metadata blocks
    const fileMatches = [...html.matchAll(/\["([^"]+?\.(?:pdf|doc|docx|epub))"/gi)];
    const uniqueFiles = [...new Set(fileMatches.map(m => m[1]))];

    console.log(`\n📄 Discovered Files in Public Shared Link (${uniqueFiles.length}):`);
    if (uniqueFiles.length === 0) {
      console.log('   (No files detected in public folder snippet)');
    } else {
      uniqueFiles.forEach((name, idx) => {
        console.log(`   [${idx + 1}] ${name}`);
      });
    }

    // Check if subfolder titles exist in script payload
    const folderMatches = [...html.matchAll(/\["([0-9a-zA-Z_\-]{20,})","([^"]+?)",.*?"application\/vnd\.google-apps\.folder"/g)];
    if (folderMatches.length > 0) {
      console.log(`\n📁 Discovered Subfolders (${folderMatches.length}):`);
      folderMatches.forEach(m => console.log(`   📁 ${m[2]} [ID: ${m[1]}]`));
    }

  } catch (err) {
    console.error('Error:', err.message);
  }

  process.exit(0);
}

inspectPublicFolder();
