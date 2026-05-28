/**
 * AI Career Readiness Platform - Resume Builder JavaScript
 * Live preview, dynamic sections, skills tags, AI feedback, PDF download
 */

// Skills stored as an array of strings
let skillsList = [];

document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initLogout();
  initCharacterCounter();
  initSkillsTags();
  initDynamicSections();
  initLivePreview();
  initFeedbackButton();
  initPdfDownload();
  updatePreview();
});

/**
 * Sidebar toggle (same pattern as dashboard and other pages)
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
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "/logout";
    });
  }
}

/**
 * Character counter for career objective textarea
 */
function initCharacterCounter() {
  const textarea = document.getElementById("careerObjective");
  const counter = document.getElementById("objectiveCharCount");

  if (!textarea || !counter) return;

  function updateCount() {
    counter.textContent = textarea.value.length;
  }

  textarea.addEventListener("input", updateCount);
  updateCount();
}

/**
 * Add and remove skill tags when user presses Enter
 */
function initSkillsTags() {
  const skillInput = document.getElementById("skillInput");
  if (!skillInput) return;

  skillInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = skillInput.value.trim();
      if (value && !skillsList.includes(value)) {
        skillsList.push(value);
        renderSkillTags();
        skillInput.value = "";
        updatePreview();
      }
    }
  });
}

function renderSkillTags() {
  const wrap = document.getElementById("skillsTagsWrap");
  if (!wrap) return;

  wrap.innerHTML = "";

  skillsList.forEach(function (skill, index) {
    const tag = document.createElement("span");
    tag.className = "skill-tag";
    tag.innerHTML =
      escapeHtml(skill) +
      '<button type="button" aria-label="Remove ' +
      escapeHtml(skill) +
      '"><i class="fa-solid fa-xmark"></i></button>';

    tag.querySelector("button").addEventListener("click", function () {
      skillsList.splice(index, 1);
      renderSkillTags();
      updatePreview();
    });

    wrap.appendChild(tag);
  });
}

/**
 * Add more education, project, and certification entries
 */
function initDynamicSections() {
  document.getElementById("addEducationBtn")?.addEventListener("click", function () {
    addDynamicEntry("educationList", "education-entry", "Education");
  });

  document.getElementById("addProjectBtn")?.addEventListener("click", function () {
    addDynamicEntry("projectsList", "project-entry", "Project");
  });

  document.getElementById("addCertificationBtn")?.addEventListener("click", function () {
    addDynamicEntry("certificationsList", "cert-entry", "Certification");
  });

  attachRemoveButtons();
}

function addDynamicEntry(listId, entryClass, labelPrefix) {
  const list = document.getElementById(listId);
  const firstEntry = list.querySelector("." + entryClass);
  const newEntry = firstEntry.cloneNode(true);
  const count = list.querySelectorAll("." + entryClass).length + 1;

  newEntry.setAttribute("data-entry-index", count - 1);
  newEntry.querySelector(".entry-header span").textContent = labelPrefix + " " + count;

  newEntry.querySelectorAll("input, textarea").forEach(function (field) {
    field.value = "";
  });

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn-remove-entry";
  removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';
  newEntry.querySelector(".entry-header").appendChild(removeBtn);

  list.appendChild(newEntry);
  attachRemoveButtons();
  bindPreviewInputs(newEntry);
  updatePreview();
}

function attachRemoveButtons() {
  document.querySelectorAll(".dynamic-entry .entry-header").forEach(function (header) {
    if (header.querySelector(".btn-remove-entry")) return;

    const list = header.closest("[id$='List']");
    const entries = list.querySelectorAll(".dynamic-entry");

    if (entries.length > 1) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn-remove-entry";
      removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Remove';
      header.appendChild(removeBtn);

      removeBtn.addEventListener("click", function () {
        header.closest(".dynamic-entry").remove();
        renumberEntries(list);
        updatePreview();
      });
    }
  });
}

function renumberEntries(list) {
  const prefix =
    list.id === "educationList"
      ? "Education"
      : list.id === "projectsList"
        ? "Project"
        : "Certification";

  list.querySelectorAll(".dynamic-entry").forEach(function (entry, index) {
    entry.querySelector(".entry-header span").textContent = prefix + " " + (index + 1);
  });
}

/**
 * Listen to all form inputs and refresh preview in real time
 */
