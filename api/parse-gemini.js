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

    var prompt = 'Parse this invoice and return ONLY valid JSON with no other text:\n{"supplier":"supplier name","date":"DD/MM/YYYY","invoice_number":"INV-xxx","items":[{"name":"item name","quantity":1.0,"unit":"kg","unit_price":10.00,"total":10.00,"category":"produce"}],"subtotal":0.00,"gst":0.00,"total":0.00}\nCategories: produce, meat, dairy, other. Numbers must be numeric. Return ONLY JSON.';

    var parts = [];
    if (isImage) {
      parts.push({ inline_data: { mime_type: mediaType, data: imageData } });
    }
    parts.push({ text: prompt });

    var apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;

    var response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('Gemini error:', errText);
      return res.status(500).json({ error: 'Gemini API error: ' + response.status });
    }

    var data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('No candidates:', JSON.stringify(data));
      return res.status(500).json({ error: 'No response from Gemini' });
    }

    var text = data.candidates[0].content.parts[0].text || '';
    console.log('Gemini raw response:', text.substring(0, 200));
    
    // JSON bloğu çıkar - çeşitli formatları dene
    var jsonStr = text;
    var codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      jsonStr = codeMatch[1];
    } else {
      var objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) jsonStr = objMatch[0];
    }
    jsonStr = jsonStr.trim();

    var parsed = JSON.parse(jsonStr);
    return res.status(200).json(parsed);

  } catch(e) {
    console.error('Parse error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
