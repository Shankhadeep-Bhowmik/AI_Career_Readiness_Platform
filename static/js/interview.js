/**
 * AI Career Readiness Platform - Interview Practice JavaScript
 * Chat interface, timer, speech-to-text, API calls, summary chart
 */

let interviewState = {
  sessionId: null,
  type: "Technical Interview",
  difficulty: "Beginner",
  totalQuestions: 5,
  currentIndex: 0,
  scores: [],
  feedbacks: [],
  questions: [],
  timerSeconds: 0,
  timerInterval: null,
};

let summaryChart = null;

const STATS_STORAGE_KEY = "interview_stats";

// Mock questions by interview type
const mockQuestionBank = {
  "Technical Interview": [
    "Explain the difference between a list and a tuple in Python.",
    "What is normalization in databases and why is it important?",
    "How does the HTTP request and response cycle work?",
    "What is the time complexity of binary search?",
    "Explain OOP concepts: inheritance, encapsulation, and polymorphism.",
    "What is an API and how does REST work?",
    "Describe how you would debug a production issue.",
    "What is Git and how do branches work?",
    "Explain SQL JOIN types with examples.",
    "What are indexes in a database?",
    "How would you design a URL shortener?",
    "What is the difference between SQL and NoSQL?",
    "Explain recursion with an example.",
    "What is a hash table?",
    "Describe your favorite data structure and why.",
  ],
  "HR Interview": [
    "Tell me about yourself.",
    "Why do you want to join our company?",
    "What are your strengths and weaknesses?",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?",
    "Describe a challenging situation at work or college.",
    "What is your expected salary?",
    "Are you willing to relocate?",
    "How do you handle stress and pressure?",
    "Do you prefer working in a team or alone?",
    "Tell me about a time you showed leadership.",
    "What motivates you?",
    "How do you prioritize tasks?",
    "What do you know about our company?",
    "Do you have any questions for us?",
  ],
  "Behavioral Interview": [
    "Describe a time you failed and what you learned.",
    "Tell me about a conflict with a teammate and how you resolved it.",
    "Give an example of when you went above and beyond.",
    "Describe a situation where you had to meet a tight deadline.",
    "Tell me about a time you received critical feedback.",
    "Describe a project you are most proud of.",
    "Give an example of adapting to change quickly.",
    "Tell me about a time you had to persuade others.",
    "Describe when you took initiative without being asked.",
    "Tell me about handling multiple priorities.",
    "Describe a ethical dilemma you faced.",
    "Give an example of learning a new skill fast.",
    "Tell me about mentoring or helping a peer.",
    "Describe a time you disagreed with your manager.",
    "Tell me about your biggest achievement.",
  ],
  "Mixed Interview": [
    "Tell me about yourself and your technical background.",
    "Explain a recent project you built and technologies used.",
    "What is your greatest strength for this role?",
    "How do you stay updated with technology trends?",
    "Describe a bug you fixed and your approach.",
    "Where do you see yourself in 3 years?",
    "Explain REST API in simple terms.",
    "Tell me about a teamwork experience.",
    "What is SQL injection and how to prevent it?",
    "Why do you want this job?",
    "Describe a time you learned from failure.",
    "What is version control and why use Git?",
    "How do you handle tight deadlines?",
    "Explain difference between frontend and backend.",
    "Do you have any questions for us?",
  ],
};

document.addEventListener("DOMContentLoaded", function () {
  initSidebar();
  initLogout();
  loadStats();
  initStartInterview();
  initSubmitAnswer();
  initSpeechToText();
  initPracticeAgain();
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
 * Load interview stats from localStorage
 */
function loadStats() {
  try {
    const stats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || "{}");
    document.getElementById("statTotal").textContent = stats.total || 0;
    document.getElementById("statAverage").textContent = stats.average
      ? stats.average + "%"
      : "0%";
    document.getElementById("statBest").textContent = stats.best ? stats.best + "%" : "0%";
  } catch {
    /* use defaults */
  }
}

function saveStats(overallScore) {
  try {
    const stats = JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) || "{}");
    stats.total = (stats.total || 0) + 1;
    stats.scores = stats.scores || [];
    stats.scores.push(overallScore);
    stats.average = Math.round(
      stats.scores.reduce(function (a, b) {
        return a + b;
      }, 0) / stats.scores.length
    );
    stats.best = Math.max(stats.best || 0, overallScore);
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    loadStats();
  } catch {
    /* ignore */
  }
}