function initLivePreview() {
  document.querySelectorAll(".resume-input").forEach(function (input) {
    input.addEventListener("input", updatePreview);
  });

  document.querySelectorAll(".dynamic-entry").forEach(function (entry) {
    bindPreviewInputs(entry);
  });
}

function bindPreviewInputs(container) {
  container.querySelectorAll("input, textarea").forEach(function (input) {
    input.addEventListener("input", updatePreview);
  });
}

/**
 * Build resume data object from the form (sent to Flask API)
 */
function collectResumeData() {
  const education = [];
  document.querySelectorAll(".education-entry").forEach(function (entry) {
    education.push({
      degree: entry.querySelector(".edu-degree")?.value.trim() || "",
      institution: entry.querySelector(".edu-institution")?.value.trim() || "",
      year: entry.querySelector(".edu-year")?.value.trim() || "",
      grade: entry.querySelector(".edu-grade")?.value.trim() || "",
    });
  });

  const projects = [];
  document.querySelectorAll(".project-entry").forEach(function (entry) {
    projects.push({
      name: entry.querySelector(".proj-name")?.value.trim() || "",
      description: entry.querySelector(".proj-description")?.value.trim() || "",
      technologies: entry.querySelector(".proj-tech")?.value.trim() || "",
      github: entry.querySelector(".proj-github")?.value.trim() || "",
    });
  });

  const certifications = [];
  document.querySelectorAll(".cert-entry").forEach(function (entry) {
    certifications.push({
      name: entry.querySelector(".cert-name")?.value.trim() || "",
      organization: entry.querySelector(".cert-org")?.value.trim() || "",
      year: entry.querySelector(".cert-year")?.value.trim() || "",
    });
  });

  return {
    personal: {
      fullName: document.getElementById("fullName")?.value.trim() || "",
      email: document.getElementById("email")?.value.trim() || "",
      phone: document.getElementById("phone")?.value.trim() || "",
      city: document.getElementById("city")?.value.trim() || "",
      linkedin: document.getElementById("linkedin")?.value.trim() || "",
      github: document.getElementById("github")?.value.trim() || "",
      portfolio: document.getElementById("portfolio")?.value.trim() || "",
    },
    objective: document.getElementById("careerObjective")?.value.trim() || "",
    education: education,
    skills: skillsList.slice(),
    projects: projects,
    certifications: certifications,
  };
}

/**
 * Update the live resume preview panel
 */
function updatePreview() {
  const data = collectResumeData();
  const personal = data.personal;

  document.getElementById("previewName").textContent =
    personal.fullName || "Your Name";

  const contactParts = [];
  if (personal.email) contactParts.push(personal.email);
  if (personal.phone) contactParts.push(personal.phone);
  if (personal.city) contactParts.push(personal.city);
  if (personal.linkedin) contactParts.push(formatLinkLabel(personal.linkedin, "LinkedIn"));
  if (personal.github) contactParts.push(formatLinkLabel(personal.github, "GitHub"));
  if (personal.portfolio) contactParts.push(formatLinkLabel(personal.portfolio, "Portfolio"));

  const contactEl = document.getElementById("previewContact");
  if (contactParts.length) {
    contactEl.innerHTML = contactParts
      .map(function (part) {
        return "<span>" + escapeHtml(part) + "</span>";
      })
      .join("");
  } else {
    contactEl.innerHTML = '<span class="preview-placeholder">email@example.com</span>';
  }

  const objectiveEl = document.getElementById("previewObjective");
  objectiveEl.textContent = data.objective || "Your career objective will appear here.";
  objectiveEl.classList.toggle("preview-placeholder", !data.objective);

  renderEducationPreview(data.education);
  renderSkillsPreview(data.skills);
  renderProjectsPreview(data.projects);
  renderCertificationsPreview(data.certifications);
}

function renderEducationPreview(education) {
  const container = document.getElementById("previewEducation");
  const filled = education.filter(function (e) {
    return e.degree || e.institution || e.year || e.grade;
  });

  if (!filled.length) {
    container.innerHTML = '<p class="preview-placeholder">Add your education details.</p>';
    return;
  }

  container.innerHTML = filled
    .map(function (edu) {
      return (
        '<div class="preview-entry">' +
        '<div class="preview-entry-title">' +
        escapeHtml(edu.degree || "Degree") +
        "</div>" +
        '<div class="preview-entry-sub">' +
        escapeHtml(edu.institution || "") +
        "</div>" +
        '<div class="preview-entry-meta">' +
        escapeHtml([edu.year, edu.grade].filter(Boolean).join(" | ")) +
        "</div></div>"
      );
    })
    .join("");
}

