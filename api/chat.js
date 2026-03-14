module.exports = async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(200).end();
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

var body = req.body;
var messages = body.messages || [];
var system = process.env.SYSTEM_PROMPT || body.system || '';
if (!body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Invalid request' });
}

var lastMessage = body.messages[body.messages.length - 1];
if (lastMessage && lastMessage.content && lastMessage.content.length > 2000) {
    return res.status(400).json({ error: 'Message too long' });
}

if (body.messages.length > 20) {
    return res.status(400).json({ error: 'Conversation limit reached' });
}

try {
var response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': process.env.ANTHROPIC_API_KEY,
'anthropic-version': '2023-06-01'
},
body: JSON.stringify({
model: 'claude-opus-4-5',
max_tokens: 600,
stream: true,
system: system,
messages: messages
})
});

res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Transfer-Encoding', 'chunked');

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    // Forward only content_block_delta events with text deltas
    const lines = chunk.split('\n');
    for (const line of lines) {
        if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
                const evt = JSON.parse(jsonStr);
                if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
                    res.write('data: ' + JSON.stringify({ text: evt.delta.text }) + '\n\n');
                }
                if (evt.type === 'message_stop') {
                    res.write('data: [DONE]\n\n');
                }
            } catch (_) {}
        }
    }
}

res.end();

} catch (err) {
res.write('data: ' + JSON.stringify({ error: err.message }) + '\n\n');
res.end();
}

}
