export const config = { runtime: ‘edge’ };

export default async function handler(req) {
if (req.method !== ‘POST’) {
return new Response(‘Method not allowed’, { status: 405 });
}

try {
const body = await req.json();
const { messages, system } = body;


const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    system: system || '',
    messages: messages,
    stream: true
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