function renderSkillsPreview(skills) {
  const container = document.getElementById("previewSkills");

  if (!skills.length) {
    container.innerHTML = '<span class="preview-placeholder">Add skills using tags.</span>';
    return;
  }

  container.innerHTML = skills
    .map(function (skill) {
      return '<span class="preview-skill-badge">' + escapeHtml(skill) + "</span>";
    })
    .join("");
}

function renderProjectsPreview(projects) {
  const container = document.getElementById("previewProjects");
  const filled = projects.filter(function (p) {
    return p.name || p.description || p.technologies || p.github;
  });

  if (!filled.length) {
    container.innerHTML = '<p class="preview-placeholder">Add your projects.</p>';
    return;
  }

  container.innerHTML = filled
    .map(function (proj) {
      let html =
        '<div class="preview-entry">' +
        '<div class="preview-entry-title">' +
        escapeHtml(proj.name || "Project") +
        "</div>";

      if (proj.technologies) {
        html +=
          '<div class="preview-entry-meta">' + escapeHtml(proj.technologies) + "</div>";
      }
      if (proj.description) {
        html +=
          '<p class="preview-project-desc">' + escapeHtml(proj.description) + "</p>";
      }
      if (proj.github) {
        html +=
          '<div class="preview-link">' + escapeHtml(proj.github) + "</div>";
      }
      return html + "</div>";
    })
    .join("");
}

function renderCertificationsPreview(certifications) {
  const container = document.getElementById("previewCertifications");
  const filled = certifications.filter(function (c) {
    return c.name || c.organization || c.year;
  });

  if (!filled.length) {
    container.innerHTML = '<p class="preview-placeholder">Add your certifications.</p>';
    return;
  }

  container.innerHTML = filled
    .map(function (cert) {
      return (
        '<div class="preview-entry">' +
        '<div class="preview-entry-title">' +
        escapeHtml(cert.name || "Certification") +
        "</div>" +
        '<div class="preview-entry-sub">' +
        escapeHtml(cert.organization || "") +
        "</div>" +
        '<div class="preview-entry-meta">' +
        escapeHtml(cert.year || "") +
        "</div></div>"
      );
    })
    .join("");
}

/**
 * Get AI Feedback button - POST to Flask backend
 */
function initFeedbackButton() {
  const btn = document.getElementById("getFeedbackBtn");
  if (!btn) return;

  btn.addEventListener("click", async function () {
    const resumeData = collectResumeData();

    btn.disabled = true;
    btn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Analyzing...';

    showFeedbackLoading();

    try {
      const response = await fetch("/api/resume/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok && data && data.success) {
        displayFeedback(data);
      } else {
        displayFeedback(generateMockFeedback(resumeData));
      }
    } catch {
      displayFeedback(generateMockFeedback(resumeData));
    }

    hideFeedbackLoading();
    btn.disabled = false;
    btn.innerHTML =
      '<i class="fa-solid fa-wand-magic-sparkles"></i> Get AI Feedback';
  });
}

