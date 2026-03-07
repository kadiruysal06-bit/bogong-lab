module.exports = async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

try {
const { messages, system } = req.body;


const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=' + process.env.GEMINI_API_KEY + '&alt=sse';

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    system_instruction: { parts: [{ text: system || '' }] },
    contents: messages,
    generationConfig: { temperature: 0.9 }
  })
});

res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Access-Control-Allow-Origin', '*');

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  res.write(value);
}
res.end();


} catch (err) {
res.status(500).json({ error: err.message });
}
};
