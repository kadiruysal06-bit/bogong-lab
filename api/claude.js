module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, system } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: system || '',
        messages: messages
      })
    });

    const data = await response.json();
    const text = data.content && data.content[0] && data.content[0].text ? data.content[0].text : 'No response';

    res.status(200).json({ text: text });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
