const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Groq = require('groq-sdk');

async function getModels() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const list = await groq.models.list();
    console.log('📋 Active Groq Models:');
    list.data.forEach(m => console.log(`  - "${m.id}"`));
  } catch (err) {
    console.error('Error fetching Groq models:', err.message);
  }
}

getModels();
