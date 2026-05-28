/**
 * AI Career Readiness Platform - Skill Assessment JavaScript
 * Sliders, tabs, API submit, AI results and radar chart
 */

let radarChart = null;

// Industry required levels for gap analysis (mock AI)
const industryRequirements = {
  "Python Programming": 9,
  "Web Development HTML CSS": 8,
  "Database SQL": 8,
  "Data Structures": 8,
  "Git and Version Control": 7,
  Communication: 8,
  Teamwork: 7,
  "Problem Solving": 9,
  "Time Management": 7,
  Leadership: 6,
};

document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initLogout();
  initSliders();
  initTabs();
  initDomainFields();
  initAnalyzeButton();
  updateProgress();
});

/**
 * Sidebar toggle (same as dashboard)
 */
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
 * Get color class based on slider value 1-10
 */
function getLevelClass(value) {
  const num = parseInt(value, 10);
  if (num <= 3) return "level-low";
  if (num <= 6) return "level-medium";
  return "level-high";
}

/**
 * Update slider fill gradient and badge color
 */
function updateSliderUI(rangeInput) {
  const value = rangeInput.value;
  const levelClass = getLevelClass(value);
  const valueDisplay = document.getElementById("val-" + rangeInput.id);

  rangeInput.classList.remove("level-low", "level-medium", "level-high");
  rangeInput.classList.add(levelClass);

  if (valueDisplay) {
    valueDisplay.textContent = value;
    valueDisplay.classList.remove("level-low", "level-medium", "level-high");
    valueDisplay.classList.add(levelClass);
  }

  // Update slider track fill color
  const percent = ((value - 1) / 9) * 100;
  const color =
    levelClass === "level-low"
      ? "#ef4444"
      : levelClass === "level-medium"
        ? "#f59e0b"
        : "#16a34a";
  rangeInput.style.background =
    "linear-gradient(to right, " + color + " " + percent + "%, #e2e8f0 " + percent + "%)";

  rangeInput.dataset.touched = "true";
  updateProgress();
}

/**
 * Initialize all skill range sliders
 */
function initSliders() {
  document.querySelectorAll(".skill-range").forEach(function (slider) {
    updateSliderUI(slider);
    slider.addEventListener("input", function () {
      updateSliderUI(slider);
    });
  });
}

/**
 * Bootstrap tab switching - mark tab as visited for progress
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('#skillTabs button[data-bs-toggle="tab"]');
  tabButtons.forEach(function (btn) {
    btn.addEventListener("shown.bs.tab", function () {
      btn.dataset.visited = "true";
      updateProgress();
    });
  });
  // First tab counts as visited on load
  if (tabButtons[0]) tabButtons[0].dataset.visited = "true";
}

function initDomainFields() {
  ["domainField", "domainYears", "domainCerts", "domainProjects"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateProgress);
      el.addEventListener("change", updateProgress);
    }
  });
}

/**
 * Calculate assessment completion percentage
 */
function updateProgress() {
  const totalSteps = 19;
  let completed = 0;

  document.querySelectorAll(".skill-range").forEach(function (s) {
    if (s.dataset.touched === "true" || s.value) completed++;
  });

  const field = document.getElementById("domainField");
  const years = document.getElementById("domainYears");
  const certs = document.getElementById("domainCerts");
  const projects = document.getElementById("domainProjects");

  if (field && field.value) completed++;
  if (years && years.value !== "") completed++;
  if (certs && certs.value.trim()) completed++;
  if (projects && projects.value !== "") completed++;

  const percent = Math.min(100, Math.round((completed / totalSteps) * 100));

  const fill = document.getElementById("progressFill");
  const percentText = document.getElementById("progressPercent");
  if (fill) fill.style.width = percent + "%";
  if (percentText) percentText.textContent = percent + "%";
}

/**
 * Collect all form data for API
 */
function collectSkillData() {
  const technical = {};
  const soft = {};

  document.querySelectorAll("#technical .skill-range").forEach(function (s) {
    technical[s.dataset.skillName] = parseInt(s.value, 10);
  });

  document.querySelectorAll("#soft .skill-range").forEach(function (s) {
    soft[s.dataset.skillName] = parseInt(s.value, 10);
  });

  return {
    technical: technical,
    soft: soft,
    domain: {
      field: document.getElementById("domainField").value,
      years: document.getElementById("domainYears").value,
      certifications: document.getElementById("domainCerts").value.trim(),
      projects: parseInt(document.getElementById("domainProjects").value, 10) || 0,
    },
  };
}

/**
 * Analyze button click - POST to API or use mock AI
 */