/**
 * Start interview button
 */
function initStartInterview() {
  document.getElementById("startInterviewBtn").addEventListener("click", async function () {
    interviewState.type = document.getElementById("interviewType").value;
    interviewState.difficulty = document.getElementById("interviewDifficulty").value;
    interviewState.totalQuestions = parseInt(
      document.getElementById("questionCount").value,
      10
    );
    interviewState.currentIndex = 0;
    interviewState.scores = [];
    interviewState.feedbacks = [];

    document.getElementById("setupSection").classList.add("hidden-section");
    document.getElementById("interviewPanel").classList.add("active");
    document.getElementById("summaryPanel").classList.remove("active");

    const chatContainer = document.getElementById("chatContainer");
    chatContainer.innerHTML = "";

    try {
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: interviewState.type,
          difficulty: interviewState.difficulty,
          questionCount: interviewState.totalQuestions,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        interviewState.sessionId = data.sessionId;
        interviewState.questions = data.questions || [];
      } else {
        setupMockQuestions();
      }
    } catch {
      setupMockQuestions();
    }

    showNextQuestion();
  });
}

function setupMockQuestions() {
  const bank = mockQuestionBank[interviewState.type] || mockQuestionBank["Technical Interview"];
  const shuffled = bank.slice().sort(function () {
    return 0.5 - Math.random();
  });
  interviewState.questions = shuffled.slice(0, interviewState.totalQuestions);
  interviewState.sessionId = "mock-" + Date.now();
}

/**
 * Show typing animation then display question
 */
async function showNextQuestion() {
  if (interviewState.currentIndex >= interviewState.totalQuestions) {
    showSummary();
    return;
  }

  updateProgress();
  resetTimer();
  startTimer();

  const question =
    interviewState.questions[interviewState.currentIndex] ||
    "Tell me about yourself and your background.";

  showTypingIndicator();

  await delay(1200);

  removeTypingIndicator();

  addAIMessage(question, interviewState.currentIndex + 1);

  document.getElementById("answerTextarea").value = "";
  document.getElementById("answerTextarea").disabled = false;
  document.getElementById("submitAnswerBtn").disabled = false;
}

function updateProgress() {
  document.getElementById("questionProgress").textContent =
    "Question " +
    (interviewState.currentIndex + 1) +
    " of " +
    interviewState.totalQuestions;
}

