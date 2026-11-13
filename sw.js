/* CareNote Assist service worker: caches the app so it opens offline.
   Nothing about patients or notes is ever sent through or stored by this file.
   Bump VERSION whenever you change any cached file. */
const VERSION = "v1", CACHE = `carenote-${VERSION}`;
const FILES = ["./", "./index.html", "./core.js", "./app.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(FILES.map((f) => c.add(f)))).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return; const url = new URL(req.url); if (url.origin !== self.location.origin) return;   // only our own files
  if (req.mode === "navigate") { e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return r; }).catch(() => caches.match("./index.html").then((r) => r || Response.error()))); return; }
  e.respondWith(caches.match(req).then((hit) => { const net = fetch(req).then((r) => { if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return r; }).catch(() => null); return hit || net.then((r) => r || Response.error()); }));
});
