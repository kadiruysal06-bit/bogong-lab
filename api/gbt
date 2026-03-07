export const config = { runtime: ‘edge’ };

export default async function handler(req) {
if (req.method !== ‘POST’) {
return new Response(‘Method not allowed’, { status: 405 });
}

try {
const body = await req.json();
const { messages } = body;


const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: messages,
    stream: true,
    max_tokens: 1500
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
