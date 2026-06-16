const CACHE='coherence-v3';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-512-maskable.png'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('message',e=>{ if(e.data==='skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const isHTML = req.mode==='navigate' || (req.headers.get('accept')||'').includes('text/html');
  if(isHTML){
    // réseau d'abord : on voit toujours la dernière version en ligne
    e.respondWith(
      fetch(req).then(resp=>{ const cp=resp.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return resp; })
        .catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')))
    );
  } else {
    // statiques (icônes) : cache d'abord
    e.respondWith(
      caches.match(req).then(r=>r||fetch(req).then(resp=>{ const cp=resp.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); return resp; }))
    );
  }
});
