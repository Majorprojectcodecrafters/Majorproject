const { ChromaClient } = require('chromadb');
const prisma = require('../src/config/prisma');

async function checkChromaAndKnowledge() {
  console.log('🔍 Checking ChromaDB and Knowledge Base Status...\n');

  // 1. Check ChromaDB server
  const host = process.env.CHROMA_HOST || 'localhost';
  const port = Number(process.env.CHROMA_PORT) || 8000;
  console.log(`📡 1. Connecting to ChromaDB server at http://${host}:${port}...`);

  try {
    const client = new ChromaClient({ host, port });
    const version = await client.version();
    console.log(`✅ ChromaDB is RUNNING! Server Version: ${version}`);

    const collections = await client.listCollections();
    console.log(`   Collections found: ${collections.length}`);
    for (const c of collections) {
      console.log(`   - Collection: "${c.name}"`);
      try {
        const col = await client.getCollection({ name: c.name });
        const count = await col.count();
        console.log(`     Items count: ${count}`);
      } catch (colErr) {
        console.log(`     Count error: ${colErr.message}`);
      }
    }
  } catch (err) {
    console.error(`❌ ChromaDB Connection Failed: ${err.message}`);
    console.error(`   Make sure ChromaDB container/server is running on http://${host}:${port}`);
  }

  // 2. Check KnowledgeSource database table
  console.log('\n📚 2. Checking PostgreSQL KnowledgeSource Table...');
  try {
    const sources = await prisma.knowledgeSource.findMany({
      include: {
        class: true,
        subject: true
      }
    });

    console.log(`   Total KnowledgeSource records: ${sources.length}`);
    sources.forEach((s, idx) => {
      console.log(`   ${idx + 1}. [${s.sourceType}] "${s.title}" (File: ${s.fileName}, Status: ${s.status})`);
      console.log(`      Class: "${s.class?.name}", Subject: "${s.subject?.name}"`);
    });
  } catch (dbErr) {
    console.error('❌ Database Query Failed:', dbErr.message);
  }

  // 3. Check Questions Table
  console.log('\n❓ 3. Checking Questions Table...');
  const qCount = await prisma.question.count();
  console.log(`   Total Questions in Bank: ${qCount}`);

  await prisma.$disconnect();
}

checkChromaAndKnowledge();
