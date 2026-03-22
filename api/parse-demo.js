module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    var body = req.body;
    var imageData = body.imageData;
    var mediaType = body.mediaType || 'image/jpeg';
    var isImage = body.isImage !== false;

    if (!imageData) return res.status(400).json({ error: 'No image data' });

    var prompt = 'Parse this invoice and return ONLY valid JSON with no other text:\n{\n  "supplier": "supplier name",\n  "date": "DD/MM/YYYY",\n  "invoice_number": "INV-xxx or empty string",\n  "items": [\n    {\n      "name": "item name",\n      "quantity": 1.0,\n      "unit": "kg or unit or btl",\n      "unit_price": 10.00,\n      "total": 10.00,\n      "category": "produce"\n    }\n  ],\n  "subtotal": 0.00,\n  "gst": 0.00,\n  "total": 0.00\n}\nCategories must be one of: produce, meat, dairy, other\nAll numbers must be numeric. Return ONLY the JSON object.';

    var parts = [];

    if (isImage) {
      parts.push({
        inline_data: {
          mime_type: mediaType,
          data: imageData
        }
      });
    }

    parts.push({ text: prompt });

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY;

    var response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
      })
    });

    var data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    var text = data.candidates[0].content.parts[0].text || '';
    var jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'Could not parse invoice' });

    var parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
