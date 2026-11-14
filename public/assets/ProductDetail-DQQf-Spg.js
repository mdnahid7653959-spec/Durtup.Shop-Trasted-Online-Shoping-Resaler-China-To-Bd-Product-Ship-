// Durtup.shop Self-Healing Chunk Rescue Module
// Automatically unblocks legacy browsers requesting the old ProductDetail chunk
if (typeof window !== 'undefined') {
  try {
    sessionStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs) {
        for (var i = 0; i < regs.length; i++) {
          regs[i].unregister();
        }
      }).catch(function() {});
    }

    if ('caches' in window) {
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
      }).finally(function() {
        var u = new URL(window.location.href);
        u.searchParams.set('_v', Date.now().toString());
        window.location.replace(u.toString());
      });
    } else {
      var u = new URL(window.location.href);
      u.searchParams.set('_v', Date.now().toString());
      window.location.replace(u.toString());
    }
  } catch (e) {
    window.location.reload();
  }
}

export default function ProductDetailLegacyFallback() {
  return null;
}
