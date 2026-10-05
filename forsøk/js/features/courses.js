(function () {
  "use strict";

  window.EX_APP = window.EX_APP || {};

  function init() {
    render();

    window.addEventListener("exapp:languagechange", render);
  }

  function render() {
    const language = window.EX_APP.i18n.getLanguage();
    const list = document.getElementById("courseList");
    const allCourses = document.getElementById("allCoursesLink");

    if (!list) {
      return;
    }

    list.innerHTML = "";

    window.EX_APP.courses.forEach((course) => {
      const link = document.createElement("a");

      link.className = "course-card";
      link.href = course.url;
      link.target = "_blank";
      link.rel = "noopener";

      const title = document.createElement("strong");
      title.textContent =
        course.title[language] ||
        course.title.no ||
        course.id;

      const external = document.createElement("span");
      external.textContent = "↗";

      link.append(title, external);
      list.appendChild(link);
    });

    if (allCourses) {
      allCourses.href =
        window.EX_APP.config.externalLinks.allCourses;
    }
  }

  window.EX_APP.courseFeature = {
    init,
    render,
  };
})();
