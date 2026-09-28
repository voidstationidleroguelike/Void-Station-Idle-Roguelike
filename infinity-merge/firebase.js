(() => {
  const FIREBASE = {
    apiKey: "AIzaSyCQuf7WdSQD1A2jdpHgcYk5RVD99Fs8p3M",
    authDomain: "infinity-merge-be73f.firebaseapp.com",
    projectId: "infinity-merge-be73f",
    storageBucket: "infinity-merge-be73f.firebasestorage.app",
    messagingSenderId: "499763261804",
    appId: "1:499763261804:web:71850a0276e76500680349",
    measurementId: "G-L0DC5NCX2W",

    collection: "Leaderboard",
    document: "global",
    field: "bestLevel",
    functionsRegion: "europe-west1"
  };

  const CACHE_KEY = "infinityMerge_worldBest_v1";
  let cachedBest = Number(localStorage.getItem(CACHE_KEY) || 1);
  if (!Number.isFinite(cachedBest) || cachedBest < 1) cachedBest = 1;

  let callablePromise = null;

  function getCachedBest() {
    return cachedBest;
  }

  function setCachedBest(best, source = "firebase") {
    const value = Number(best);
    if (!Number.isFinite(value) || value < 1) return cachedBest;

    cachedBest = Math.floor(value);
    localStorage.setItem(CACHE_KEY, String(cachedBest));

    window.dispatchEvent(new CustomEvent("infinity-world-best", {
      detail: { bestLevel: cachedBest, source }
    }));

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

      setCachedBest(best, "firebase");
      return { ok: true, bestLevel: best, source: "firebase" };
    } catch (error) {
      console.warn("BEST IN WORLD fetch failed; using cache.", error);

      window.dispatchEvent(new CustomEvent("infinity-world-best", {
        detail: { bestLevel: cachedBest, source: "cache" }
      }));

      return { ok: false, bestLevel: cachedBest, source: "cache", error };
    }
  }

  function documentUrl() {
    return (
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE.projectId)}` +
      `/databases/(default)/documents/${encodeURIComponent(FIREBASE.collection)}/${encodeURIComponent(FIREBASE.document)}`
    );
  }

  async function submitWorldBest(bestLevel) {
    const level = Number(bestLevel);

    if (!Number.isInteger(level) || level < 1 || level > 100000) {
      return {
        ok: false,
        bestLevel: cachedBest,
        newRecord: false
      };
    }

    if (level <= cachedBest) {
      return {
        ok: true,
        bestLevel: cachedBest,
        newRecord: false
      };
    }

    // Refresh immediately before writing so an already-higher world record
    // is never intentionally replaced by this client.
    const latest = await refreshWorldBest();
    if (latest?.bestLevel >= level) {
      return {
        ok: true,
        bestLevel: latest.bestLevel,
        newRecord: false
      };
    }

    const url =
      `${documentUrl()}` +
      `?updateMask.fieldPaths=${encodeURIComponent(FIREBASE.field)}` +
      `&key=${encodeURIComponent(FIREBASE.apiKey)}`;

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fields: {
            [FIREBASE.field]: {
              integerValue: String(level)
            }
          }
        })
      });

      if (response.status === 403) {
        const refreshed = await refreshWorldBest();
        return {
          ok: refreshed.ok,
          bestLevel: refreshed.bestLevel,
          newRecord: false
        };
      }

      if (!response.ok) {
        throw new Error(`Firestore HTTP ${response.status}`);
      }

      const payload = await response.json();
      const serverBest = parseBestLevel(payload) ?? level;

      setCachedBest(serverBest, "firebase-write");

      return {
        ok: true,
        bestLevel: serverBest,
        newRecord: serverBest === level
      };
    } catch (error) {
      console.warn("BEST IN WORLD submit failed.", error);

      return {
        ok: false,
        bestLevel: cachedBest,
        newRecord: false,
        error
      };
    }
  }

  window.InfinityFirebase = {
    config: FIREBASE,
    getCachedBest,
    refreshWorldBest,
    submitWorldBest
  };
})();
