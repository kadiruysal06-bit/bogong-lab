module.exports = async function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
if (req.method === 'OPTIONS') return res.status(200).end();
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

var body = req.body;
var name = body.name || 'Unknown';
var email = body.email || '';
var message = body.message || '';

if (!email || !message) {
    return res.status(400).json({ error: 'Email and message required' });
}

if (message.length > 2000) {
    return res.status(400).json({ error: 'Message too long' });
}

try {
    var mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.RESEND_KEY
        },
        body: JSON.stringify({
            from: 'Bogong Lab <studio@mail.bogongai.net>',
            to: 'studio@bogongai.net',
            reply_to: email,
            subject: 'New contact — ' + name,
            text: 'Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message
        })
    });

    var mailData = await mailRes.json();
    if (mailData.error) return res.status(500).json({ error: mailData.error });
    return res.status(200).json({ ok: true });

} catch (err) {
    return res.status(500).json({ error: err.message });
}
}
