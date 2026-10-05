(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  const knownRoutes = ["home", "guide", "marking", "poster", "courses"];

  let currentRoute = "home";

  function getRoute() {
    return currentRoute;
  }

  function go(route) {
    if (!knownRoutes.includes(route)) {
      route = "home";
    }

    document.querySelectorAll(".view").forEach((view) => {
      view.classList.remove("view--active");
    });

    const target = document.getElementById(`view-${route}`);
    target?.classList.add("view--active");

    currentRoute = route;

    updateTopbar();

    window.dispatchEvent(
      new CustomEvent("exapp:routechange", {
        detail: { route },
      })
    );
  }

  function back() {
    go("home");
  }

  function updateTopbar() {
    const title = document.getElementById("topbarTitle");
    const backButton = document.getElementById("backButton");
    const i18n = window.EX_APP.i18n;

    if (title) {
      title.textContent = i18n.t(`route.${currentRoute}`);
    }

    backButton?.classList.toggle("is-hidden", currentRoute === "home");
  }

  window.EX_APP.router = {
    getRoute,
    go,
    back,
    updateTopbar,
  };
})();
