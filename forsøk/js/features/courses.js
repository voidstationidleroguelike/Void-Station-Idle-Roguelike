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

      const copy = document.createElement("span");
      copy.className = "course-card__copy";

      const title = document.createElement("strong");
      title.textContent =
        course.title[language] ||
        course.title.no ||
        course.id;

      const subtitle = document.createElement("small");
      subtitle.className = "course-card__subtitle";
      subtitle.textContent =
        course.subtitle?.[language] ||
        course.subtitle?.no ||
        "";

      copy.append(title);

      if (subtitle.textContent) {
        copy.append(subtitle);
      }

      const external = document.createElement("span");
      external.className = "course-card__external";
      external.textContent = "↗";

      link.append(copy, external);
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
