(() => {
  const FIREBASE = {
    apiKey: "AIzaSyCQuf7WdSQD1A2jdpHgcYk5RVD99Fs8p3M",
    projectId: "infinity-merge-be73f",
    collection: "Leaderboard",
    document: "global",
    field: "bestLevel"
  };

  const CACHE_KEY = "infinityMerge_worldBest_v1";
  let cachedBest = Number(localStorage.getItem(CACHE_KEY) || 1);
  if (!Number.isFinite(cachedBest) || cachedBest < 1) cachedBest = 1;

  function getCachedBest() {
    return cachedBest;
  }

  function parseBestLevel(payload) {
    const field = payload?.fields?.[FIREBASE.field];
    const raw = field?.integerValue ?? field?.doubleValue;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : null;
  }

  async function refreshWorldBest() {
    const url =
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE.projectId)}` +
      `/databases/(default)/documents/${encodeURIComponent(FIREBASE.collection)}/${encodeURIComponent(FIREBASE.document)}` +
      `?key=${encodeURIComponent(FIREBASE.apiKey)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Firestore HTTP ${response.status}`);
      }

      const payload = await response.json();
      const best = parseBestLevel(payload);

      if (best == null) {
        throw new Error("bestLevel missing or invalid");
      }

      cachedBest = best;
      localStorage.setItem(CACHE_KEY, String(best));

      window.dispatchEvent(new CustomEvent("infinity-world-best", {
        detail: { bestLevel: best, source: "firebase" }
      }));

      return { ok: true, bestLevel: best, source: "firebase" };
    } catch (error) {
      console.warn("BEST IN WORLD fetch failed; using cache.", error);

      window.dispatchEvent(new CustomEvent("infinity-world-best", {
        detail: { bestLevel: cachedBest, source: "cache" }
      }));

      return { ok: false, bestLevel: cachedBest, source: "cache", error };
    }
  }

  window.InfinityFirebase = {
    config: FIREBASE,
    getCachedBest,
    refreshWorldBest
  };
})();