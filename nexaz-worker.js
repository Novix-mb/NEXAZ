const NOTIF_ICON = './assets/img/nexaz-notif-192.png?v=12';
const NOTIF_BADGE = './assets/img/nexaz-badge-96.png?v=12';

function kvOp(mode, fn) {
  return new Promise((ok, no) => {
    const open = indexedDB.open('nexa-sw', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('kv');
    open.onerror = () => no(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('kv', mode);
      const req = fn(tx.objectStore('kv'));
      tx.oncomplete = () => { db.close(); ok(req && req.result); };
      tx.onerror = tx.onabort = () => { db.close(); no(tx.error); };
    };
  });
}
const kvGet = k => kvOp('readonly', s => s.get(k)).catch(() => undefined);
const kvPut = (k, v) => kvOp('readwrite', s => s.put(v, k)).catch(() => {});

async function showDueReminders() {
  const sched = await kvGet('sched');
  if (!sched || !Array.isArray(sched.items)) return;
  const fired = (await kvGet('fired')) || {};
  const now = Date.now() + (sched.off || 0);
  let changed = false;
  for (const it of sched.items) {
    if (!it || fired[it.key]) continue;
    if (now >= it.ts && now < it.ts + (it.win || 0)) {
      const missed = it.msg2 && now - it.ts > 30 * 60000;
      try {
        await self.registration.showNotification('NEXAZ', {
          body: missed ? it.msg2 : it.msg,
          tag: it.tag,
          icon: NOTIF_ICON,
          badge: NOTIF_BADGE,
          lang: sched.lang || 'en',
          dir: sched.lang === 'ar' ? 'rtl' : 'ltr',
          vibrate: [200, 100, 200],
          renotify: true,
          requireInteraction: !!it.ri,
          data: { go: it.go || null }
        });
        fired[it.key] = 1;
        changed = true;
      } catch (e) {}
    }
  }
  if (changed) await kvPut('fired', fired);
}

self.addEventListener('periodicsync', event => {
  if (event.tag === 'nexa-check') event.waitUntil(showDueReminders());
});


self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = {}; }
  event.waitUntil((async () => {
    if (d.key) {
      const f = (await kvGet('fired')) || {};
      f[d.key] = 1;
      await kvPut('fired', f);
    }
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some(c => c.visibilityState === 'visible')) return;
    await self.registration.showNotification('NEXAZ', {
      body: d.body || 'NEXAZ',
      tag: d.tag || 'nexa-push',
      icon: NOTIF_ICON,
      badge: NOTIF_BADGE,
      lang: d.lang || 'en',
      dir: d.lang === 'ar' ? 'rtl' : 'ltr',
      vibrate: [200, 100, 200],
      renotify: true,
      requireInteraction: !!d.ri,
      data: { go: d.go || null }
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const go = (event.notification.data && event.notification.data.go) || null;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      try { await c.focus(); } catch (e) {}
      c.postMessage({ type: 'go', go });
      return;
    }
    const w = await self.clients.openWindow('./');
    if (w) setTimeout(() => { try { w.postMessage({ type: 'go', go }); } catch (e) {} }, 2000);
  })());
});
