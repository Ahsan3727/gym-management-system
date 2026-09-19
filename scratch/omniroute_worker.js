const API_URL = 'http://127.0.0.1:20128/v1/chat/completions';
const API_KEY = 'sk-f2b3b422a7bb1b8b-107ce6-0bef9f3e';

async function callOmniRoute(prompt, systemPrompt = "You are an expert full-stack engineer.") {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'antigravity/gemini-3.7-flash-high',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OmniRoute error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { callOmniRoute };
