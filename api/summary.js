module.exports = async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(200).end();
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

var body = req.body;
var messages = body.messages || [];

if (messages.length < 2) return res.status(200).json({ ok: true });

try {
var conversation = messages.map(function(m) {
return m.role.toUpperCase() + ': ' + m.content;
}).join('\n\n');

var summaryPrompt = 'Analyze this business chatbot conversation in 2 sentences. Identify: 1) What business/industry this person is in. 2) Their main challenge or interest level. Be concise and professional. No names needed.\n\nConversation:\n' + conversation;

var claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'x-api-key': process.env.ANTHROPIC_API_KEY,
'anthropic-version': '2023-06-01'
},
body: JSON.stringify({
model: 'claude-opus-4-5',
max_tokens: 150,
messages: [{ role: 'user', content: summaryPrompt }]
})
});

var claudeData = await claudeRes.json();
var summary = claudeData.content ? claudeData.content[0].text : 'No summary available';

var mailRes = await fetch('https://api.resend.com/emails', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': 'Bearer ' + process.env.RESEND_KEY
},
body: JSON.stringify({
from: 'Bogong Lab <studio@bogongai.net>',
to: 'studio@mail.bogongai.net',
subject: 'New conversation — Bogong AI Lab',
text: summary + '\n\nMessages: ' + messages.length
})
});

return res.status(200).json({ ok: true });

} catch (err) {
return res.status(500).json({ error: err.message });
}
}
