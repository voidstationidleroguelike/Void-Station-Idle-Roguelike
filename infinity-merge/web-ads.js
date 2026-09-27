(() => {
  const CONFIG = window.INFINITY_WEB_ADS_CONFIG || {};
  const adsense = CONFIG.adsense || {};
  const gam = CONFIG.adManager || {};

  let initialized = false;
  let initPromise = null;
  let gptReady = false;
  let gptListenersInstalled = false;

  const rewardedStates = new Map();

  function valueConfigured(value) {
    return typeof value === "string" &&
      value.trim() !== "" &&
      !value.includes("XXXX") &&
      !value.includes("NETWORK_CODE") &&
      !value.includes("SLOT_ID");
  }

  function adsenseConfigured() {
    return !!adsense.enabled && valueConfigured(adsense.client);
  }

  function gamConfigured() {
    return !!gam.enabled && valueConfigured(gam.rewardedAdUnitPath);
  }

  function notifyState() {
    window.dispatchEvent(new CustomEvent("infinity-ads-state", {
      detail: {
        initialized,
        rewardedAvailable: gamConfigured(),
        displayConfigured: adsenseConfigured()
      }
    }));
  }

  function loadScript(src, attrs = {}) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src === src);

      if (existing) {
        if (existing.dataset.loaded === "1") {
          resolve();
        } else {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
        }
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = src;

      Object.entries(attrs).forEach(([key, value]) => {
        if (key === "crossOrigin") script.crossOrigin = value;
        else script.setAttribute(key, value);
      });

      script.addEventListener("load", () => {
        script.dataset.loaded = "1";
        resolve();
      }, { once: true });

      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }

  async function initAdSense() {
    if (!adsenseConfigured()) return false;

    const src =
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsense.client)}`;

    // Auto Ads needs only the AdSense loader. Placement is controlled in AdSense.
    await loadScript(src, { crossOrigin: "anonymous" });
    return true;
  }

  function finishRewarded(slot, result) {
    const state = rewardedStates.get(slot);
    if (!state || state.done) return;

    state.done = true;
    clearTimeout(state.timer);
    rewardedStates.delete(slot);

    try {
      window.googletag?.destroySlots?.([slot]);
    } catch {}

    state.resolve(result);
  }

  function installGPTListeners() {
    if (gptListenersInstalled) return;
    gptListenersInstalled = true;

    const pubads = window.googletag.pubads();

    pubads.addEventListener("rewardedSlotReady", event => {
      const state = rewardedStates.get(event.slot);
      if (!state) return;

      state.ready = true;

      try {
        state.shown = !!event.makeRewardedVisible();

        if (!state.shown) {
          finishRewarded(event.slot, {
            provider: "google-ad-manager",
            available: true,
            shown: false,
            earned: false
          });
        }
      } catch (error) {
        finishRewarded(event.slot, {
          provider: "google-ad-manager",
          available: true,
          shown: false,
          earned: false,
          error
        });
      }
    });

    pubads.addEventListener("rewardedSlotGranted", event => {
      const state = rewardedStates.get(event.slot);
      if (!state) return;

      state.earned = true;
      state.payload = event.payload || null;
    });

    pubads.addEventListener("rewardedSlotClosed", event => {
      const state = rewardedStates.get(event.slot);
      if (!state) return;

      finishRewarded(event.slot, {
        provider: "google-ad-manager",
        available: true,
        shown: !!state.shown,
        earned: !!state.earned,
        rewardItem: state.payload || null
      });
    });

    pubads.addEventListener("slotRenderEnded", event => {
      if (!event.isEmpty) return;

      if (rewardedStates.has(event.slot)) {
        finishRewarded(event.slot, {
          provider: "google-ad-manager",
          available: true,
          shown: false,
          earned: false,
          noFill: true
        });
      }
    });
  }

  async function initGPT() {
    if (!gamConfigured() || gptReady) return gptReady;

    window.googletag = window.googletag || { cmd: [] };
    await loadScript("https://securepubads.g.doubleclick.net/tag/js/gpt.js");

    await new Promise(resolve => {
      window.googletag.cmd.push(() => {
        installGPTListeners();
        window.googletag.enableServices();
        gptReady = true;
        resolve();
      });
    });

    return true;
  }

  async function init() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const tasks = [];

      if (adsenseConfigured()) {
        tasks.push(
          initAdSense().catch(error => console.warn("AdSense init failed", error))
        );
      }

      if (gamConfigured()) {
        tasks.push(
          initGPT().catch(error => console.warn("Google Ad Manager init failed", error))
        );
      }

      await Promise.all(tasks);
      initialized = true;
      notifyState();

      return adsenseConfigured() || gamConfigured();
    })();

    return initPromise;
  }

  async function showRewarded(reason = "reward") {
    if (!gamConfigured()) {
      return {
        provider: "web",
        available: false,
        shown: false,
        earned: false,
        reason: "Rewarded ads are not configured yet."
      };
    }

    const ready = await initGPT();

    if (!ready) {
      return {
        provider: "web",
        available: false,
        shown: false,
        earned: false
      };
    }

    return new Promise(resolve => {
      window.googletag.cmd.push(() => {
        const slot = window.googletag.defineOutOfPageSlot(
          gam.rewardedAdUnitPath,
          window.googletag.enums.OutOfPageFormat.REWARDED
        );

        if (!slot) {
          resolve({
            provider: "google-ad-manager",
            available: false,
            shown: false,
            earned: false,
            reason: "Rewarded format is not supported on this device/page."
          });
          return;
        }

        slot.addService(window.googletag.pubads());

        const timer = setTimeout(() => {
          finishRewarded(slot, {
            provider: "google-ad-manager",
            available: true,
            shown: false,
            earned: false,
            timeout: true
          });
        }, 30000);

        rewardedStates.set(slot, {
          resolve,
          done: false,
          earned: false,
          shown: false,
          ready: false,
          payload: null,
          reason,
          timer
        });

        window.googletag.display(slot);
      });
    });
  }

  window.InfinityAds = {
    CONFIG,
    init,
    showRewarded,
    isRewardedAvailable: gamConfigured,
    isDisplayConfigured: adsenseConfigured
  };
})();
