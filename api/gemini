export const config = { runtime: ‘edge’ };

export default async function handler(req) {
if (req.method !== ‘POST’) {
return new Response(‘Method not allowed’, { status: 405 });
}

try {
const body = await req.json();
const { messages, system } = body;


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

return new Response(response.body, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  }
});


} catch (err) {
return new Response(JSON.stringify({ error: err.message }), {
status: 500,
headers: { ‘Content-Type’: ‘application/json’ }
});
}
}