function initAnalyzeButton() {
  const btn = document.getElementById("analyzeBtn");
  const formCard = document.getElementById("assessmentFormCard");

  if (!btn) return;

  btn.addEventListener("click", async function () {
    const skillData = collectSkillData();

    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Analyzing...';
    if (formCard) formCard.classList.add("assessment-form-hidden");

    showLoadingState();

    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skillData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        displayResults(data);
      } else {
        displayResults(generateMockAnalysis(skillData));
      }
    } catch (err) {
      displayResults(generateMockAnalysis(skillData));
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze My Skills';
    if (formCard) formCard.classList.remove("assessment-form-hidden");
  });
}

function showLoadingState() {
  const resultsSection = document.getElementById("resultsSection");
  const loadingBlock = document.getElementById("aiLoading");
  const resultsContent = document.getElementById("resultsContent");

  resultsSection.classList.add("show");
  loadingBlock.style.display = "block";
  resultsContent.style.display = "none";
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Mock AI analysis when backend API is not available
 */
function generateMockAnalysis(skillData) {
  const allSkills = { ...skillData.technical, ...skillData.soft };
  const gaps = [];

  Object.keys(allSkills).forEach(function (name) {
    const current = allSkills[name];
    const required = industryRequirements[name] || 8;
    const gap = required - current;

    if (gap > 0) {
      let priority = "low";
      if (gap >= 4) priority = "high";
      else if (gap >= 2) priority = "medium";

      gaps.push({
        skill: name,
        priority: priority,
        current: current,
        required: required,
        message:
          "You are at level " +
          current +
          " but industry expects " +
          required +
          ". Focus on improving this skill.",
      });
    }
  });

  gaps.sort(function (a, b) {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  const radarLabels = [
    "Python",
    "Web Dev",
    "Database",
    "Communication",
    "Problem Solving",
  ];
  const yourSkills = [
    allSkills["Python Programming"] || 5,
    allSkills["Web Development HTML CSS"] || 5,
    allSkills["Database SQL"] || 5,
    allSkills["Communication"] || 5,
    allSkills["Problem Solving"] || 5,
  ];
  const industry = [9, 8, 8, 8, 9];

  let totalScore = 0;
  let count = 0;
  Object.keys(allSkills).forEach(function (k) {
    const req = industryRequirements[k] || 8;
    totalScore += Math.min(100, Math.round((allSkills[k] / req) * 100));
    count++;
  });
  const careerScore = count ? Math.round(totalScore / count) : 0;

  return {
    success: true,
    careerScore: careerScore,
    radar: {
      labels: radarLabels,
      yourSkills: yourSkills,
      industryRequired: industry,
    },
    gaps: gaps,
  };
}

/**
 * Display AI analysis results
 */
function displayResults(data) {
  const loadingBlock = document.getElementById("aiLoading");
  const resultsContent = document.getElementById("resultsContent");

  loadingBlock.style.display = "none";
  resultsContent.style.display = "block";

  document.getElementById("readinessScore").textContent = data.careerScore || 0;

  renderGapList(data.gaps || []);
  initRadarChart(data.radar);
}

function renderGapList(gaps) {
  const list = document.getElementById("gapList");
  list.innerHTML = "";

  if (!gaps.length) {
    list.innerHTML =
      '<li class="gap-item priority-low"><div class="gap-content"><h4>Great job!</h4><p>No major skill gaps found. Keep practicing to stay industry ready.</p></div></li>';
    return;
  }

  gaps.forEach(function (gap) {
    const li = document.createElement("li");
    li.className = "gap-item priority-" + gap.priority;
    li.innerHTML =
      '<span class="gap-priority-badge">' +
      gap.priority +
      "</span>" +
      '<div class="gap-content"><h4>' +
      gap.skill +
      "</h4><p>" +
      gap.message +
      " (Current: " +
      gap.current +
      " / Required: " +
      gap.required +
      ")</p></div>";
    list.appendChild(li);
  });
}

/**
 * Chart.js radar chart - your skills vs industry
 */
function initRadarChart(radarData) {
  const canvas = document.getElementById("radarChart");
  if (!canvas || !radarData) return;

  if (radarChart) radarChart.destroy();

  radarChart = new Chart(canvas, {
    type: "radar",
    data: {
      labels: radarData.labels,
      datasets: [
        {
          label: "Your Skills",
          data: radarData.yourSkills,
          backgroundColor: "rgba(37, 99, 235, 0.2)",
          borderColor: "#2563eb",
          borderWidth: 2,
          pointBackgroundColor: "#2563eb",
        },
        {
          label: "Industry Requirement",
          data: radarData.industryRequired,
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          borderColor: "#ef4444",
          borderWidth: 2,
          pointBackgroundColor: "#ef4444",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 10,
          ticks: { stepSize: 2 },
        },
      },
      plugins: {
        legend: { position: "top" },
      },
    },
  });
}
