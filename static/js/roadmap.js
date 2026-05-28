/**
 * AI Career Readiness Platform - Learning Roadmap JavaScript
 * Fetch roadmap, mark complete, regenerate, YouTube thumbnails
 */

let roadmapProgressChart = null;
let roadmapData = { steps: [] };

// Local storage key when API is not available
const COMPLETED_STORAGE_KEY = "roadmap_completed_steps";

// Default mock roadmap for demo / when API unavailable
const defaultRoadmapData = {
  success: true,
  completionPercent: 20,
  stats: {
    completed: 1,
    remaining: 4,
    daysLeft: 28,
  },
  steps: [
    {
      id: 1,
      topic: "Python Fundamentals",
      icon: "fa-brands fa-python",
      description:
        "Learn variables, loops, functions, and OOP basics. Build small scripts to strengthen your foundation.",
      estimatedTime: "2 weeks",
      difficulty: "Beginner",
      status: "current",
      resources: {
        youtube: [
          {
            id: "rfscVS0vtbw",
            title: "Python Full Course for Beginners",
            url: "https://www.youtube.com/watch?v=rfscVS0vtbw",
          },
          {
            id: "_uQrJ0TkZlc",
            title: "Python Tutorial for Beginners",
            url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
          },
        ],
        articles: [
          {
            title: "Python Official Tutorial",
            url: "https://docs.python.org/3/tutorial/",
          },
        ],
        exercises: [
          "Solve 10 basic Python problems on HackerRank",
          "Build a calculator CLI app",
        ],
      },
    },
    {
      id: 2,
      topic: "SQL and Databases",
      icon: "fa-solid fa-database",
      description:
        "Master SELECT queries, joins, and database design. Practice with MySQL or PostgreSQL.",
      estimatedTime: "2 weeks",
      difficulty: "Beginner",
      status: "upcoming",
      resources: {
        youtube: [
          {
            id: "HXV3zeQKqGY",
            title: "SQL Tutorial for Beginners",
            url: "https://www.youtube.com/watch?v=HXV3zeQKqGY",
          },
        ],
        articles: [
          { title: "W3Schools SQL Tutorial", url: "https://www.w3schools.com/sql/" },
        ],
        exercises: ["Create a student database schema", "Write 15 practice SQL queries"],
      },
    },
    {
      id: 3,
      topic: "Web Development HTML CSS",
      icon: "fa-brands fa-html5",
      description:
        "Build responsive web pages with HTML5 and CSS3. Learn Flexbox and basic layouts.",
      estimatedTime: "3 weeks",
      difficulty: "Intermediate",
      status: "upcoming",
      resources: {
        youtube: [
          {
            id: "G3eDSnvwkdU",
            title: "HTML & CSS Full Course",
            url: "https://www.youtube.com/watch?v=G3eDSnvwkdU",
          },
        ],
        articles: [
          { title: "MDN Web Docs HTML", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
        ],
        exercises: ["Clone a landing page design", "Build a personal portfolio page"],
      },
    },
    {
      id: 4,
      topic: "Data Structures and Algorithms",
      icon: "fa-solid fa-sitemap",
      description:
        "Study arrays, linked lists, stacks, queues, and basic sorting algorithms for interviews.",
      estimatedTime: "4 weeks",
      difficulty: "Intermediate",
      status: "upcoming",
      resources: {
        youtube: [
          {
            id: "8hly31xKli0",
            title: "Data Structures Easy to Advanced",
            url: "https://www.youtube.com/watch?v=8hly31xKli0",
          },
        ],
        articles: [
          { title: "VisuAlgo Algorithm Visualizations", url: "https://visualgo.net/en" },
        ],
        exercises: ["Solve 20 LeetCode easy problems", "Implement a linked list from scratch"],
      },
    },
    {
      id: 5,
      topic: "Interview Preparation",
      icon: "fa-solid fa-microphone",
      description:
        "Practice behavioral and technical questions. Use AI mock interviews on this platform.",
      estimatedTime: "2 weeks",
      difficulty: "Advanced",
      status: "upcoming",
      resources: {
        youtube: [
          {
            id: "01cExBmiOfE",
            title: "Technical Interview Tips",
            url: "https://www.youtube.com/watch?v=01cExBmiOfE",
          },
        ],
        articles: [
          { title: "STAR Method for Behavioral Questions", url: "https://www.themuse.com/advice/star-interview-method" },
        ],
        exercises: [
          "Complete 5 AI mock interviews on the platform",
          "Prepare answers for 10 common HR questions",
        ],
      },
    },
  ],
};

document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initLogout();
  loadRoadmap();
  initRegenerateButton();
});

