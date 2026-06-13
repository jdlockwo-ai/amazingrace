const state = {
  teamCode: localStorage.getItem("har_team_code") || "",
  currentStatus: null,
  refreshTimer: null,
  liveTimer: null
};

const $ = (id) => document.getElementById(id);

function init() {
  hydrateEventText();
  initBackgrounds();
  bindEvents();
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
  $("eventTagline").textContent = APP_CONFIG.EVENT_TAGLINE || "Sequential checkpoint race";
  $("eventDate").textContent = APP_CONFIG.EVENT_DATE;
  $("eventTime").textContent = APP_CONFIG.EVENT_TIME;
  $("teamSize").textContent = APP_CONFIG.TEAM_SIZE;
  $("firstPrize").textContent = APP_CONFIG.FIRST_PRIZE;
  $("secondPrize").textContent = APP_CONFIG.SECOND_PRIZE;
  document.title = `${APP_CONFIG.EVENT_NAME} Tracker`;
}

function initBackgrounds() {
  const backgrounds = APP_CONFIG.BACKGROUNDS || [];
  const picker = $("backgroundPicker");
  picker.innerHTML = "";
  if (!backgrounds.length) return;
  const saved = Number(localStorage.getItem("har_bg_index"));
  let index = Number.isFinite(saved) ? saved : 0;
  if (APP_CONFIG.RANDOM_BACKGROUND && !localStorage.getItem("har_bg_index")) {
    index = Math.floor(Math.random() * backgrounds.length);
  }
  setBackground(index);
  backgrounds.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.className = "bg-choice";
    btn.type = "button";
    btn.setAttribute("aria-label", `Use background ${i + 1}`);
    btn.addEventListener("click", () => setBackground(i));
    picker.appendChild(btn);
  });
  updateBgButtons(index);
}

function setBackground(index) {
  const backgrounds = APP_CONFIG.BACKGROUNDS || [];
  if (!backgrounds[index]) return;
  document.documentElement.style.setProperty("--site-bg", `url('${backgrounds[index]}')`);
  localStorage.setItem("har_bg_index", String(index));
  updateBgButtons(index);
}

function updateBgButtons(index) {
  document.querySelectorAll(".bg-choice").forEach((btn, i) => btn.classList.toggle("active", i === index));
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
  localStorage.removeItem("har_team_code");
  state.teamCode = "";
  state.currentStatus = null;
  clearAutoRefresh();
  clearLiveTimer();
  $("teamPanel").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
  $("teamCodeInput").focus();
}

