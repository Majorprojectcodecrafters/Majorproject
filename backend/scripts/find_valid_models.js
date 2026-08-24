const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Groq = require('groq-sdk');

async function scanModels() {
  console.log('🔍 Testing Gemini Models...');
  const geminiCandidates = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-2.5-flash', 'gemini-1.5-pro-latest', 'gemini-flash'];
  const apiKey = process.env.GEMINI_API_KEY;

  for (const m of geminiCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
      });
      if (res.ok) {
        console.log(`  ✅ Working Gemini Model: "${m}"`);
      } else {
        const err = await res.json().catch(() => ({}));
        console.log(`  ❌ Gemini "${m}": ${res.status} - ${err.error?.message || res.statusText}`);
      }
    } catch (e) {
      console.log(`  ❌ Gemini "${m}": ${e.message}`);
    }
  }

  console.log('\n🔍 Testing Groq Models...');
  const groqCandidates = ['llama-3.1-8b-instant', 'llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  for (const m of groqCandidates) {
    try {
      const completion = await groq.chat.completions.create({
        model: m,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 10
      });
      console.log(`  ✅ Working Groq Model: "${m}"`);
    } catch (e) {
      console.log(`  ❌ Groq "${m}": ${e.message}`);
    }
  }
}

scanModels();
