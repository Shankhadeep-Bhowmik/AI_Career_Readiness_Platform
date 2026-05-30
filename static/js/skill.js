/**
 * AI Career Readiness Platform - Skill Assessment JavaScript
 * Dynamic skill form, API submit, AI results and radar chart
 */

let radarChart = null;
const userSkills = {};



document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initLogout();
  initSkillForm();
  initAnalyzeButton();
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
 * Dynamic skill form - add/remove skills
 */
function initSkillForm() {
  const addSkillBtn = document.getElementById("addSkillBtn");
  const addSkillForm = document.getElementById("addSkillForm");
  const confirmAddBtn = document.getElementById("confirmAddBtn");

  addSkillBtn.addEventListener("click", function () {
    addSkillForm.style.display = addSkillForm.style.display === "none" ? "block" : "none";
    document.getElementById("skillNameInput").focus();
  });

  confirmAddBtn.addEventListener("click", addSkill);

  document.getElementById("skillNameInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addSkill();
  });
  document.getElementById("skillLevelInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addSkill();
  });
}

function addSkill() {
  const nameInput = document.getElementById("skillNameInput");
  const levelInput = document.getElementById("skillLevelInput");
  const errorMsg = document.getElementById("skillInputError");

  const name = nameInput.value.trim();
  const level = parseInt(levelInput.value, 10);

  if (!name || isNaN(level) || level < 1 || level > 10) {
    errorMsg.style.display = "block";
    return;
  }
  errorMsg.style.display = "none";

  userSkills[name] = level;
  renderSkillsList();

  nameInput.value = "";
  levelInput.value = "";
  nameInput.focus();

  document.getElementById("addSkillForm").style.display = "none";
  updateProgress();
}

function getLevelColor(level) {
  if (level <= 3) return "#ef4444";
  if (level <= 6) return "#f59e0b";
  return "#16a34a";
}

function renderSkillsList() {
  const list = document.getElementById("skillsList");

  if (Object.keys(userSkills).length === 0) {
    list.innerHTML = '<p class="text-muted" id="emptyMsg" style="font-size:0.9rem;">No skills added yet. Click "Add Skill" to start.</p>';
    return;
  }

  list.innerHTML = "";
  Object.keys(userSkills).forEach(function (name) {
    const level = userSkills[name];
    const color = getLevelColor(level);
    const div = document.createElement("div");
    div.className = "skill-added-item";
    div.innerHTML =
      '<span class="skill-badge">' + name + '</span>' +
      '<span class="skill-level">Level: <strong style="color:' + color + '">' + level + ' / 10</strong></span>' +
      '<button class="btn-remove" onclick="removeSkill(\'' + name.replace(/'/g, "\\'") + '\')" title="Remove"><i class="fa-solid fa-xmark"></i></button>';
    list.appendChild(div);
  });
}

function removeSkill(name) {
  delete userSkills[name];
  renderSkillsList();
  updateProgress();
}

/**
 * Progress bar based on number of skills added
 */
function updateProgress() {
  const count = Object.keys(userSkills).length;
  const percent = count === 0 ? 0 : Math.min(100, count * 10);

  const fill = document.getElementById("progressFill");
  const percentText = document.getElementById("progressPercent");
  if (fill) fill.style.width = percent + "%";
  if (percentText) percentText.textContent = percent + "%";
}

/**
 * Collect skill data for API
 */
function collectSkillData() {
  return {
    technical: userSkills,
    soft: {},
    domain: { field: "", years: "", certifications: "", projects: 0 },
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
    if (Object.keys(userSkills).length === 0) {
      alert("Please add at least one skill before analyzing.");
      return;
    }

    const skillData = collectSkillData();

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> AI is Analyzing...';
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
        alert("AI Error: "+(data.message || "Failed to analyze skills. Please try again later."));
        resetFormUI();
      }
    } catch (err) {
      alert("Could not connect to AI service. Showing mock analysis instead.");
      resetFormUI();
    }
  });

  function resetFormUI() {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze My Skills';
    if (formCard) formCard.classList.remove("assessment-form-hidden");
    document.getElementById("aiLoading").style.display = "none";
  }
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

  const radarLabels = Object.keys(allSkills).slice(0, 5);
  const yourSkills = radarLabels.map(function (k) { return allSkills[k]; });
  const industry = radarLabels.map(function (k) { return industryRequirements[k] || 8; });

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