function initSidebar() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", function () {
      sidebar.classList.toggle("open");
      sidebarOverlay.classList.toggle("show");
      document.body.style.overflow = sidebar.classList.contains("open") ? "hidden" : "";
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  document.querySelectorAll(".sidebar-nav a:not(.logout-link)").forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth < 992) closeSidebar();
    });
  });
}

function initLogout() {
  ["logoutBtn", "logoutBtnMobile"].forEach(function (id) {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "/logout";
      });
    }
  });
}

/**
 * Get completed step IDs from localStorage (fallback)
 */
function getLocalCompletedIds() {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalCompletedIds(ids) {
  localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(ids));
}

/**
 * Apply completed status from storage to steps
 */
function mergeCompletedStatus(steps) {
  const completedIds = getLocalCompletedIds();
  let foundCurrent = false;

  return steps.map(function (step) {
    let status = step.status;

    if (completedIds.includes(step.id)) {
      status = "completed";
    } else if (!foundCurrent) {
      status = "current";
      foundCurrent = true;
    } else {
      status = "upcoming";
    }

    return { ...step, status: status };
  });
}

/**
 * Fetch roadmap from Flask API
 */
async function loadRoadmap() {
  const timeline = document.getElementById("roadmapTimeline");
  timeline.innerHTML =
    '<div class="roadmap-loading"><div class="spinner-border text-primary"></div><p class="mt-2">Loading your roadmap...</p></div>';

  try {
    const response = await fetch("/api/roadmap");
    const data = await response.json();

    if (response.ok && data.success) {
      roadmapData.steps = mergeCompletedStatus(data.steps || []);
      renderRoadmap(roadmapData.steps);
      updateProgressUI(calculateProgress(roadmapData.steps));
    } else {
      useDefaultRoadmap();
    }
  } catch (err) {
    useDefaultRoadmap();
  }
}

function useDefaultRoadmap() {
  const steps = mergeCompletedStatus(defaultRoadmapData.steps);
  roadmapData.steps = steps;
  renderRoadmap(steps);
  updateProgressUI(calculateProgress(steps));
}

function calculateProgress(steps) {
  const total = steps.length;
  const completed = steps.filter(function (s) {
    return s.status === "completed";
  }).length;
  const remaining = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const daysLeft = remaining * 7;

  return { total, completed, remaining, percent, daysLeft };
}

function updateProgressUI(progress) {
  document.getElementById("completionBadge").textContent =
    progress.percent + "% Complete";
  document.getElementById("statCompleted").textContent = progress.completed;
  document.getElementById("statRemaining").textContent = progress.remaining;
  document.getElementById("statDaysLeft").textContent = progress.daysLeft;
  document.getElementById("chartPercent").textContent = progress.percent + "%";

  initProgressChart(progress.percent);
}

function initProgressChart(percent) {
  const canvas = document.getElementById("roadmapProgressChart");
  if (!canvas) return;

  const remaining = 100 - percent;

  if (roadmapProgressChart) {
    roadmapProgressChart.destroy();
  }

  roadmapProgressChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Done", "Left"],
      datasets: [
        {
          data: [percent, remaining],
          backgroundColor: ["#16a34a", "#e2e8f0"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "70%",
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 800 },
    },
  });
}

/**
 * Build YouTube thumbnail URL from video ID (no API key needed)
 */
function getYouTubeThumbnail(videoId) {
  return "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg";
}

/**
 * Render vertical timeline with all steps
 */
