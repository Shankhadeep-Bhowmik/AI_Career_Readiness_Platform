/**
 * AI Career Readiness Platform - Tech News JavaScript
 *
 * What this file does (in simple words):
 * - Fetches latest tech news from the Flask backend: GET /api/news
 * - Lets students filter by category and search by keyword
 * - Shows a featured article + a grid of cards
 * - Supports pagination using "Load More News"
 * - Fetches industry trends from backend: GET /api/trends
 * - Draws a Chart.js horizontal bar chart for skill demands
 */

let trendsChart = null;

// Page state (kept in one place for easier maintenance)
const newsState = {
  page: 1,
  pageSize: 9,
  category: "all",
  keyword: "",
  isLoading: false,
  hasMore: true,
};

// Fallback demo news (used only if backend is not ready)
const fallbackNews = [
  {
    title: "AI hiring trends for freshers in 2026",
    description:
      "A quick overview of how companies are evaluating AI skills, projects, and internship experience for entry level roles.",
    url: "https://example.com",
    urlToImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=60",
    source: { name: "Student Tech Digest" },
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: "ai",
  },
  {
    title: "React performance tips: memoization and rendering",
    description:
      "Learn the most common performance issues in React projects and how to fix them with practical patterns.",
    url: "https://example.com",
    urlToImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=60",
    source: { name: "Frontend Weekly" },
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    category: "web",
  },
  {
    title: "Cybersecurity basics: common threats in web apps",
    description:
      "A student friendly guide to XSS, CSRF, SQL injection, and how to protect your projects using simple steps.",
    url: "https://example.com",
    urlToImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=60",
    source: { name: "Security Notes" },
    publishedAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    category: "cyber",
  },
];

document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initLogout();
  initFilters();
  initSearch();
  initLoadMore();

  // First load
  loadNews({ reset: true });
  loadTrends();
});

/**
 * Sidebar toggle (same behavior used in other pages)
 */
function initSidebar() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function closeSidebar() {
    if (!sidebar || !sidebarOverlay) return;
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  if (hamburgerBtn && sidebar && sidebarOverlay) {
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

/**
 * Logout button support (uses existing Flask /logout)
 */
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
 * Category filter buttons
 */
function initFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      buttons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");

      newsState.category = btn.dataset.category || "all";
      loadNews({ reset: true });
    });
  });
}

/**
 * Search bar - Enter key and Search button
 */
function initSearch() {
  const input = document.getElementById("newsSearchInput");
  const btn = document.getElementById("searchBtn");

  function runSearch() {
    newsState.keyword = (input?.value || "").trim();
    loadNews({ reset: true });
  }

  if (btn) {
    btn.addEventListener("click", runSearch);
  }

  if (input) {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch();
      }
    });
  }
}

/**
 * Load more button
 */
function initLoadMore() {
  const btn = document.getElementById("loadMoreBtn");
  if (!btn) return;

  btn.addEventListener("click", function () {
    if (newsState.isLoading || !newsState.hasMore) return;
    newsState.page += 1;
    loadNews({ reset: false });
  });
}

/**
 * Main loader for news.
 * Backend contract (flexible):
 * - GET /api/news can return:
 *   - { success: true, articles: [...], hasMore: true/false }
 *   - or { articles: [...] }
 * We also pass query params for filtering:
 *   ?page=1&pageSize=9&category=ai&q=react
 */
async function loadNews({ reset }) {
  if (newsState.isLoading) return;

  newsState.isLoading = true;
  setMessage("");
  setLoadMoreLoading(true);

  if (reset) {
    newsState.page = 1;
    newsState.hasMore = true;
    renderSkeletons();
  }

  try {
    const url = buildNewsUrl();
    const res = await fetch(url);
    const data = await res.json();

    const articles = normalizeArticles(data);
    const hasMore = normalizeHasMore(data, articles.length);

    newsState.hasMore = hasMore;

    // For reset: featured uses first item
    if (reset) {
      renderFeatured(articles[0] || null);
      renderGrid(articles.slice(1), { append: false });
    } else {
      renderGrid(articles, { append: true });
    }

    updateLastUpdated();
    updateLoadMoreState();

    // Empty state
    const totalCards = document.querySelectorAll(".news-card").length;
    if (totalCards === 0) {
      setMessage("No news found for the selected filter. Try a different keyword or category.");
    }
  } catch (err) {
    // If API fails, use fallback only for first load reset (demo experience)
    if (reset) {
      const demo = applyClientFilters(fallbackNews);
      renderFeatured(demo[0] || null);
      renderGrid(demo.slice(1), { append: false });
      newsState.hasMore = false;
      updateLastUpdated(true);
      updateLoadMoreState();
      setMessage("Backend API not available right now. Showing demo news for presentation.");
    } else {
      setMessage("Unable to load more news at the moment. Please try again.");
    }
  } finally {
    newsState.isLoading = false;
    setLoadMoreLoading(false);
  }
}

