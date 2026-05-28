
// Chart instances stored globally so we can update them
let careerScoreChart = null;
let skillsBarChart = null;

// Default data used if API is not available yet
const defaultDashboardData = {
  success: true,
  student: {
    // The name and course can be dynamically filled from the backend session data when available. For now, we use placeholders.
    name: "USER",
    course: "SOME_COURSE",
    initials: "",
  },
  stats: {
    skillsAssessed: 0,
    roadmapProgress: 0,
    interviewsPracticed: 0,
    daysActive: 0,
  },
  careerScore: 0,
  skills: [
    { name: "Python", current: 0},
    { name: "Communication", current: 0},
    { name: "Problem Solving", current: 0},
    { name: "HTML/CSS", current: 0},
    { name: "Database", current: 0},
  ],
  recentActivity: [
    {
      icon: "fa-clipboard-check",
      text: "Completed skill assessment",
      time: "2 hours ago",
    },
    {
      icon: "fa-route",
      text: "Viewed Python roadmap",
      time: "1 day ago",
    },
    {
      icon: "fa-microphone",
      text: "Practiced interview question",
      time: "2 days ago",
    },
    {
      icon: "fa-newspaper",
      text: "Read tech news article",
      time: "3 days ago",
    },
  ],
};

document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initLogout();
  loadDashboard();
});

/**
 * Toggle sidebar on mobile when hamburger is clicked
 */
function initSidebar() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", function () {
      if (!sidebar.classList.contains("open")) {
        openSidebar();
       } 
      //  else {
      //   closeSidebar();
      // }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  // Close sidebar when a nav link is clicked on mobile
  const navLinks = document.querySelectorAll(".sidebar-nav a:not(.logout-link)");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth < 992) {
        closeSidebar();
      }
    });
  });
}

/**
 * Handle logout - uses existing Flask /logout route
 */
function initLogout() {
  const logoutButtons = [
    document.getElementById("logoutBtn"),
    document.getElementById("logoutBtnMobile"),
  ];

  logoutButtons.forEach(function (btn) {
    if (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        // Uses existing Flask /logout route to clear session
        window.location.href = "/logout";
      });
    }
  });
}

/**
 * Fetch dashboard data from Flask backend
 */
async function loadDashboard() {
  try {
    const response = await fetch("/api/dashboard");
    const data = await response.json();

    if (response.ok && data.success) {
      renderDashboard(data);
    } else {
      renderDashboard(defaultDashboardData);
    }
  } catch (error) {
    // Use default data when API endpoint is not ready
    renderDashboard(defaultDashboardData);
  }
}

/**
 * Get initials from student name for avatar
 */
function getInitials(name) {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

/**
 * Populate all dashboard sections with data
 */
function renderDashboard(data) {
  const student = data.student || {};
  const stats = data.stats || {};
  const name = student.name || "Student";
  const initials = student.initials || getInitials(name);
  const course = student.course || "";
  const careerScore = data.careerScore || 0;
  const skills = data.skills || defaultDashboardData.skills;
  const activities = data.recentActivity || defaultDashboardData.recentActivity;

  // Update student name in all places
  setText("welcomeName", name);
  setText("headerStudentName", name);
  setText("sidebarStudentName", name);
  setText("sidebarCourse", course);
  setText("profileInitials", initials);
  setText("profileInitialsSidebar", initials);

  // Update stats cards
  setText("statSkillsAssessed", stats.skillsAssessed ?? 0);
  setText("statRoadmapProgress", (stats.roadmapProgress ?? 0) + "%");
  setText("statInterviews", stats.interviewsPracticed ?? 0);
  setText("statDaysActive", stats.daysActive ?? 0);

  // Update career score display
  setText("careerScoreValue", careerScore);

  // Build charts
  initCareerScoreChart(careerScore);
  initSkillsBarChart(skills);

  // Build recent activity list
  renderActivityList(activities);
}

function setText(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = value;
  }
}

/**
 * Circular progress chart for career readiness score (Chart.js doughnut)
 */
function initCareerScoreChart(score) {
  const canvas = document.getElementById("careerScoreChart");
  if (!canvas) return;

  const remaining = Math.max(0, 100 - score);

  if (careerScoreChart) {
    careerScoreChart.destroy();
  }

  careerScoreChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Score", "Remaining"],
      datasets: [
        {
          data: [score, remaining],
          backgroundColor: ["#ffffff", "rgba(255,255,255,0.25)"],
          borderWidth: 0,
          cutout: "75%",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      animation: {
        animateRotate: true,
        duration: 1200,
      },
    },
  });
}

/**
 * Horizontal bar chart for skill levels (current vs target)
 */
function initSkillsBarChart(skills) {
  const canvas = document.getElementById("skillsBarChart");
  if (!canvas) return;

  const labels = skills.map(function (s) {
    return s.name;
  });
  const currentLevels = skills.map(function (s) {
    return s.current;
  });
  const targetLevels = skills.map(function (s) {
    return s.target;
  });

  if (skillsBarChart) {
    skillsBarChart.destroy();
  }

  skillsBarChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Current Level",
          data: currentLevels,
          backgroundColor: "#2563eb",
          borderRadius: 6,
          barThickness: 14,
        },
        {
          label: "Target Level",
          data: targetLevels,
          backgroundColor: "#94a3b8",
          borderRadius: 6,
          barThickness: 14,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          max: 10,
          grid: { color: "#e2e8f0" },
          ticks: { stepSize: 2 },
        },
        y: {
          grid: { display: false },
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: { font: { family: "Poppins" } },
        },
      },
      animation: {
        duration: 1000,
      },
    },
  });
}

/**
 * Render recent activity list from backend data
 */
function renderActivityList(activities) {
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  activityList.innerHTML = "";

  if (!activities || activities.length === 0) {
    activityList.innerHTML =
      '<li class="activity-item"><p class="text-muted mb-0">No recent activity yet. Start exploring the platform!</p></li>';
    return;
  }

  activities.forEach(function (item) {
    const li = document.createElement("li");
    li.className = "activity-item";
    li.innerHTML =
      '<div class="activity-icon"><i class="fa-solid ' +
      (item.icon || "fa-circle") +
      '"></i></div>' +
      '<div class="activity-content"><p>' +
      item.text +
      "</p><span>" +
      item.time +
      "</span></div>";
    activityList.appendChild(li);
  });
}
