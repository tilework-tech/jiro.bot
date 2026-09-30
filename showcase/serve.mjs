// Serve the gallery and all saved demos from one origin, including video byte ranges.
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { resolve, sep, extname } from "node:path";

const repo = resolve(import.meta.dirname, "..");
const port = Number(process.env.PORT || 3200);
const roots = {
  "/demo1/": resolve(repo, "demo1/site/dist"),
  "/demo2/": resolve(repo, "demo2/restaurant/dist"),
  "/demo4/": resolve(repo, "demo4/restaurant/dist"),
  "/demo5/": resolve(repo, "demo5/site/dist"),
  "/reference/demo1/": resolve(repo, "demo1/reference/stops"),
  "/showcase/": resolve(repo, "showcase"),
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function target(pathname) {
  if (pathname === "/" || pathname === "/showcase") return resolve(repo, "showcase/index.html");
  if (["/demo1", "/demo2", "/demo4", "/demo5"].includes(pathname)) return null;
  const prefix = Object.keys(roots).find((candidate) => pathname.startsWith(candidate));
  if (!prefix) return false;
  const base = roots[prefix];
  const part = pathname.slice(prefix.length);
  const file = resolve(base, part || "index.html");
  if (file !== base && !file.startsWith(base + sep)) return false;
  return file;
}

createServer((req, res) => {
  let url;
  try { url = new URL(req.url, "http://local"); }
  catch { res.writeHead(400).end("Bad request"); return; }
  if (url.pathname === "/__diag" || url.pathname === "/demo1/__diag") {
    req.resume();
    req.on("end", () => res.writeHead(204).end());
    return;
  }
  if (["/demo1", "/demo2", "/demo4", "/demo5"].includes(url.pathname)) {
    res.writeHead(301, { Location: url.pathname + "/" + url.search }).end();
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400).end("Bad path"); return; }
  let file = target(pathname);
  if (!file) { res.writeHead(404).end("Not found"); return; }
  let stat;
  try {
    stat = statSync(file);
    if (stat.isDirectory()) { file = resolve(file, "index.html"); stat = statSync(file); }
    if (!stat.isFile()) throw new Error("not a file");
  } catch { res.writeHead(404).end("Not found"); return; }
  const headers = {
    "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-cache",
    "Accept-Ranges": "bytes",
  };
  const rangeHeader = req.headers.range;
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match || (!match[1] && !match[2])) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
      return;
    }
    const start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
    const end = match[1] && match[2] ? Math.min(stat.size - 1, Number(match[2])) : stat.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
      return;
    }
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
    if (req.method === "HEAD") { res.end(); return; }
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...headers, "Content-Length": stat.size });
  if (req.method === "HEAD") { res.end(); return; }
  createReadStream(file).pipe(res);
}).listen(port, "0.0.0.0", () => console.log(`Jiro demo gallery listening on ${port}`));
