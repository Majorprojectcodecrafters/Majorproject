const Groq = require('groq-sdk');

/**
 * Unified Multi-Provider LLM Completion Helper
 * Priority sequence based on LLM_PROVIDER env variable:
 * 1. GEMINI (Google Gemini 1.5/2.0 Flash - 1 Million TPM free tier)
 * 2. GROQ (Groq Cloud API)
 * 3. OLLAMA (Local Ollama LLM - 100% Free & Unlimited)
 * 4. OPENROUTER / DEEPSEEK / OPENAI
 */

async function callGroq(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is missing from .env');
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

  const completion = await groq.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 6000
  });

  return completion.choices[0]?.message?.content || '';
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from .env');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 6000
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response received from Gemini API');
  }
  return text;
}

async function callOllama(prompt) {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3:8b';

  const response = await fetch(`${host}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.5
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error (${response.status}): Make sure Ollama server is running locally on ${host}`);
  }

  const data = await response.json();
  return data.response || '';
}

async function callLLM(prompt) {
  const primaryProvider = (process.env.LLM_PROVIDER || 'groq').toLowerCase();

  const providers = {
    gemini: callGemini,
    groq: callGroq,
    ollama: callOllama
  };

  // Build execution list starting with configured provider
  const order = [primaryProvider];
  ['gemini', 'groq', 'ollama'].forEach(p => {
    if (!order.includes(p)) order.push(p);
  });

  let lastError = null;
  for (const provider of order) {
    try {
      console.log(`🤖 Invoking LLM Provider: [${provider.toUpperCase()}]...`);
      if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
        continue; // Skip if key not configured
      }
      if (provider === 'groq' && !process.env.GROQ_API_KEY) {
        continue; // Skip if key not configured
      }

      const responseText = await providers[provider](prompt);
      console.log(`✅ Success response from LLM Provider: [${provider.toUpperCase()}]`);
      return responseText;
    } catch (err) {
      console.warn(`⚠️ LLM Provider [${provider.toUpperCase()}] failed: ${err.message}`);
      lastError = err;
      // Continue to next provider in fallback chain
    }
  }

  throw lastError || new Error('All LLM providers failed or are unconfigured.');
}

module.exports = {
  callLLM,
  callGroq,
  callGemini,
  callOllama
};
