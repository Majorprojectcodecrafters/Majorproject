const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { callGemini, callGroq } = require('../src/rag/llmClient');

async function testModels() {
  console.log('🧪 Testing LLM Provider Models...');

  try {
    console.log('1️⃣ Testing Gemini Model...');
    const geminiRes = await callGemini('Respond with {"status": "ok", "message": "Gemini working"}');
    console.log('  ✅ Gemini Response:', geminiRes.slice(0, 100));
  } catch (err) {
    console.error('  ❌ Gemini Failed:', err.message);
  }

  try {
    console.log('\n2️⃣ Testing Groq Model...');
    const groqRes = await callGroq('Respond with {"status": "ok", "message": "Groq working"}');
    console.log('  ✅ Groq Response:', groqRes.slice(0, 100));
  } catch (err) {
    console.error('  ❌ Groq Failed:', err.message);
  }
}

testModels();