function buildNewsUrl() {
  const params = new URLSearchParams();
  params.set("page", String(newsState.page));
  params.set("pageSize", String(newsState.pageSize));

  if (newsState.category && newsState.category !== "all") {
    params.set("category", newsState.category);
  }
  if (newsState.keyword) {
    params.set("q", newsState.keyword);
  }

  return "/api/news?" + params.toString();
}

function normalizeArticles(data) {
  const list = Array.isArray(data) ? data : data?.articles;
  const articles = Array.isArray(list) ? list : [];

  // If backend returns raw NewsAPI fields, we keep them but ensure required fields exist
  const normalized = articles
    .map(function (a) {
      return {
        title: safeText(a?.title),
        description: safeText(a?.description || a?.content),
        url: a?.url || "",
        urlToImage: a?.urlToImage || "",
        source: { name: safeText(a?.source?.name || a?.source || "Unknown") },
        publishedAt: a?.publishedAt || a?.published_at || "",
        category: a?.category || guessCategory(a),
      };
    })
    .filter(function (a) {
      return a.title && a.url;
    });

  // Apply category/keyword filtering on client side as a safety net
  return applyClientFilters(normalized);
}

function normalizeHasMore(data, receivedCount) {
  // Prefer backend field when available
  if (typeof data?.hasMore === "boolean") return data.hasMore;
  if (typeof data?.has_more === "boolean") return data.has_more;

  // Basic assumption: if we got a full page, there may be more
  return receivedCount >= newsState.pageSize;
}

function applyClientFilters(articles) {
  let filtered = articles;

  if (newsState.category && newsState.category !== "all") {
    filtered = filtered.filter(function (a) {
      return (a.category || "").toLowerCase() === newsState.category;
    });
  }

  if (newsState.keyword) {
    const q = newsState.keyword.toLowerCase();
    filtered = filtered.filter(function (a) {
      const hay = (a.title + " " + (a.description || "") + " " + (a.source?.name || "")).toLowerCase();
      return hay.includes(q);
    });
  }

  return filtered;
}

/**
 * Render featured card
 */
function renderFeatured(article) {
  const holder = document.getElementById("featuredCard");
  if (!holder) return;

  if (!article) {
    holder.innerHTML =
      '<div class="featured-body"><p class="text-muted mb-0">No featured news available right now.</p></div>';
    return;
  }

  const img = article.urlToImage || getFallbackImage(article.category);
  const sourceName = article.source?.name || "Unknown";
  const faviconUrl = getFaviconFromUrl(article.url);

  holder.innerHTML =
    '<img class="featured-img" src="' +
    escapeAttr(img) +
    '" alt="Featured news image" loading="lazy" onerror="this.src=\'' +
    escapeAttr(getFallbackImage(article.category)) +
    '\'" />' +
    '<div class="featured-body">' +
    '  <div class="featured-kicker">' +
    '    <span class="category-badge"><i class="fa-solid fa-tag"></i> ' +
    escapeHtml(getCategoryLabel(article.category)) +
    "</span>" +
    '    <span class="source-pill">' +
    '      <img src="' +
    escapeAttr(faviconUrl) +
    '" alt="Source logo" loading="lazy" onerror="this.style.display=\'none\'" />' +
    "      " +
    escapeHtml(sourceName) +
    "    </span>" +
    "  </div>" +
    '  <h3 class="featured-title">' +
    escapeHtml(article.title) +
    "</h3>" +
    '  <p class="featured-desc">' +
    escapeHtml(truncateText(article.description || "Click Read More to view full article.", 220)) +
    "</p>" +
    '  <div class="meta-row">' +
    "    <span><i class=\"fa-solid fa-clock\"></i> " +
    escapeHtml(timeAgo(article.publishedAt)) +
    "</span>" +
    '    <a class="btn-read-more" href="' +
    escapeAttr(article.url) +
    '" target="_blank" rel="noopener noreferrer">' +
    "Read more <i class=\"fa-solid fa-arrow-up-right-from-square\"></i>" +
    "</a>" +
    "  </div>" +
    "</div>";
}