function showFeedbackLoading() {
  document.getElementById("aiFeedbackLoading").classList.add("show");
  document.getElementById("aiFeedbackResults").classList.remove("show");

  document
    .getElementById("aiFeedbackSection")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideFeedbackLoading() {
  document.getElementById("aiFeedbackLoading").classList.remove("show");
}

/**
 * Show AI feedback on the page
 */
function displayFeedback(data) {
  document.getElementById("resumeScoreValue").textContent = data.score || 0;

  fillFeedbackList("feedbackGoodList", data.good || []);
  fillFeedbackList("feedbackImproveList", data.improve || []);
  fillFeedbackList("feedbackMissingList", data.missing || []);

  const suggestionsEl = document.getElementById("feedbackSuggestionsList");
  suggestionsEl.innerHTML = "";

  const suggestions = data.suggestions || {};
  Object.keys(suggestions).forEach(function (section) {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.innerHTML =
      "<strong>" +
      escapeHtml(formatSectionName(section)) +
      "</strong>" +
      escapeHtml(suggestions[section]);
    suggestionsEl.appendChild(item);
  });

  if (!Object.keys(suggestions).length) {
    suggestionsEl.innerHTML =
      '<p class="text-muted mb-0">No section suggestions available.</p>';
  }

  document.getElementById("aiFeedbackResults").classList.add("show");
}

function fillFeedbackList(elementId, items) {
  const list = document.getElementById(elementId);
  list.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "Nothing to show in this category.";
    list.appendChild(li);
    return;
  }

  items.forEach(function (text) {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
}

/**
 * Mock AI feedback when backend API is not ready yet
 */
function generateMockFeedback(data) {
  const good = [];
  const improve = [];
  const missing = [];
  const suggestions = {};
  let score = 40;

  const p = data.personal;

  if (p.fullName) {
    good.push("Your full name is clearly mentioned at the top.");
    score += 8;
  } else {
    missing.push("Full name is missing.");
    suggestions.personal = "Add your full name so recruiters can identify you.";
  }

  if (p.email && p.phone) {
    good.push("Contact details (email and phone) are provided.");
    score += 10;
  } else {
    improve.push("Add both email and phone number for easy contact.");
    suggestions.personal =
      (suggestions.personal || "") + " Include a professional email and active phone number.";
  }

  if (data.objective && data.objective.length >= 80) {
    good.push("Career objective is detailed and meaningful.");
    score += 12;
  } else if (data.objective) {
    improve.push("Career objective is too short. Expand it to 2-3 lines.");
    suggestions.objective =
      "Write 2-3 sentences about your goals, skills, and the role you are targeting.";
  } else {
    missing.push("Career objective section is empty.");
    suggestions.objective = "Add a career objective tailored to your target job role.";
  }

  const hasEducation = data.education.some(function (e) {
    return e.degree && e.institution;
  });
  if (hasEducation) {
    good.push("Education details are listed properly.");
    score += 12;
  } else {
    missing.push("Education section needs degree and institution.");
    suggestions.education = "Add your latest degree, college name, year, and CGPA or percentage.";
  }

  if (data.skills.length >= 5) {
    good.push("Good variety of skills listed (" + data.skills.length + " skills).");
    score += 10;
  } else if (data.skills.length > 0) {
    improve.push("Add more relevant technical and soft skills (aim for at least 5).");
    suggestions.skills = "Include programming languages, tools, and soft skills like teamwork.";
  } else {
    missing.push("No skills added yet.");
    suggestions.skills = "Add skills as tags — mix technical skills with soft skills.";
  }

  const hasProject = data.projects.some(function (pr) {
    return pr.name && pr.description;
  });
  if (hasProject) {
    good.push("Projects section shows practical experience.");
    score += 12;
  } else {
    improve.push("Add at least one project with description and technologies.");
    suggestions.projects =
      "Describe a college or personal project with tech stack and a GitHub link if possible.";
  }

  const hasCert = data.certifications.some(function (c) {
    return c.name;
  });
  if (hasCert) {
    good.push("Certifications strengthen your profile.");
    score += 8;
  } else {
    improve.push("Consider adding online course or workshop certifications.");
    suggestions.certifications =
      "List certifications from Coursera, NPTEL, or hackathons to stand out.";
  }

  if (p.linkedin || p.github) {
    good.push("Professional links (LinkedIn/GitHub) are included.");
    score += 6;
  } else {
    improve.push("Add LinkedIn and GitHub links for recruiters to verify your work.");
  }

  if (score > 100) score = 100;

  return {
    success: true,
    score: score,
    good: good,
    improve: improve,
    missing: missing,
    suggestions: suggestions,
  };
}

/**
 * Download resume as PDF using browser print dialog
 */
function initPdfDownload() {
  const btn = document.getElementById("downloadPdfBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    document.body.classList.add("printing-resume");
    window.print();
    document.body.classList.remove("printing-resume");
  });
}

/* ---------- Helper functions ---------- */

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatLinkLabel(url, label) {
  if (!url) return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : "https://" + url);
    return label + ": " + parsed.hostname.replace("www.", "");
  } catch {
    return label;
  }
}

function formatSectionName(key) {
  const names = {
    personal: "Personal Details",
    objective: "Career Objective",
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    certifications: "Certifications",
  };
  return names[key] || key.charAt(0).toUpperCase() + key.slice(1);
}
