const state = {
  teamCode: localStorage.getItem("var_team_code") || "",
  currentStatus: null,
  refreshTimer: null
};

const $ = (id) => document.getElementById(id);

function init() {
  hydrateEventText();
  bindEvents();
  applyBackground();
  checkConfig();
  if (state.teamCode) {
    $("teamCodeInput").value = state.teamCode;
    loadTeam();
  }
  if (!APP_CONFIG.SHOW_PUBLIC_STATUS) {
    $("leaderboardPanel").classList.add("hidden");
  }
}

function hydrateEventText() {
  $("eventName").textContent = APP_CONFIG.EVENT_NAME;
  $("eventDate").textContent = APP_CONFIG.EVENT_DATE;
  $("eventTime").textContent = APP_CONFIG.EVENT_TIME;
  $("teamSize").textContent = APP_CONFIG.TEAM_SIZE;
  $("firstPrize").textContent = APP_CONFIG.FIRST_PRIZE;
  $("secondPrize").textContent = APP_CONFIG.SECOND_PRIZE;
  document.title = `${APP_CONFIG.EVENT_NAME} Tracker`;
}

function applyBackground() {
  const images = APP_CONFIG.BACKGROUND_IMAGES || [];
  if (!images.length) return;
  const chosen = images[Math.floor(Math.random() * images.length)];
  document.body.style.setProperty("--bg-image", `url('${chosen}')`);
}

function bindEvents() {
  $("loadTeamBtn").addEventListener("click", loadTeam);
  $("refreshBtn").addEventListener("click", loadTeam);
  $("changeTeamBtn").addEventListener("click", changeTeam);
  $("submissionForm").addEventListener("submit", submitCheckpoint);
  $("loadBoardBtn").addEventListener("click", loadLeaderboard);
  $("hint1Btn").addEventListener("click", () => requestHint(1));
  $("hint2Btn").addEventListener("click", () => requestHint(2));
  $("teamCodeInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") loadTeam();
  });
}

function checkConfig() {
  if (!APP_CONFIG.GAS_URL || APP_CONFIG.GAS_URL.includes("PASTE_YOUR")) {
    const box = $("configWarning");
    box.classList.remove("hidden");
    box.innerHTML = "<strong>Setup needed:</strong> Paste your Google Apps Script Web App URL into <code>config.js</code>. Live submissions will not work until that is set.";
  }
}

function changeTeam() {
  localStorage.removeItem("var_team_code");
  state.teamCode = "";
  state.currentStatus = null;
  clearAutoRefresh();
  $("teamPanel").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
  $("teamCodeInput").focus();
}

async function loadTeam() {
  const code = $("teamCodeInput").value.trim().toUpperCase();
  if (!code) {
    showLoginWarning("Enter a team code first.");
    return;
  }
  if (!isConfigured()) {
    showLoginWarning("The Google Apps Script Web App URL has not been added to config.js yet.");
    return;
  }

  setButtonLoading($("loadTeamBtn"), true, "Loading...");
  try {
    const data = await gasRequest("teamStatus", { teamCode: code });
    if (!data.ok) throw new Error(data.error || "Team not found.");
    state.teamCode = code;
    localStorage.setItem("var_team_code", code);
    state.currentStatus = data;
    renderTeamStatus(data);
    $("loginPanel").classList.add("hidden");
    $("teamPanel").classList.remove("hidden");
  } catch (error) {
    showLoginWarning(error.message);
  } finally {
    setButtonLoading($("loadTeamBtn"), false, "Load Team");
  }
}

function renderTeamStatus(data) {
  $("teamNameDisplay").textContent = data.team.teamName;
  $("teamMembersDisplay").textContent = data.team.members ? `Members: ${data.team.members}` : "Members not listed";
  $("progressStat").textContent = `${data.progress.completed} / ${data.progress.total}`;
  $("raceTimeStat").textContent = data.timing.raceTimeDisplay || "--:--";
  $("penaltyStat").textContent = `${data.timing.penaltyMinutes || 0} min`;
  $("adjustedTimeStat").textContent = data.timing.adjustedTimeDisplay || "--:--";

  renderMessage(data);
  renderChallenge(data);
  renderProgress(data);
  manageAutoRefresh(data);
}

