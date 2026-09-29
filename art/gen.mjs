// Ask Gemini to redraw a frame. Usage:
//   node art/gen.mjs out.png "prompt" ref1.png [ref2.png ...]
import fs from 'fs';
const [out, prompt, ...refs] = process.argv.slice(2);
const model = process.env.MODEL || 'gemini-3-pro-image';
const parts = refs.map((f) => ({ inline_data: { mime_type: 'image/png', data: fs.readFileSync(f).toString('base64') } }));
parts.push({ text: prompt });
const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '1:1' } } }),
});
const j = await res.json();
if (!res.ok) { console.error(JSON.stringify(j).slice(0, 800)); process.exit(1); }
const img = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
if (!img) { console.error('no image', JSON.stringify(j).slice(0, 800)); process.exit(1); }
fs.writeFileSync(out, Buffer.from((img.inlineData || img.inline_data).data, 'base64'));
console.log('wrote', out);
