// Static server for the preview: byte ranges (Safari needs them for video),
// an access log, and a /__diag beacon that records what the browser saw.
import { createServer } from "node:http";
import { createReadStream, statSync, appendFileSync } from "node:fs";
import { join, extname, normalize } from "node:path";

const ROOT = join(import.meta.dirname, "dist");
const PORT = Number(process.env.PORT || 3000);
const LOG = process.env.LOG || "/tmp/jiro-access.log";
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".mp4": "video/mp4",
  ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".md": "text/markdown" };
const log = (o) => appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), ...o }) + "\n");

createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  const ua = req.headers["user-agent"] || "";
  if (url.pathname === "/__diag") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => { log({ diag: body || url.searchParams.get("d"), ua }); res.writeHead(204).end(); });
    return;
  }
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (p.endsWith("/")) p += "index.html";
  let file = join(ROOT, p), st;
  try { st = statSync(file); if (st.isDirectory()) { file = join(file, "index.html"); st = statSync(file); } }
  catch { log({ path: url.pathname, status: 404, ua }); res.writeHead(404).end("not found"); return; }
  const type = TYPES[extname(file)] || "application/octet-stream";
  const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    let start = range[1] === "" ? st.size - Number(range[2]) : Number(range[1]);
    let end = range[1] !== "" && range[2] !== "" ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
    if (start >= st.size || start > end) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }).end(); return; }
    log({ path: url.pathname, status: 206, range: req.headers.range, ua });
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
    if (req.method === "HEAD") return res.end();
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  log({ path: url.pathname, status: 200, ua });
  res.writeHead(200, { ...headers, "Content-Length": st.size });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}).listen(PORT, "0.0.0.0", () => console.log(`serving ${ROOT} on ${PORT}`));
