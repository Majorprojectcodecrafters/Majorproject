const Groq = require('groq-sdk');
require('dotenv').config();

async function listModels() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const models = await groq.models.list();
  console.log('--- AVAILABLE GROQ MODELS ---');
  models.data.forEach(m => console.log(`- ${m.id}`));
}

listModels().catch(err => console.error(err.message));
