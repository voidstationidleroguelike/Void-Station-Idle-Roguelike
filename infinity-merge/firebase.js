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

  async function getCallableApi() {
    if (!callablePromise) {
      callablePromise = Promise.all([
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js")
      ]).then(([appSdk, functionsSdk]) => {
        const app = appSdk.getApps().length
          ? appSdk.getApp()
          : appSdk.initializeApp({
              apiKey: FIREBASE.apiKey,
              authDomain: FIREBASE.authDomain,
              projectId: FIREBASE.projectId,
              storageBucket: FIREBASE.storageBucket,
              messagingSenderId: FIREBASE.messagingSenderId,
              appId: FIREBASE.appId,
              measurementId: FIREBASE.measurementId
            });

        const functions = functionsSdk.getFunctions(app, FIREBASE.functionsRegion);
        const submit = functionsSdk.httpsCallable(functions, "submitWorldBest");

        return { submit };
      });
    }

    return callablePromise;
  }

  async function submitWorldBest(bestLevel) {
    const level = Number(bestLevel);

    if (!Number.isInteger(level) || level < 1) {
      return {
        ok: false,
        bestLevel: cachedBest,
        error: new Error("Invalid best level")
      };
    }

    // No reason to call the backend if this browser already knows
    // about an equal or higher world record.
    if (level <= cachedBest) {
      return {
        ok: true,
        bestLevel: cachedBest,
        newRecord: false,
        skipped: true
      };
    }

    try {
      const { submit } = await getCallableApi();
      const result = await submit({ bestLevel: level });

      const serverBest = Number(result?.data?.bestLevel);
      if (!Number.isInteger(serverBest) || serverBest < 1) {
        throw new Error("Cloud Function returned an invalid bestLevel");
      }

      setCachedBest(serverBest, "cloud-function");

      return {
        ok: true,
        bestLevel: serverBest,
        newRecord: !!result?.data?.newRecord
      };
    } catch (error) {
      console.warn("WORLD BEST submit failed.", error);
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
