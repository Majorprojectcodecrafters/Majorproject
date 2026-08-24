const Groq = require('groq-sdk');

// Track active key index for round-robin rotation
let currentGeminiKeyIdx = 0;
let currentGroqKeyIdx = 0;

function getGeminiKeys() {
  const keys = process.env.GEMINI_API_KEYS
    ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];
  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  return keys;
}

function getGroqKeys() {
  const keys = process.env.GROQ_API_KEYS
    ? process.env.GROQ_API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];
  if (process.env.GROQ_API_KEY && !keys.includes(process.env.GROQ_API_KEY.trim())) {
    keys.push(process.env.GROQ_API_KEY.trim());
  }
  return keys;
}

async function callGroqWithKey(prompt, apiKey) {
  const groq = new Groq({ apiKey });
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

  const trimmedPrompt = prompt.length > 4000
    ? prompt.slice(0, 4000) + '\n\nOutput ONLY valid JSON.'
    : prompt;

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: 'You are an AI that outputs strictly valid JSON.' },
      { role: 'user', content: trimmedPrompt }
    ],
    temperature: 0.3,
    max_tokens: 3000
  });

  return completion.choices[0]?.message?.content || '';
}

async function callGeminiWithKey(prompt, apiKey) {
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
        maxOutputTokens: 8192
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

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is missing from .env');
  }

  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/QPGen',
      'X-Title': 'QPGen RAG Engine',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an AI that outputs strictly valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response received from OpenRouter API');
  }
  return content;
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

/**
 * Unified Multi-Provider & Multi-Key Key-Rotating LLM Caller
 */
async function callLLM(prompt) {
  const geminiKeys = getGeminiKeys();
  const groqKeys = getGroqKeys();

  // Try Gemini Pool (rotating across all Gemini keys)
  if (geminiKeys.length > 0) {
    for (let attempt = 0; attempt < geminiKeys.length; attempt++) {
      const keyIdx = (currentGeminiKeyIdx + attempt) % geminiKeys.length;
      const key = geminiKeys[keyIdx];
      const maskedKey = key.slice(0, 8) + '...' + key.slice(-4);

      try {
        console.log(`🤖 Invoking [GEMINI Pool Key #${keyIdx + 1}/${geminiKeys.length}] (${maskedKey})...`);
        const text = await callGeminiWithKey(prompt, key);
        console.log(`✅ Success response from GEMINI Key #${keyIdx + 1}`);
        currentGeminiKeyIdx = (keyIdx + 1) % geminiKeys.length;
        return text;
      } catch (err) {
        console.warn(`⚠️ GEMINI Key #${keyIdx + 1} failed: ${err.message}`);
        if (err.message.includes('429') || err.message.includes('Quota') || err.message.includes('limit')) {
          console.log(`🔄 Quota exhausted for Gemini Key #${keyIdx + 1}, switching immediately to next key...`);
        }
      }
    }
  }

  // Try Groq Pool (rotating across all Groq keys)
  if (groqKeys.length > 0) {
    for (let attempt = 0; attempt < groqKeys.length; attempt++) {
      const keyIdx = (currentGroqKeyIdx + attempt) % groqKeys.length;
      const key = groqKeys[keyIdx];
      const maskedKey = key.slice(0, 8) + '...' + key.slice(-4);

      try {
        console.log(`🤖 Invoking [GROQ Pool Key #${keyIdx + 1}/${groqKeys.length}] (${maskedKey})...`);
        const text = await callGroqWithKey(prompt, key);
        console.log(`✅ Success response from GROQ Key #${keyIdx + 1}`);
        currentGroqKeyIdx = (keyIdx + 1) % groqKeys.length;
        return text;
      } catch (err) {
        console.warn(`⚠️ GROQ Key #${keyIdx + 1} failed: ${err.message}`);
        if (err.message.includes('429') || err.message.includes('Rate') || err.message.includes('limit')) {
          console.log(`🔄 Rate limit for Groq Key #${keyIdx + 1}, switching immediately to next key...`);
        }
      }
    }
  }

  // Try OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      console.log(`🤖 Invoking [OPENROUTER] API...`);
      const text = await callOpenRouter(prompt);
      console.log(`✅ Success response from OPENROUTER`);
      return text;
    } catch (err) {
      console.warn(`⚠️ OPENROUTER failed: ${err.message}`);
    }
  }

  // Try Local Ollama Fallback
  try {
    console.log(`🤖 Invoking [OLLAMA] local server...`);
    const text = await callOllama(prompt);
    console.log(`✅ Success response from OLLAMA`);
    return text;
  } catch (err) {
    console.warn(`⚠️ OLLAMA local fallback failed: ${err.message}`);
  }

  throw new Error('All LLM keys across Gemini, Groq, OpenRouter, and Ollama pools are exhausted or unconfigured.');
}

module.exports = {
  callLLM,
  getGeminiKeys,
  getGroqKeys
};