function renderMessage(data) {
  const box = $("messageBox");
  box.className = "alert hidden";
  box.textContent = "";

  if (data.progress.completed >= data.progress.total) {
    box.className = "alert alert-success";
    box.textContent = "All checkpoints are complete. Wait for final scoring from the judges.";
    return;
  }

  if (data.currentSubmission?.status === "Pending") {
    box.className = "alert";
    box.textContent = "Submission received. Waiting for judge approval. This page will automatically refresh.";
    return;
  }

  if (data.currentSubmission?.status === "Rejected") {
    box.className = "alert alert-error";
    box.textContent = data.currentSubmission.judgeNotes
      ? `Submission rejected: ${data.currentSubmission.judgeNotes}`
      : "Submission rejected. Review your proof and submit again. Resubmissions have no penalty.";
  }
}

function renderChallenge(data) {
  const form = $("submissionForm");
  const card = $("challengeCard");

  if (data.progress.completed >= data.progress.total) {
    card.classList.add("hidden");
    form.classList.add("hidden");
    return;
  }

  card.classList.remove("hidden");
  const cp = data.currentCheckpoint;
  $("checkpointNumber").textContent = `Checkpoint ${cp.checkpoint}`;
  $("checkpointType").textContent = cp.type || "Challenge";
  $("checkpointTitle").textContent = cp.title;
  $("checkpointText").textContent = cp.challengeText;
  $("proofRequired").textContent = cp.proofRequired || "Judge verification";
  renderHints(data);

  if (data.currentSubmission?.status === "Pending") {
    form.classList.add("hidden");
  } else {
    form.classList.remove("hidden");
    $("answerInput").value = "";
    $("proofLinkInput").value = "";
    $("notesInput").value = "";
  }
}

function renderHints(data) {
  const used = data.usedHints || {};
  const cp = data.currentCheckpoint || {};
  const output = $("hintOutput");
  output.innerHTML = "";
  output.classList.add("hidden");

  $("hint1Btn").disabled = !!used.hint1 || !cp.hint1;
  $("hint2Btn").disabled = !!used.hint2 || !cp.hint2;
  $("hint1Btn").textContent = used.hint1 ? "Hint 1 Used (+2 min)" : "Use Hint 1 (+2 min)";
  $("hint2Btn").textContent = used.hint2 ? "Hint 2 Used (+5 min)" : "Use Hint 2 (+5 min)";

  const hints = [];
  if (used.hint1) hints.push(`<strong>Hint 1:</strong> ${escapeHtml(cp.hint1 || used.hint1)}`);
  if (used.hint2) hints.push(`<strong>Hint 2:</strong> ${escapeHtml(cp.hint2 || used.hint2)}`);
  if (hints.length) {
    output.innerHTML = hints.map(h => `<div>${h}</div>`).join("");
    output.classList.remove("hidden");
  }
}

async function requestHint(hintNumber) {
  if (!state.currentStatus) return;
  const button = hintNumber === 1 ? $("hint1Btn") : $("hint2Btn");
  setButtonLoading(button, true, "Loading Hint...");
  try {
    const data = await gasRequest("useHint", {
      teamCode: state.teamCode,
      checkpoint: state.currentStatus.currentCheckpoint.checkpoint,
      hintNumber
    });
    if (!data.ok) throw new Error(data.error || "Could not load hint.");
    showTeamMessage(data.alreadyUsed ? "Hint already used. No additional penalty added." : `Hint ${hintNumber} unlocked. +${data.penaltyMinutes} minute penalty added.`, "alert-warning");
    await loadTeam();
  } catch (error) {
    showTeamMessage(error.message, "alert-error");
  } finally {
    setButtonLoading(button, false, hintNumber === 1 ? "Use Hint 1 (+2 min)" : "Use Hint 2 (+5 min)");
  }
}

