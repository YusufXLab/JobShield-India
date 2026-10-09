document.addEventListener("DOMContentLoaded", () => {
  const investigateBtn = document.getElementById("investigateBtn");
  const jobQuery = document.getElementById("jobQuery");

  investigateBtn.addEventListener("click", investigate);
  loadHistory();

  const clearHistoryBtn = document.getElementById("clearHistoryBtn");
  clearHistoryBtn.addEventListener("click", clearHistory);
  jobQuery.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      investigate();
    }
  });
});

async function investigate() {
  const jobQuery = document.getElementById("jobQuery");
  const investigateBtn = document.getElementById("investigateBtn");
  const statusMessage = document.getElementById("statusMessage");
  const results = document.getElementById("results");

  const query = jobQuery.value.trim();

  if (!query) {
    statusMessage.textContent = "⚠️ Please enter a company name or job opportunity.";
    return;
  }

  investigateBtn.disabled = true;
  investigateBtn.textContent = "🔄 Investigating...";
  statusMessage.textContent = "🔎 Collecting live web evidence...";
  results.classList.add("hidden");

  try {
    const response = await fetch("/api/investigate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Investigation failed.");
    }

    displayResults(data);

    statusMessage.textContent = "✅ Investigation complete.";
    results.classList.remove("hidden");

  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      "❌ Investigation failed: " + error.message;

  } finally {
    investigateBtn.disabled = false;
    investigateBtn.textContent = "🔎 Investigate";
  }
}

function displayResults(data) {
  const analysis = data.analysis;
  const evidence = data.evidence;

  const riskScoreElement = document.getElementById("riskScore");
  const verdictElement = document.getElementById("verdict");

  riskScoreElement.textContent = analysis.score + "/100";
  const riskMeterFill = document.getElementById("riskMeterFill");

  riskMeterFill.style.width = analysis.score + "%";
  riskMeterFill.className = "risk-meter-fill";

  if (analysis.verdict.label === "Looks Legit") {
    riskMeterFill.classList.add("meter-low");
  } else if (analysis.verdict.label === "Be Careful") {
    riskMeterFill.classList.add("meter-medium");
  } else if (analysis.verdict.label === "Likely Scam") {
    riskMeterFill.classList.add("meter-high");
  } else {
    riskMeterFill.classList.add("meter-unknown");
  }


  verdictElement.textContent =
    analysis.verdict.emoji + " " + analysis.verdict.label;

  const explanationElement =
    document.getElementById("verdictExplanation");

  if (analysis.verdict.label === "Likely Scam") {
    explanationElement.textContent =
      "Strong scam indicators were found. Do not send money or sensitive financial information.";
  } else if (analysis.verdict.label === "Be Careful") {
    explanationElement.textContent =
      "Some risk signals were found. Verify the recruiter, job listing and application channel before proceeding.";
  } else if (analysis.verdict.label === "Looks Legit") {
    explanationElement.textContent =
      "No major scam indicators were detected, and supporting company/job evidence was found.";
  } else {
    explanationElement.textContent =
      "There is not enough reliable evidence to make a confident safety judgment.";
  }

  riskScoreElement.className = "risk-score";
  verdictElement.className = "verdict";

  if (analysis.verdict.label === "Looks Legit") {
    riskScoreElement.classList.add("risk-low");
    verdictElement.classList.add("verdict-low");
  } else if (analysis.verdict.label === "Be Careful") {
    riskScoreElement.classList.add("risk-medium");
    verdictElement.classList.add("verdict-medium");
  } else if (analysis.verdict.label === "Likely Scam") {
    riskScoreElement.classList.add("risk-high");
    verdictElement.classList.add("verdict-high");
  } else {
    riskScoreElement.classList.add("risk-unknown");
    verdictElement.classList.add("verdict-unknown");
  }

  document.getElementById("jobsCount").textContent =
    evidence.jobs.count || evidence.jobs.jobs?.length || 0;

  document.getElementById("searchCount").textContent =
    evidence.searchResults.count || evidence.searchResults.results?.length || 0;

  document.getElementById("newsCount").textContent =
    evidence.newsResults.count || evidence.newsResults.news?.length || 0;

  displayList(
    "redFlags",
    analysis.redFlags,
    "No major red flags detected."
  );

  displayList(
    "trustSignals",
    analysis.trustSignals,
    "No strong trust signals detected."
  );
  displayList(
    "contradictions",
    analysis.contradictions,
    "No contradictions detected."
  );

  displayEvidenceSources(evidence);
  saveToHistory(data.query, analysis);
  loadHistory();
}

