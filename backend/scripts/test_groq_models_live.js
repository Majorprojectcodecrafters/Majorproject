const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Groq = require('groq-sdk');

async function testActiveGroq() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const candidates = ['qwen/qwen3.6-27b', 'groq/compound-mini', 'openai/gpt-oss-120b'];

  for (const m of candidates) {
    try {
      console.log(`Testing "${m}"...`);
      const completion = await groq.chat.completions.create({
        model: m,
        messages: [{ role: 'user', content: 'Respond with {"status": "ok"}' }],
        max_tokens: 50
      });
      console.log(`  ✅ Groq "${m}" Success:`, completion.choices[0]?.message?.content);
    } catch (e) {
      console.log(`  ❌ Groq "${m}" Failed:`, e.message);
    }
  }
}

testActiveGroq();