function renderProgress(data) {
  const wrap = $("progressTrack");
  wrap.innerHTML = "";
  const total = data.progress.total;
  const completed = data.progress.completed;
  const current = data.progress.current;
  const pending = data.currentSubmission?.status === "Pending" ? current : null;

  for (let i = 1; i <= total; i++) {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    dot.textContent = i;
    dot.title = `Checkpoint ${i}`;
    if (i <= completed) dot.classList.add("approved");
    else if (i === pending) dot.classList.add("pending");
    else if (i === current) dot.classList.add("current");
    wrap.appendChild(dot);
  }
}

async function submitCheckpoint(event) {
  event.preventDefault();
  if (!state.currentStatus) return;

  const answer = $("answerInput").value.trim();
  const proofLink = $("proofLinkInput").value.trim();
  const notes = $("notesInput").value.trim();

  if (!answer && !proofLink) {
    showTeamMessage("Add an answer/description or a proof link before submitting.", "alert-error");
    return;
  }

  const button = $("submissionForm").querySelector("button[type='submit']");
  setButtonLoading(button, true, "Submitting...");
  try {
    const data = await gasRequest("submit", {
      teamCode: state.teamCode,
      checkpoint: state.currentStatus.currentCheckpoint.checkpoint,
      answer,
      proofLink,
      notes
    });
    if (!data.ok) throw new Error(data.error || "Could not submit checkpoint.");
    showTeamMessage("Submission received. Waiting for judge approval.", "alert");
    await loadTeam();
  } catch (error) {
    showTeamMessage(error.message, "alert-error");
  } finally {
    setButtonLoading(button, false, "Submit Checkpoint");
  }
}

async function loadLeaderboard() {
  if (!isConfigured()) {
    $("leaderboardBody").innerHTML = `<tr><td colspan="6">Add the Google Apps Script Web App URL in config.js first.</td></tr>`;
    return;
  }
  setButtonLoading($("loadBoardBtn"), true, "Loading...");
  try {
    const data = await gasRequest("leaderboard", {});
    if (!data.ok) throw new Error(data.error || "Could not load board.");
    const body = $("leaderboardBody");
    body.innerHTML = "";
    if (!data.teams.length) {
      body.innerHTML = `<tr><td colspan="6">No teams found.</td></tr>`;
      return;
    }
    data.teams.forEach((team) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(team.teamName)}</td><td>${escapeHtml(team.publicStatus)}</td><td>${team.completed} / ${team.total}</td><td>${escapeHtml(team.raceTimeDisplay || "--:--")}</td><td>${team.penaltyMinutes || 0} min</td><td>${escapeHtml(team.adjustedTimeDisplay || "--:--")}</td>`;
      body.appendChild(tr);
    });
  } catch (error) {
    $("leaderboardBody").innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  } finally {
    setButtonLoading($("loadBoardBtn"), false, "Update Board");
  }
}

function manageAutoRefresh(data) {
  clearAutoRefresh();
  if (data.currentSubmission?.status === "Pending") {
    state.refreshTimer = setInterval(loadTeam, APP_CONFIG.AUTO_REFRESH_SECONDS * 1000);
  }
}

function clearAutoRefresh() {
  if (state.refreshTimer) clearInterval(state.refreshTimer);
  state.refreshTimer = null;
}

function gasRequest(action, params) {
  return new Promise((resolve, reject) => {
    const callbackName = `gas_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const url = new URL(APP_CONFIG.GAS_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("callback", callbackName);
    Object.entries(params || {}).forEach(([key, value]) => url.searchParams.set(key, value ?? ""));

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Request timed out. Check the Apps Script deployment URL and permissions."));
    }, 15000);

    window[callbackName] = (data) => {
      clearTimeout(timeout);
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error("Could not reach the Google Apps Script endpoint."));
    };

    function cleanup() {
      delete window[callbackName];
      script.remove();
    }

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function isConfigured() {
  return APP_CONFIG.GAS_URL && !APP_CONFIG.GAS_URL.includes("PASTE_YOUR");
}

function showLoginWarning(message) {
  const box = $("configWarning");
  box.className = "alert alert-warning";
  box.textContent = message;
}

function showTeamMessage(message, className) {
  const box = $("messageBox");
  box.className = `alert ${className || ""}`;
  box.textContent = message;
}

function setButtonLoading(button, isLoading, text) {
  button.disabled = isLoading;
  button.textContent = text;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("load", init);