async function loadTeam() {
  const code = $("teamCodeInput").value.trim().toUpperCase();
  if (!code) return showLoginWarning("Enter a team code first.");
  if (!isConfigured()) return showLoginWarning("The Google Apps Script Web App URL has not been added to config.js yet.");

  setButtonLoading($("loadTeamBtn"), true, "Loading...");
  try {
    const data = await gasRequest("teamStatus", { teamCode: code });
    if (!data.ok) throw new Error(data.error || "Team not found.");
    state.teamCode = code;
    localStorage.setItem("har_team_code", code);
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
  renderTiming(data.timing);
  renderMessage(data);
  renderChallenge(data);
  renderHints(data);
  renderProgress(data);
  manageAutoRefresh(data);
  manageLiveTimer(data);
}

function renderTiming(timing) {
  $("raceTimeStat").textContent = timing?.raceTimeText || "Not started";
  $("penaltyStat").textContent = `${timing?.totalPenaltyMinutes || 0} min`;
  $("adjustedTimeStat").textContent = timing?.adjustedTimeText || "Not started";
}

function manageLiveTimer(data) {
  clearLiveTimer();
  if (!data.timing?.started || data.timing?.finishedRace) return;
  const startMs = Date.parse(data.timing.startTime);
  if (!Number.isFinite(startMs)) return;
  state.liveTimer = setInterval(() => {
    const raceSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    const penaltySeconds = (data.timing.totalPenaltyMinutes || 0) * 60;
    $("raceTimeStat").textContent = formatSeconds(raceSeconds);
    $("adjustedTimeStat").textContent = formatSeconds(raceSeconds + penaltySeconds);
  }, 1000);
}

function clearLiveTimer() {
  if (state.liveTimer) clearInterval(state.liveTimer);
  state.liveTimer = null;
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

  if (data.progress.completed >= data.progress.raceStopsAt && data.progress.current === 15) {
    box.className = "alert alert-success";
    box.textContent = "Your race time has been recorded. Checkpoint 15 is now unlocked and does not affect your race time.";
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
      : "Submission rejected. Review your proof and submit again. No time penalty is added for resubmitting.";
  }
}

function renderChallenge(data) {
  const form = $("submissionForm");
  const card = $("challengeCard");
  const hintPanel = $("hintPanel");

  if (data.progress.completed >= data.progress.total) {
    card.classList.add("hidden");
    form.classList.add("hidden");
    hintPanel.classList.add("hidden");
    return;
  }

  card.classList.remove("hidden");
  hintPanel.classList.remove("hidden");
  const cp = data.currentCheckpoint;
  $("checkpointNumber").textContent = `Checkpoint ${cp.checkpoint}`;
  $("checkpointType").textContent = cp.type || "Challenge";
  $("checkpointTitle").textContent = cp.title;
  $("checkpointText").textContent = cp.challengeText;
  $("proofRequired").textContent = cp.proofRequired || "Judge verification";

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
  const cp = data.currentCheckpoint;
  const display = $("hintDisplay");
  const hint1Btn = $("hint1Btn");
  const hint2Btn = $("hint2Btn");
  display.innerHTML = "";
  display.classList.add("hidden");

  if (!cp || data.currentSubmission?.status === "Pending" || data.progress.completed >= data.progress.total) {
    hint1Btn.disabled = true;
    hint2Btn.disabled = true;
    return;
  }

  hint1Btn.disabled = false;
  hint2Btn.disabled = false;
  hint1Btn.textContent = cp.hint1Unlocked ? "Hint 1 Revealed" : "Reveal Hint 1 (+2 min)";
  hint2Btn.textContent = cp.hint2Unlocked ? "Hint 2 Revealed" : "Reveal Hint 2 (+5 min)";

  const lines = [];
  if (cp.hint1) lines.push(`<div><strong>Hint 1:</strong> ${escapeHtml(cp.hint1)}</div>`);
  if (cp.hint2) lines.push(`<div><strong>Hint 2:</strong> ${escapeHtml(cp.hint2)}</div>`);
  if (lines.length) {
    display.innerHTML = lines.join("");
    display.classList.remove("hidden");
  }
}

async function requestHint(hintNumber) {
  if (!state.currentStatus?.currentCheckpoint) return;
  const cp = state.currentStatus.currentCheckpoint;
  const penalty = hintNumber === 1 ? 2 : 5;
  const alreadyUnlocked = hintNumber === 1 ? cp.hint1Unlocked : cp.hint2Unlocked;
  if (!alreadyUnlocked) {
    const ok = confirm(`Reveal Hint ${hintNumber}? This adds +${penalty} minutes to your team's penalty time.`);
    if (!ok) return;
  }

  const button = hintNumber === 1 ? $("hint1Btn") : $("hint2Btn");
  setButtonLoading(button, true, "Revealing...");
  try {
    const data = await gasRequest("requestHint", {
      teamCode: state.teamCode,
      checkpoint: cp.checkpoint,
      hintNumber
    });
    if (!data.ok) throw new Error(data.error || "Could not reveal hint.");
    await loadTeam();
  } catch (error) {
    showTeamMessage(error.message, "alert-error");
  } finally {
    setButtonLoading(button, false, hintNumber === 1 ? "Reveal Hint 1 (+2 min)" : "Reveal Hint 2 (+5 min)");
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
  if (!answer && !proofLink) return showTeamMessage("Add an answer/description or a proof link before submitting.", "alert-error");

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
      tr.innerHTML = `<td>${escapeHtml(team.teamName)}</td><td>${escapeHtml(team.publicStatus)}</td><td>${team.completed} / ${team.total}</td><td>${escapeHtml(team.raceTimeText)}</td><td>${team.penaltyMinutes} min</td><td>${escapeHtml(team.adjustedTimeText)}</td>`;
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
    }, 20000);

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

function formatSeconds(seconds) {
  seconds = Number(seconds || 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
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