function displayList(elementId, items, emptyMessage) {
  const list = document.getElementById(elementId);

  list.innerHTML = "";

  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.textContent = emptyMessage;
    list.appendChild(li);
    return;
  }

  items.forEach((item) => {
    const li = document.createElement("li");

    if (item.points) {
      li.textContent =
        item.name + " (" + item.points + " points)";
    } else {
      li.textContent = item.name;
    }

    list.appendChild(li);
  });
}
function displayEvidenceSources(evidence) {
  const container = document.getElementById("evidenceSources");

  container.innerHTML = "";

  const sources = [];

  const searchResults = evidence.searchResults?.results || [];
  const newsResults = evidence.newsResults?.results || [];

  searchResults.slice(0, 5).forEach((result) => {
    sources.push({
      type: "Web Search",
      title: result.title || "Search result",
      link: result.link,
      description: result.snippet || ""
    });
  });

  newsResults.slice(0, 5).forEach((article) => {
    sources.push({
      type: "Google News",
      title: article.title || "News article",
      link: article.link,
      description: article.source || ""
    });
  });

  if (sources.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No evidence sources found.";
    container.appendChild(message);
    return;
  }

  sources.forEach((source) => {
    const card = document.createElement("div");
    card.className = "source-card";

    const title = document.createElement("h3");
    title.textContent = source.title;

    const type = document.createElement("p");
    type.textContent = source.type;

    const description = document.createElement("p");
    description.textContent = source.description;

    card.appendChild(type);
    card.appendChild(title);
    card.appendChild(description);

    if (source.link) {
      const link = document.createElement("a");
      link.href = source.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "View Source ↗";

      card.appendChild(link);
    }

    container.appendChild(card);
  });
}
function saveToHistory(query, analysis) {
  const history = JSON.parse(
    localStorage.getItem("jobshieldHistory") || "[]"
  );

  const item = {
    query: query,
    score: analysis.score,
    verdict: analysis.verdict,
    date: new Date().toLocaleString()
  };

  history.unshift(item);

  // Keep only the latest 10 investigations
  const limitedHistory = history.slice(0, 10);

  localStorage.setItem(
    "jobshieldHistory",
    JSON.stringify(limitedHistory)
  );
}

function loadHistory() {
  const container = document.getElementById("historyList");

  if (!container) {
    return;
  }

  const history = JSON.parse(
    localStorage.getItem("jobshieldHistory") || "[]"
  );

  container.innerHTML = "";

  if (history.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No investigations yet.";
    container.appendChild(message);
    return;
  }

  history.forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-card";

    const title = document.createElement("h3");
    title.textContent = item.query;

    const verdict = document.createElement("p");
    verdict.textContent =
      item.verdict.emoji + " " + item.verdict.label;

    const score = document.createElement("strong");
    score.textContent = item.score + "/100";

    const date = document.createElement("small");
    date.textContent = item.date;

    card.appendChild(title);
    card.appendChild(verdict);
    card.appendChild(score);
    card.appendChild(date);

    container.appendChild(card);
  });
}

function clearHistory() {
  localStorage.removeItem("jobshieldHistory");
  loadHistory();
}
function saveToHistory(query, analysis) {
  const history = JSON.parse(localStorage.getItem("jobshieldHistory") || "[]");

  history.unshift({
    query: query,
    score: analysis.score,
    verdict: analysis.verdict,
    date: new Date().toLocaleString()
  });

  localStorage.setItem(
    "jobshieldHistory",
    JSON.stringify(history.slice(0, 10))
  );
}

function loadHistory() {
  const container = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("jobshieldHistory") || "[]");

  if (!container) return;

  container.innerHTML = "";

  if (history.length === 0) {
    container.innerHTML = "<p>No investigations yet.</p>";
    return;
  }

  history.forEach((item) => {
    container.innerHTML += `
      <div class="history-card">
        <h3>${item.query}</h3>
        <p>${item.verdict.emoji} ${item.verdict.label}</p>
        <strong>${item.score}/100</strong>
        <small>${item.date}</small>
      </div>
    `;
  });
}

function clearHistory() {
  localStorage.removeItem("jobshieldHistory");
  loadHistory();
}