(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  let deferredInstallPrompt = null;

  function init() {
    registerServiceWorker();
    bindInstallPrompt();
    bindConnectivityState();
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    try {
      await navigator.serviceWorker.register("./sw.js", {
        scope: "./",
      });
    } catch (error) {
      console.warn("Service worker registration failed:", error);
    }
  }

  function bindInstallPrompt() {
    const button = document.getElementById("installButton");

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      button?.classList.remove("is-hidden");
    });

    button?.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        return;
      }

      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;

      deferredInstallPrompt = null;
      button.classList.add("is-hidden");
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      button?.classList.add("is-hidden");
    });
  }

  function bindConnectivityState() {
    const status = document.getElementById("networkStatus");

    function render() {
      const offline = !navigator.onLine;

      status?.classList.toggle("is-hidden", !offline);

      if (status) {
        status.textContent =
          window.EX_APP.i18n?.getLanguage() === "en"
            ? "Offline"
            : "Frakoblet";
      }
    }

    window.addEventListener("online", render);
    window.addEventListener("offline", render);
    window.addEventListener("exapp:languagechange", render);

    render();
  }

  window.EX_APP.pwaService = {
    init,
  };
})();