function delay(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function showTypingIndicator() {
  const chat = document.getElementById("chatContainer");
  const div = document.createElement("div");
  div.className = "chat-message ai";
  div.id = "typingIndicator";
  div.innerHTML =
    '<div class="bubble-wrap"><div class="avatar"><i class="fa-solid fa-robot"></i></div>' +
    '<div class="typing-indicator"><span></span><span></span><span></span></div></div>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function addAIMessage(text, questionNum) {
  const chat = document.getElementById("chatContainer");
  const div = document.createElement("div");
  div.className = "chat-message ai";
  div.innerHTML =
    '<div class="bubble-wrap"><div class="avatar"><i class="fa-solid fa-robot"></i></div>' +
    '<div class="bubble"><div class="q-label">Question ' +
    questionNum +
    "</div>" +
    escapeHtml(text) +
    "</div></div>";
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function addStudentMessage(text) {
  const chat = document.getElementById("chatContainer");
  const div = document.createElement("div");
  div.className = "chat-message student";
  div.innerHTML = '<div class="bubble">' + escapeHtml(text) + "</div>";
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Timer - counts seconds per question
 */
function resetTimer() {
  stopTimer();
  interviewState.timerSeconds = 0;
  updateTimerDisplay();
}

function startTimer() {
  interviewState.timerInterval = setInterval(function () {
    interviewState.timerSeconds++;
    updateTimerDisplay();
  }, 1000);
}

function stopTimer() {
  if (interviewState.timerInterval) {
    clearInterval(interviewState.timerInterval);
    interviewState.timerInterval = null;
  }
}

function updateTimerDisplay() {
  const mins = Math.floor(interviewState.timerSeconds / 60);
  const secs = interviewState.timerSeconds % 60;
  document.getElementById("timerDisplay").textContent =
    String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

/**
 * Submit answer to backend
 */
function initSubmitAnswer() {
  document.getElementById("submitAnswerBtn").addEventListener("click", async function () {
    const answer = document.getElementById("answerTextarea").value.trim();

    if (!answer) {
      alert("Please type your answer before submitting.");
      return;
    }

    stopTimer();
    document.getElementById("submitAnswerBtn").disabled = true;
    document.getElementById("answerTextarea").disabled = true;

    addStudentMessage(answer);

    const question =
      interviewState.questions[interviewState.currentIndex] ||
      "Interview question";

    let feedback = null;

    try {
      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: interviewState.sessionId,
          question: question,
          answer: answer,
          questionNumber: interviewState.currentIndex + 1,
          timeTaken: interviewState.timerSeconds,
          type: interviewState.type,
          difficulty: interviewState.difficulty,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        feedback = data.feedback;
      } else {
        feedback = generateMockFeedback(answer, question);
      }
    } catch {
      feedback = generateMockFeedback(answer, question);
    }

    interviewState.scores.push(feedback.score);
    interviewState.feedbacks.push(feedback);

    showFeedbackCard(feedback);

    interviewState.currentIndex++;

    await delay(1500);
    showNextQuestion();
  });
}

/**
 * Mock AI feedback when API is unavailable
 */
function generateMockFeedback(answer, question) {
  const wordCount = answer.split(/\s+/).length;
  let score = 5;

  if (wordCount > 30) score += 2;
  if (wordCount > 60) score += 1;
  if (answer.toLowerCase().includes("example") || answer.toLowerCase().includes("because")) {
    score += 1;
  }
  score = Math.min(10, Math.max(3, score + Math.floor(Math.random() * 2)));

  return {
    score: score,
    good: [
      "You provided a clear response structure.",
      "Good effort in addressing the question directly.",
      wordCount > 40 ? "Detailed answer with sufficient context." : "Concise and to the point.",
    ],
    improve: [
      "Add a real example from your projects or internship.",
      "Mention measurable results where possible.",
      "Structure using STAR method for behavioral questions.",
    ],
    idealAnswer:
      "For \"" +
      question.substring(0, 50) +
      "...\", a strong answer would include: context, your specific actions, technologies or skills used, and the positive outcome with numbers if possible.",
  };
}

/**
 * Collapsible feedback card after each answer
 */
function showFeedbackCard(feedback) {
  const chat = document.getElementById("chatContainer");
  const card = document.createElement("div");
  card.className = "feedback-card";
  card.innerHTML =
    '<button type="button" class="feedback-toggle" aria-expanded="false">' +
    "<span><i class=\"fa-solid fa-comment-dots me-2\"></i>AI Feedback</span>" +
    '<span class="score-badge">' +
    feedback.score +
    "/10</span></button>" +
    '<div class="feedback-body">' +
    '<div class="feedback-section good"><h6><i class="fa-solid fa-circle-check me-1"></i>What was good</h6><ul>' +
    feedback.good
      .map(function (g) {
        return "<li>" + escapeHtml(g) + "</li>";
      })
      .join("") +
    "</ul></div>" +
    '<div class="feedback-section improve"><h6><i class="fa-solid fa-lightbulb me-1"></i>What to improve</h6><ul>' +
    feedback.improve
      .map(function (i) {
        return "<li>" + escapeHtml(i) + "</li>";
      })
      .join("") +
    "</ul></div>" +
    '<div class="ideal-answer-box"><h6>Sample ideal answer</h6><p>' +
    escapeHtml(feedback.idealAnswer) +
    "</p></div></div>";

  chat.appendChild(card);

  const toggle = card.querySelector(".feedback-toggle");
  const body = card.querySelector(".feedback-body");

  toggle.addEventListener("click", function () {
    body.classList.toggle("show");
    toggle.setAttribute("aria-expanded", body.classList.contains("show"));
  });

  body.classList.add("show");
  chat.scrollTop = chat.scrollHeight;
}

/**
 * Speech to text using browser Web Speech API
 */
function initSpeechToText() {
  const micBtn = document.getElementById("micBtn");
  const textarea = document.getElementById("answerTextarea");

  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    micBtn.title = "Speech recognition not supported in this browser";
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  let listening = false;

  micBtn.addEventListener("click", function () {
    if (listening) {
      recognition.stop();
      return;
    }
    recognition.start();
  });

  recognition.onstart = function () {
    listening = true;
    micBtn.classList.add("listening");
    micBtn.title = "Listening... click to stop";
  };

  recognition.onend = function () {
    listening = false;
    micBtn.classList.remove("listening");
    micBtn.title = "Speech to text";
  };

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    textarea.value = (textarea.value + " " + transcript).trim();
  };

  recognition.onerror = function () {
    listening = false;
    micBtn.classList.remove("listening");
  };
}

/**
 * Interview summary with Chart.js
 */
function showSummary() {
  stopTimer();
  document.getElementById("interviewPanel").classList.remove("active");
  document.getElementById("summaryPanel").classList.add("active");

  const avgScore =
    interviewState.scores.length > 0
      ? interviewState.scores.reduce(function (a, b) {
          return a + b;
        }, 0) / interviewState.scores.length
      : 0;
  const overallScore = Math.round((avgScore / 10) * 100);

  document.getElementById("overallScore").textContent = overallScore;

  saveStats(overallScore);

  const strengths = [];
  const improvements = [];

  interviewState.feedbacks.forEach(function (fb, i) {
    if (fb.score >= 7) {
      strengths.push("Strong answer on Question " + (i + 1));
    } else {
      improvements.push("Improve structure on Question " + (i + 1));
    }
    if (fb.good && fb.good[0]) {
      if (i === 0 && fb.score >= 7) strengths.push(fb.good[0]);
    }
    if (fb.improve && fb.improve[0]) {
      if (i === 0 && fb.score < 7) improvements.push(fb.improve[0]);
    }
  });

  if (!strengths.length) {
    strengths.push("Completed full interview session", "Showed willingness to practice");
  }
  if (!improvements.length) {
    improvements.push("Add more examples in answers", "Practice STAR method for behavioral questions");
  }

  const strengthsList = document.getElementById("strengthsList");
  const improveList = document.getElementById("improveList");
  strengthsList.innerHTML = strengths
    .slice(0, 5)
    .map(function (s) {
      return "<li>" + escapeHtml(s) + "</li>";
    })
    .join("");
  improveList.innerHTML = improvements
    .slice(0, 5)
    .map(function (s) {
      return "<li>" + escapeHtml(s) + "</li>";
    })
    .join("");

  initSummaryChart();
}

function initSummaryChart() {
  const canvas = document.getElementById("summaryChart");
  if (!canvas) return;

  const labels = interviewState.scores.map(function (_, i) {
    return "Q" + (i + 1);
  });

  if (summaryChart) summaryChart.destroy();

  summaryChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Score out of 10",
          data: interviewState.scores,
          backgroundColor: "rgba(37, 99, 235, 0.7)",
          borderColor: "#2563eb",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: { stepSize: 2 },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function initPracticeAgain() {
  document.getElementById("practiceAgainBtn").addEventListener("click", function () {
    document.getElementById("summaryPanel").classList.remove("active");
    document.getElementById("setupSection").classList.remove("hidden-section");
    document.getElementById("interviewPanel").classList.remove("active");
    document.getElementById("chatContainer").innerHTML = "";
  });
}