/**
 * Render news grid cards
 */
function renderGrid(articles, { append }) {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;

  if (!append) {
    grid.innerHTML = "";
  }

  if (!articles || articles.length === 0) {
    return;
  }

  const frag = document.createDocumentFragment();

  articles.forEach(function (a) {
    const card = document.createElement("article");
    card.className = "news-card";

    const img = a.urlToImage || getFallbackImage(a.category);
    const faviconUrl = getFaviconFromUrl(a.url);

    card.innerHTML =
      '<img class="news-thumb" src="' +
      escapeAttr(img) +
      '" alt="News thumbnail" loading="lazy" onerror="this.src=\'' +
      escapeAttr(getFallbackImage(a.category)) +
      '\'" />' +
      '<div class="news-body">' +
      '  <div class="featured-kicker">' +
      '    <span class="category-badge"><i class="fa-solid fa-tag"></i> ' +
      escapeHtml(getCategoryLabel(a.category)) +
      "</span>" +
      "  </div>" +
      '  <h3 class="news-title">' +
      escapeHtml(a.title) +
      "</h3>" +
      '  <p class="news-desc">' +
      escapeHtml(truncateText(a.description || "Open the article to read full details.", 170)) +
      "</p>" +
      '  <div class="news-footer">' +
      '    <span class="source-inline">' +
      '      <img src="' +
      escapeAttr(faviconUrl) +
      '" alt="Source logo" loading="lazy" onerror="this.style.display=\'none\'" />' +
      "      " +
      escapeHtml(a.source?.name || "Unknown") +
      "    </span>" +
      '    <span class="time-inline">' +
      escapeHtml(timeAgo(a.publishedAt)) +
      "</span>" +
      "  </div>" +
      '  <a class="btn-read-small" href="' +
      escapeAttr(a.url) +
      '" target="_blank" rel="noopener noreferrer">' +
      "Read More <i class=\"fa-solid fa-arrow-up-right-from-square\"></i>" +
      "</a>" +
      "</div>";

    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

/**
 * Skeleton cards shown while loading (good UX)
 */
function renderSkeletons() {
  const featured = document.getElementById("featuredCard");
  const grid = document.getElementById("newsGrid");
  if (!featured || !grid) return;

  featured.innerHTML =
    '<div class="featured-skeleton">' +
    '  <div class="featured-skel-img skeleton"></div>' +
    '  <div class="featured-skel-body">' +
    '    <div class="skel-line w-55 skeleton"></div>' +
    '    <div class="skel-line w-90 skeleton"></div>' +
    '    <div class="skel-line w-70 skeleton"></div>' +
    '    <div class="skel-line w-90 skeleton"></div>' +
    '    <div class="skel-btn skeleton"></div>' +
    "  </div>" +
    "</div>";

  grid.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const card = document.createElement("div");
    card.className = "news-card news-card-skeleton";
    card.innerHTML =
      '<div class="news-thumb skeleton"></div>' +
      '<div class="news-body">' +
      '  <div class="skel-line w-55 skeleton"></div>' +
      '  <div class="skel-line w-90 skeleton"></div>' +
      '  <div class="skel-line w-70 skeleton"></div>' +
      '  <div class="skel-line w-90 skeleton"></div>' +
      '  <div class="skel-btn skeleton" style="width:100%"></div>' +
      "</div>";
    grid.appendChild(card);
  }
}

function updateLastUpdated(isDemo) {
  const el = document.getElementById("lastUpdatedText");
  if (!el) return;

  const now = new Date();
  const stamp =
    now.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    ", " +
    now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  el.textContent = isDemo ? stamp + " (demo)" : stamp;
}

function setMessage(text) {
  const el = document.getElementById("newsMessage");
  if (!el) return;
  el.textContent = text || "";
}

function updateLoadMoreState() {
  const btn = document.getElementById("loadMoreBtn");
  if (!btn) return;

  if (!newsState.hasMore) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> No More News';
  } else {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Load More News';
  }
}

function setLoadMoreLoading(isLoading) {
  const btn = document.getElementById("loadMoreBtn");
  if (!btn) return;

  if (isLoading) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
  }
}

/**
 * Industry trends: GET /api/trends
 * Expected formats supported:
 * - { success: true, skills: { Python: 80, React: 70, ... } }
 * - { success: true, data: [{ skill:"Python", demand:80 }, ...] }
 * - or just { Python: 80, React: 70, ... }
 */
