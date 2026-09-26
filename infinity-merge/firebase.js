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

  if (!Number.isFinite(cachedBest) || cachedBest < 1) {
    cachedBest = 1;
  }

  function getCachedBest() {
    return cachedBest;
  }

  function setCachedBest(best, source = "firebase") {
    const value = Number(best);

    if (!Number.isFinite(value) || value < 1) {
      return cachedBest;
    }

    cachedBest = Math.floor(value);

    localStorage.setItem(
      CACHE_KEY,
      String(cachedBest)
    );

    window.dispatchEvent(
      new CustomEvent("infinity-world-best", {
        detail: {
          bestLevel: cachedBest,
          source
        }
      })
    );

    return cachedBest;
  }

  function parseBestLevel(payload) {
    const field = payload?.fields?.[FIREBASE.field];

    const raw =
      field?.integerValue ??
      field?.doubleValue;

    const value = Number(raw);

    return Number.isFinite(value) && value >= 1
      ? Math.floor(value)
      : null;
  }

  function documentUrl() {
    return (
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE.projectId)}` +
      `/databases/(default)/documents/${encodeURIComponent(FIREBASE.collection)}/${encodeURIComponent(FIREBASE.document)}`
    );
  }

  async function refreshWorldBest() {
    const url =
      `${documentUrl()}?key=${encodeURIComponent(FIREBASE.apiKey)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(
          `Firestore HTTP ${response.status}`
        );
      }

      const payload = await response.json();

      const best =
        parseBestLevel(payload);

      if (best == null) {
        throw new Error(
          "bestLevel missing or invalid"
        );
      }

      setCachedBest(
        best,
        "firebase"
      );

      return {
        ok: true,
        bestLevel: best
      };

    } catch (error) {
      console.warn(
        "BEST IN WORLD fetch failed.",
        error
      );

      return {
        ok: false,
        bestLevel: cachedBest,
        error
      };
    }
  }

  async function submitWorldBest(bestLevel) {
    const level =
      Number(bestLevel);

    if (
      !Number.isInteger(level) ||
      level < 1 ||
      level > 100000
    ) {
      return {
        ok: false,
        bestLevel: cachedBest
      };
    }

    /*
      Ingen grunn til å skrive dersom
      Firebase-rekorden vi kjenner allerede
      er like høy eller høyere.
    */
    if (level <= cachedBest) {
      return {
        ok: true,
        bestLevel: cachedBest,
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

      /*
        Kan skje dersom en annen spiller
        akkurat rakk å sette en høyere rekord.
        Da leser vi bare den nye rekorden.
      */
      if (response.status === 403) {
        const refreshed =
          await refreshWorldBest();

        return {
          ok: refreshed.ok,
          bestLevel: refreshed.bestLevel,
          newRecord: false
        };
      }

      if (!response.ok) {
        throw new Error(
          `Firestore HTTP ${response.status}`
        );
      }

      const payload =
        await response.json();

      const serverBest =
        parseBestLevel(payload) ?? level;

      setCachedBest(
        serverBest,
        "firebase-write"
      );

      return {
        ok: true,
        bestLevel: serverBest,
        newRecord:
          serverBest === level
      };

    } catch (error) {
      console.warn(
        "BEST IN WORLD submit failed.",
        error
      );

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