function renderRoadmap(steps) {
  const timeline = document.getElementById("roadmapTimeline");
  timeline.innerHTML = "";

  steps.forEach(function (step, index) {
    const statusClass =
      step.status === "completed"
        ? "completed"
        : step.status === "current"
          ? "current"
          : "upcoming";

    const diffClass = (step.difficulty || "Beginner").toLowerCase();
    const isChecked = step.status === "completed";

    const stepEl = document.createElement("div");
    stepEl.className = "timeline-step " + statusClass;
    stepEl.dataset.stepId = step.id;

    stepEl.innerHTML =
      '<div class="step-circle">' +
      (step.status === "completed" ? '<i class="fa-solid fa-check"></i>' : index + 1) +
      "</div>" +
      '<div class="step-card">' +
      '<div class="step-card-header">' +
      '<div class="step-topic">' +
      '<div class="step-topic-icon"><i class="' +
      (step.icon || "fa-solid fa-book") +
      '"></i></div>' +
      "<h4>" +
      step.topic +
      "</h4></div>" +
      '<div class="step-meta">' +
      '<span class="difficulty-badge ' +
      diffClass +
      '">' +
      step.difficulty +
      "</span>" +
      '<span class="time-estimate"><i class="fa-regular fa-clock"></i>' +
      step.estimatedTime +
      "</span></div></div>" +
      '<p class="step-description">' +
      step.description +
      "</p>" +
      buildResourcesHTML(step.resources) +
      '<div class="mark-complete-wrap">' +
      '<input type="checkbox" id="complete-' +
      step.id +
      '" ' +
      (isChecked ? "checked disabled" : "") +
      ' data-step-id="' +
      step.id +
      '">' +
      '<label for="complete-' +
      step.id +
      '">Mark as complete</label></div></div>';

    timeline.appendChild(stepEl);

    const checkbox = stepEl.querySelector('input[type="checkbox"]');
    if (checkbox && !isChecked) {
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          markStepComplete(step.id);
        }
      });
    }
  });
}

/**
 * Build resources HTML with YouTube thumbnails, articles, exercises
 */
function buildResourcesHTML(resources) {
  if (!resources) return "";

  let html = '<div class="resources-section">';
  html += '<h5><i class="fa-brands fa-youtube"></i> Video Resources</h5>';

  if (resources.youtube && resources.youtube.length) {
    html += '<div class="youtube-grid">';
    resources.youtube.forEach(function (video) {
      const thumb = getYouTubeThumbnail(video.id);
      html +=
        '<a href="' +
        video.url +
        '" target="_blank" rel="noopener" class="youtube-card">' +
        '<img src="' +
        thumb +
        '" alt="' +
        video.title +
        '" class="youtube-thumb" loading="lazy">' +
        '<div class="youtube-card-title">' +
        video.title +
        "</div></a>";
    });
    html += "</div>";
  }

  if (resources.articles && resources.articles.length) {
    html += '<h5><i class="fa-solid fa-newspaper"></i> Articles</h5><ul class="resource-links">';
    resources.articles.forEach(function (article) {
      html +=
        '<li><a href="' +
        article.url +
        '" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i>' +
        article.title +
        "</a></li>";
    });
    html += "</ul>";
  }

  if (resources.exercises && resources.exercises.length) {
    html +=
      '<h5><i class="fa-solid fa-dumbbell"></i> Practice Exercises</h5><ul class="exercise-list">';
    resources.exercises.forEach(function (ex) {
      html += "<li>" + ex + "</li>";
    });
    html += "</ul>";
  }

  html += "</div>";
  return html;
}

/**
 * Mark step complete - PUT /api/roadmap/complete
 */
async function markStepComplete(stepId) {
  try {
    const response = await fetch("/api/roadmap/complete", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId: stepId }),
    });

    if (!response.ok) {
      throw new Error("API unavailable");
    }
  } catch (err) {
    const ids = getLocalCompletedIds();
    if (!ids.includes(stepId)) {
      ids.push(stepId);
      saveLocalCompletedIds(ids);
    }
  }

  roadmapData.steps = mergeCompletedStatus(roadmapData.steps);
  renderRoadmap(roadmapData.steps);
  updateProgressUI(calculateProgress(roadmapData.steps));
}

/**
 * Regenerate roadmap - POST /api/roadmap/regenerate
 */
function initRegenerateButton() {
  const buttons = document.querySelectorAll(".btn-regenerate");

  buttons.forEach(function (btn) {
    btn.addEventListener("click", async function () {
      btn.disabled = true;
      btn.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Regenerating...';

      try {
        const response = await fetch("/api/roadmap/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();

        if (response.ok && data.success && data.steps) {
          localStorage.removeItem(COMPLETED_STORAGE_KEY);
          roadmapData.steps = mergeCompletedStatus(data.steps);
          renderRoadmap(roadmapData.steps);
          updateProgressUI(calculateProgress(roadmapData.steps));
        } else {
          localStorage.removeItem(COMPLETED_STORAGE_KEY);
          useDefaultRoadmap();
        }
      } catch (err) {
        localStorage.removeItem(COMPLETED_STORAGE_KEY);
        useDefaultRoadmap();
      }

      btn.disabled = false;
      btn.innerHTML =
        '<i class="fa-solid fa-arrows-rotate"></i> Regenerate Roadmap with AI';
    });
  });
}
