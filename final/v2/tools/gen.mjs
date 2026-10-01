#!/usr/bin/env node
// Gemini image generation. Usage:
//   node tools/gen.mjs <out.png> --prompt "<text>" [--model gemini-3-pro-image] [--aspect 16:9] [--size 2K] [ref.png ...]
// Writes the image plus <out>.json (model, prompt, refs, timestamp) into art/log for reconstruction.
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const out = resolve(args.shift());
const opt = { model: "gemini-3-pro-image", aspect: "16:9", size: "2K", prompt: "" };
const refs = [];
while (args.length) {
  const a = args.shift();
  if (a.startsWith("--")) opt[a.slice(2)] = args.shift();
  else refs.push(resolve(a));
}
if (!opt.prompt) throw new Error("--prompt required");
const key = process.env.GEMINI_API_KEY;
if (!key) throw new Error("GEMINI_API_KEY not set");

const parts = [{ text: opt.prompt }, ...refs.map((r) => ({
  inline_data: { mime_type: r.endsWith(".jpg") || r.endsWith(".jpeg") ? "image/jpeg" : "image/png", data: readFileSync(r).toString("base64") },
}))];
const body = {
  contents: [{ parts }],
  generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: opt.aspect, imageSize: opt.size } },
};
const url = `https://generativelanguage.googleapis.com/v1beta/models/${opt.model}:generateContent`;
let json;
for (let attempt = 1; attempt <= 4; attempt++) {
  const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  json = await res.json();
  if (res.ok) break;
  console.error(`attempt ${attempt}: ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  if (attempt === 4 || (res.status !== 429 && res.status < 500)) process.exit(1);
  await new Promise((r) => setTimeout(r, attempt * 8000));
}
const img = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
if (!img) { console.error(JSON.stringify(json).slice(0, 800)); process.exit(1); }
const data = img.inlineData ?? img.inline_data;
const file = /jpe?g/.test(data.mimeType ?? data.mime_type ?? "") ? out.replace(/\.png$/, ".jpg") : out;
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, Buffer.from(data.data, "base64"));
const log = join(import.meta.dirname, "../art/log");
mkdirSync(log, { recursive: true });
appendFileSync(join(log, "gemini-calls.jsonl"), JSON.stringify({ t: new Date().toISOString(), out: file.replace(resolve(import.meta.dirname, "..") + "/", ""), ...opt, refs: refs.map((r) => basename(r)) }) + "\n");
console.log(file);
