// Service worker : fonctionne hors ligne (l'application et les bibliothèques déjà chargées sont mises en cache)
const CACHE = 'erp-scolaire-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './config.js', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Les données Firebase (Firestore / Auth) ne sont jamais mises en cache ici : le SDK gère son propre mode hors ligne
  if (/firestore\.googleapis\.com|identitytoolkit|securetoken|firebaseinstallations/.test(url.hostname)) return;
  // Pages : réseau d'abord (toujours la dernière version), cache si hors ligne
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  // Autres fichiers (icônes, bibliothèques Firebase / Excel) : cache d'abord, puis réseau
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })));
});