async function loadTrends() {
  const canvas = document.getElementById("trendsChart");
  if (!canvas) return;

  // Default if backend is not ready
  const defaultSkills = {
    Python: 85,
    React: 72,
    "Machine Learning": 78,
    Cloud: 69,
    Cybersecurity: 63,
  };

  try {
    const res = await fetch("/api/trends");
    const data = await res.json();

    const skills = normalizeTrends(data) || defaultSkills;
    renderTrendsChart(canvas, skills);
    setTrendsLegend("Updated from backend trends API.");
  } catch (err) {
    renderTrendsChart(canvas, defaultSkills);
    setTrendsLegend("Backend trends API not available. Showing demo data.");
  }
}

function normalizeTrends(data) {
  if (!data) return null;

  if (data.skills && typeof data.skills === "object") {
    return data.skills;
  }

  if (Array.isArray(data.data)) {
    const obj = {};
    data.data.forEach(function (row) {
      const k = row.skill || row.name;
      const v = row.demand ?? row.value ?? row.count;
      if (k && typeof v === "number") obj[k] = v;
    });
    return Object.keys(obj).length ? obj : null;
  }

  // If backend returns direct object {Python: 50, React: 40}
  const keys = Object.keys(data);
  if (keys.length && typeof data[keys[0]] === "number") {
    return data;
  }

  return null;
}

function renderTrendsChart(canvas, skillsObj) {
  const labels = Object.keys(skillsObj);
  const values = labels.map(function (k) {
    return skillsObj[k];
  });

  if (trendsChart) trendsChart.destroy();

  trendsChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Demand Score",
          data: values,
          backgroundColor: "rgba(37, 99, 235, 0.85)",
          borderRadius: 8,
          barThickness: 18,
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
          grid: { color: "#e2e8f0" },
          ticks: { font: { family: "Poppins" } },
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: "Poppins", weight: "600" } },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return " Demand: " + ctx.raw;
            },
          },
        },
      },
      animation: { duration: 900 },
    },
  });
}

function setTrendsLegend(text) {
  const el = document.getElementById("trendsLegend");
  if (!el) return;
  el.textContent = text || "";
}

/* =========================================================
   Helpers (safe HTML, time ago, category mapping)
   ========================================================= */

function safeText(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function truncateText(text, maxLen) {
  const t = (text || "").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return t.slice(0, Math.max(0, maxLen - 1)).trim() + "…";
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  // For src/href attributes
  return escapeHtml(str);
}

function timeAgo(dateStr) {
  if (!dateStr) return "Recently";

  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return "Recently";

  const diffMs = Date.now() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return diffMin + " min ago";

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr + " hour" + (diffHr === 1 ? "" : "s") + " ago";

  const diffDay = Math.floor(diffHr / 24);
  return diffDay + " day" + (diffDay === 1 ? "" : "s") + " ago";
}

function getCategoryLabel(category) {
  const c = (category || "all").toLowerCase();
  if (c === "ai") return "Artificial Intelligence";
  if (c === "web") return "Web Development";
  if (c === "data") return "Data Science";
  if (c === "cyber") return "Cybersecurity";
  if (c === "cloud") return "Cloud Computing";
  return "All News";
}

function guessCategory(article) {
  const text = (article?.title || "") + " " + (article?.description || "");
  const t = text.toLowerCase();
  if (t.includes("react") || t.includes("javascript") || t.includes("frontend") || t.includes("web")) return "web";
  if (t.includes("machine learning") || t.includes("artificial intelligence") || t.includes("ai")) return "ai";
  if (t.includes("data") || t.includes("analytics") || t.includes("sql")) return "data";
  if (t.includes("security") || t.includes("vulnerability") || t.includes("cyber")) return "cyber";
  if (t.includes("cloud") || t.includes("aws") || t.includes("azure") || t.includes("gcp")) return "cloud";
  return "all";
}

function getFallbackImage(category) {
  const c = (category || "all").toLowerCase();
  const map = {
    ai: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=60",
    web: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=60",
    data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=60",
    cyber: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=60",
    cloud: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=60",
    all: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=60",
  };
  return map[c] || map.all;
}

function getFaviconFromUrl(articleUrl) {
  try {
    const u = new URL(articleUrl);
    return u.origin + "/favicon.ico";
  } catch (e) {
    return "";
  }
}

