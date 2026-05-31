/**
 * AI Career Readiness Platform - Learning Roadmap JavaScript
 * Fetch roadmap, mark complete, regenerate, YouTube thumbnails
 */

let roadmapProgressChart = null;
let roadmapData = { steps: [] };

// Local storage key when API is not available
const COMPLETED_STORAGE_KEY = "roadmap_completed_steps";

// No default data - AI generates roadmap from user skills

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
      document.body.style.overflow = sidebar.classList.contains("open")
        ? "hidden"
        : "";
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  document
    .querySelectorAll(".sidebar-nav a:not(.logout-link)")
    .forEach(function (link) {
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
    '<div class="roadmap-loading"><div class="spinner-border text-primary"></div><p class="mt-2">AI is generating your personalized roadmap...</p></div>';

  try {
    const response = await fetch("/api/roadmap");
    const data = await response.json();

    if (response.ok && data.success) {
      // Show detected career path
      if (data.careerPath) {
        const header = document.querySelector(".roadmap-page-header p");
        if (header) {
          header.innerHTML = `AI detected: <strong>${data.careerPath}</strong> — Roadmap generated for 2026-2027`;
        }
      }
      renderPhaseRoadmap(data.phases || []);
      updateProgressFromPhases(data.phases || []);
    } else {
      useDefaultRoadmap();
    }
  } catch (err) {
    useDefaultRoadmap();
  }
}
function useDefaultRoadmap() {
  const timeline = document.getElementById("roadmapTimeline");
  timeline.innerHTML = `
    <div class="text-center p-4">
      <i class="fa-solid fa-triangle-exclamation fa-2x text-warning mb-3"></i>
      <p class="text-muted">Please complete your 
      <a href="/skills">Skill Assessment</a> first 
      so AI can generate your personalized roadmap!</p>
    </div>`;
  updateProgressUI({
    total: 0,
    completed: 0,
    remaining: 0,
    percent: 0,
    daysLeft: 0,
  });
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
  const badge = document.getElementById("completionBadge");
  if (badge) badge.textContent = progress.percent + "% Complete";
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
 * Render roadmap as phases
 * Phase 1 - Frontend: HTML, CSS, JS
 * Phase 2 - Modern Frontend: React, TypeScript
 */
function renderPhaseRoadmap(phases) {
  const timeline = document.getElementById("roadmapTimeline");
  timeline.innerHTML = "";

  let globalSkillNumber = 1;

  phases.forEach(function (phase) {
    const phaseEl = document.createElement("div");
    phaseEl.className = "roadmap-phase";
    phaseEl.innerHTML = `
      <div class="phase-header">
        <span class="phase-number">Phase ${phase.phaseNumber}</span>
        <h3 class="phase-title">${phase.phaseTitle}</h3>
      </div>
      <div class="phase-skills" id="phase-skills-${phase.phaseNumber}"></div>
    `;
    timeline.appendChild(phaseEl);

    const skillsContainer = phaseEl.querySelector(
      `#phase-skills-${phase.phaseNumber}`,
    );

    phase.skills.forEach(function (skill) {
      const diffClass = (skill.difficulty || "beginner").toLowerCase();
      const skillEl = document.createElement("div");
      skillEl.className = "skill-step";
      skillEl.innerHTML = `
        <div class="skill-number">${globalSkillNumber}</div>
        <div class="skill-card">
          <div class="skill-card-top">
            <div class="skill-icon-name">
              <i class="${skill.icon || "fa-solid fa-code"}"></i>
              <h4>${skill.skillName}</h4>
            </div>
            <div class="skill-badges">
              <span class="difficulty-badge ${diffClass}">${skill.difficulty}</span>
              <span class="time-estimate">
                <i class="fa-regular fa-clock"></i> ${skill.estimatedTime}
              </span>
            </div>
          </div>
          <p class="skill-description">${skill.description}</p>
          <p class="why-important">
            <i class="fa-solid fa-lightbulb"></i>
            <strong>2026-2027:</strong> ${skill.whyImportant}
          </p>
          <div class="mark-complete-wrap">
            <input type="checkbox" id="complete-${skill.id}" data-skill-id="${skill.id}">
            <label for="complete-${skill.id}">Mark as complete</label>
          </div>
        </div>
      `;

      const checkbox = skillEl.querySelector('input[type="checkbox"]');
      checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
          skillEl.classList.add("completed");
          updateProgressFromDOM();
        }
      });

      skillsContainer.appendChild(skillEl);
      globalSkillNumber++;
    });
  });
}

/**
 * Count completed checkboxes and update progress
 */
function updateProgressFromDOM() {
  const total = document.querySelectorAll(".mark-complete-wrap input").length;
  const completed = document.querySelectorAll(
    ".mark-complete-wrap input:checked",
  ).length;
  const remaining = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  updateProgressUI({
    total,
    completed,
    remaining,
    percent,
    daysLeft: remaining * 7,
  });
}

/**
 * Set initial progress from phases data
 */
function updateProgressFromPhases(phases) {
  let total = 0;
  phases.forEach((p) => (total += (p.skills || []).length));
  updateProgressUI({
    total,
    completed: 0,
    remaining: total,
    percent: 0,
    daysLeft: total * 7,
  });
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

        if (response.ok && data.success && data.phases) {
          localStorage.removeItem(COMPLETED_STORAGE_KEY);
          renderPhaseRoadmap(data.phases);
          updateProgressFromPhases(data.phases);
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
/**
 * Download roadmap as PDF
 */
function downloadRoadmapPDF() {
  const printContent = document.getElementById("roadmapTimeline").innerHTML;
  const studentName = document.querySelector(".header-student-name")?.textContent || "Student";
  const careerPath = document.querySelector(".roadmap-page-header p strong")?.textContent || "Career Roadmap";

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Learning Roadmap - ${studentName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
        h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .roadmap-phase { margin-bottom: 20px; }
        .phase-header { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        .phase-number { background: #2563eb; color: white; padding: 2px 10px; border-radius: 20px; font-size: 11px; }
        .phase-title { font-size: 14px; font-weight: 700; margin: 0; }
        .skill-step { display: flex; gap: 10px; margin-bottom: 10px; padding-left: 10px; }
        .skill-number { background: #f1f5f9; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .skill-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
        h4 { margin: 0 0 4px 0; font-size: 13px; }
        .skill-description { font-size: 12px; color: #475569; margin: 4px 0; }
        .why-important { font-size: 11px; color: #7c3aed; margin: 4px 0; }
        .difficulty-badge { font-size: 10px; padding: 2px 6px; background: #dbeafe; color: #1e40af; border-radius: 10px; }
        .mark-complete-wrap, .phase-skills { display: block; }
        .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
      </style>
    </head>
    <body>
      <h1>AI Career Readiness Platform</h1>
      <p style="color:#64748b; font-size:13px;">
        <strong>Student:</strong> ${studentName} &nbsp;|&nbsp;
        <strong>Career Path:</strong> ${careerPath} &nbsp;|&nbsp;
        <strong>Generated for:</strong> 2026-2027 Industry Requirements
      </p>
      <br/>
      ${printContent}
      <div class="footer">
        Generated by AI Career Readiness Platform | ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}