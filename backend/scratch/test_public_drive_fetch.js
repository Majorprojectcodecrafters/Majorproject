async function testPublicDriveFetch() {
  console.log('🔍 Testing Public Google Drive Folder Fetch for QpGen_dataset (1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3)...');
  const rootId = '1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3';
  const url = `https://drive.google.com/embeddedfolderview?id=${rootId}#grid`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    console.log(`✅ Response Status: ${res.status}`);
    const html = await res.text();
    console.log(`📄 Body Length: ${html.length}`);
    const hasDriveContent = html.includes('1lt8-tHT6wniWRLwPrsZizWmFCJQ423r3') || html.includes('drive');
    console.log('🔍 Drive Content Detected:', hasDriveContent);
  } catch (err) {
    console.error('❌ Error fetching public drive folder:', err.message);
  }
}

testPublicDriveFetch();
