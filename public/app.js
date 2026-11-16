const state = {
  code: localStorage.getItem("spySketchCode") || "",
  playerId: localStorage.getItem("spySketchPlayerId") || "",
  room: null,
  events: null,
  drawing: false,
  currentStroke: []
};

const els = {
  roomChip: document.querySelector("#roomChip"),
  homePanel: document.querySelector("#homePanel"),
  gamePanel: document.querySelector("#gamePanel"),
  statusChip: document.querySelector("#statusChip"),
  nameInput: document.querySelector("#nameInput"),
  codeInput: document.querySelector("#codeInput"),
  createBtn: document.querySelector("#createBtn"),
  joinBtn: document.querySelector("#joinBtn"),
  helpBtn: document.querySelector("#helpBtn"),
  closeHelpBtn: document.querySelector("#closeHelpBtn"),
  startBtn: document.querySelector("#startBtn"),
  revealBtn: document.querySelector("#revealBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  copyBtn: document.querySelector("#copyBtn"),
  settingsPanel: document.querySelector("#settingsPanel"),
  categorySelect: document.querySelector("#categorySelect"),
  timeSelect: document.querySelector("#timeSelect"),
  roundText: document.querySelector("#roundText"),
  timerText: document.querySelector("#timerText"),
  wordText: document.querySelector("#wordText"),
  colorInput: document.querySelector("#colorInput"),
  sizeInput: document.querySelector("#sizeInput"),
  phaseTitle: document.querySelector("#phaseTitle"),
  phaseSubtitle: document.querySelector("#phaseSubtitle"),
  board: document.querySelector("#board"),
  votingPanel: document.querySelector("#votingPanel"),
  voteButtons: document.querySelector("#voteButtons"),
  resultPanel: document.querySelector("#resultPanel"),
  resultTitle: document.querySelector("#resultTitle"),
  resultText: document.querySelector("#resultText"),
  votingStatus: document.querySelector("#votingStatus"),
  playersList: document.querySelector("#playersList"),
  helpModal: document.querySelector("#helpModal"),
  toast: document.querySelector("#toast")
};

const ctx = els.board.getContext("2d");
const pageRoomCode = new URLSearchParams(window.location.search).get("room")?.toUpperCase() || "";

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  setTimeout(() => els.toast.classList.add("hidden"), 2600);
}

function setStatus(status, label) {
  els.statusChip.textContent = label;
  els.statusChip.dataset.status = status;
}

async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function saveSession(code, playerId) {
  state.code = code;
  state.playerId = playerId;
  localStorage.setItem("spySketchCode", code);
  localStorage.setItem("spySketchPlayerId", playerId);
}

function goToRoom(code) {
  window.location.href = `/room.html?room=${encodeURIComponent(code)}`;
}

function connectEvents() {
  if (!state.code || !state.playerId) return;
  if (state.events) state.events.close();

  setStatus("connecting", "Connecting");
  state.events = new EventSource(`/events?code=${state.code}&playerId=${state.playerId}`);
  state.events.onmessage = event => {
    state.room = JSON.parse(event.data);
    setStatus("online", "Live");
    render();
  };
  state.events.onerror = () => {
    setStatus("offline", "Reconnecting");
    state.events.close();
    state.events = null;
    setTimeout(connectEvents, 1600);
  };
}

function clearCanvas() {
  ctx.clearRect(0, 0, els.board.width, els.board.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, els.board.width, els.board.height);
}

function drawStroke(stroke) {
  if (!stroke.points || stroke.points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i += 1) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

function redrawBoard() {
  clearCanvas();
  if (!state.room) return;
  state.room.drawing.forEach(drawStroke);
}

function canvasPoint(event) {
  const rect = els.board.getBoundingClientRect();
  const point = event.touches ? event.touches[0] : event;
  return {
    x: ((point.clientX - rect.left) / rect.width) * els.board.width,
    y: ((point.clientY - rect.top) / rect.height) * els.board.height
  };
}

async function sendStroke() {
  if (state.currentStroke.length < 2) return;
  const stroke = {
    color: els.colorInput.value,
    size: Number(els.sizeInput.value),
    points: state.currentStroke
  };
  state.currentStroke = [];
  await post("/api/stroke", {
    code: state.code,
    playerId: state.playerId,
    stroke
  }).catch(error => toast(error.message));
}

function phaseText(phase) {
  const map = {
    lobby: ["Lobby", "Wait for players, then the host can start the round."],
    drawing: ["Draw now", "One player does not know the word. Draw carefully."],
    voting: ["Vote", "Choose the player who looked the most suspicious."],
    results: ["Round result", "See who fooled the room and check the scoreboard."]
  };
  return map[phase] || ["Create or join a room", "One player does not know the word. Can you find them?"];
}

function renderPlayers() {
  const room = state.room;
  els.playersList.innerHTML = "";
  if (!room) {
    els.playersList.innerHTML = `<p class="hint">No players yet.</p>`;
    return;
  }

  room.players.forEach(player => {
    const card = document.createElement("div");
    card.className = "player-card";
    const tags = [];
    if (player.id === room.hostId) tags.push(`<span class="host-tag">Host</span>`);
    if (player.id === room.viewerId) tags.push(`<span class="you-tag">You</span>`);
    if (!player.connected) tags.push(`<span class="offline-tag">Offline</span>`);

    card.innerHTML = `
      <div class="player-top">
        <span>${escapeHtml(player.name)}</span>
        <span>${player.score}</span>
      </div>
      <div class="player-meta">${tags.join(" ") || "Player"}</div>
    `;
    els.playersList.appendChild(card);
  });
}

function renderSettings() {
  const room = state.room;
  const showSettings = Boolean(room?.isHost && room?.phase === "lobby");
  els.settingsPanel.classList.toggle("hidden", !showSettings);
  if (!room) return;

  if (els.categorySelect.options.length !== room.categories.length) {
    els.categorySelect.innerHTML = "";
    room.categories.forEach(category => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = `${category.label} (${category.count})`;
      els.categorySelect.appendChild(option);
    });
  }

  els.categorySelect.value = room.settings.category;
  els.timeSelect.value = String(room.settings.roundSeconds);
}

function renderVoting() {
  const room = state.room;
  els.voteButtons.innerHTML = "";
  if (!room || room.phase !== "voting") return;

  const votedNames = room.voters.length ? room.voters.join(", ") : "No votes yet";
  els.votingStatus.textContent = room.hasVoted
    ? `Your vote is locked. Voted: ${votedNames}`
    : `Voted so far: ${votedNames}`;

  room.players.forEach(player => {
    const button = document.createElement("button");
    button.textContent = player.id === room.viewerId ? `${player.name} (me)` : player.name;
    button.disabled = room.hasVoted;
    button.addEventListener("click", async () => {
      try {
        await post("/api/vote", {
          code: state.code,
          playerId: state.playerId,
          targetId: player.id
        });
        toast("Vote submitted.");
      } catch (error) {
        toast(error.message);
      }
    });
    els.voteButtons.appendChild(button);
  });
}

function renderTimer() {
  if (!state.room || !state.room.timerEndsAt) {
    els.timerText.textContent = "--";
    return;
  }
  const seconds = Math.max(0, Math.ceil((state.room.timerEndsAt - Date.now()) / 1000));
  els.timerText.textContent = `${seconds}s`;
}

function render() {
  const room = state.room;
  const hasRoom = Boolean(room);
  els.homePanel.classList.toggle("hidden", hasRoom);
  els.gamePanel.classList.toggle("hidden", !hasRoom);
  els.copyBtn.classList.toggle("hidden", !hasRoom);
  els.roomChip.textContent = hasRoom ? `Room ${room.code}` : "No room";

  const [title, subtitle] = phaseText(room?.phase);
  els.phaseTitle.textContent = title;
  if (room?.phase === "voting") {
    els.phaseSubtitle.textContent = `${room.voteCount}/${room.players.length} votes in`;
  } else if (room?.phase === "lobby") {
    const category = room.categories.find(item => item.id === room.settings.category)?.label || "Mixed";
    els.phaseSubtitle.textContent = `${subtitle} Category: ${category}. Time: ${room.settings.roundSeconds}s.`;
  } else {
    els.phaseSubtitle.textContent = subtitle;
  }

  els.roundText.textContent = room?.round || 0;
  els.wordText.textContent = room?.word || "Waiting";
  els.startBtn.classList.toggle("hidden", !room?.isHost || room?.phase !== "lobby");
  els.revealBtn.classList.toggle("hidden", !room?.isHost || room?.phase !== "voting");
  els.nextBtn.classList.toggle("hidden", !room?.isHost || room?.phase !== "results");
  els.clearBtn.disabled = room?.phase !== "drawing";

  els.votingPanel.classList.toggle("hidden", room?.phase !== "voting");
  els.resultPanel.classList.toggle("hidden", room?.phase !== "results");
  els.resultTitle.textContent = room?.hiddenName ? `Spy Sketcher: ${room.hiddenName}` : "Result";
  els.resultText.textContent = room?.phase === "results" ? `${room.resultText} Word: ${room.revealWord}` : "";
  if (room?.phase !== "voting") {
    els.votingStatus.textContent = "";
  }

  renderPlayers();
  renderSettings();
  renderVoting();
  redrawBoard();
  renderTimer();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

els.createBtn.addEventListener("click", async () => {
  try {
    const data = await post("/api/create", { name: els.nameInput.value });
    saveSession(data.code, data.playerId);
    goToRoom(data.code);
  } catch (error) {
    toast(error.message);
  }
});

els.joinBtn.addEventListener("click", async () => {
  try {
    const data = await post("/api/join", {
      name: els.nameInput.value,
      code: els.codeInput.value
    });
    saveSession(data.code, data.playerId);
    goToRoom(data.code);
  } catch (error) {
    toast(error.message);
  }
});

async function updateSettings() {
  if (!state.room?.isHost || state.room?.phase !== "lobby") return;
  try {
    await post("/api/settings", {
      code: state.code,
      playerId: state.playerId,
      settings: {
        category: els.categorySelect.value,
        roundSeconds: Number(els.timeSelect.value)
      }
    });
  } catch (error) {
    toast(error.message);
  }
}

els.categorySelect.addEventListener("change", updateSettings);
els.timeSelect.addEventListener("change", updateSettings);

els.helpBtn.addEventListener("click", () => {
  els.helpModal.classList.remove("hidden");
});

els.closeHelpBtn.addEventListener("click", () => {
  els.helpModal.classList.add("hidden");
});

els.helpModal.addEventListener("click", event => {
  if (event.target === els.helpModal) {
    els.helpModal.classList.add("hidden");
  }
});

els.startBtn.addEventListener("click", () => {
  post("/api/start", { code: state.code, playerId: state.playerId }).catch(error => toast(error.message));
});

els.revealBtn.addEventListener("click", () => {
  post("/api/finish-voting", { code: state.code, playerId: state.playerId }).catch(error => toast(error.message));
});

els.nextBtn.addEventListener("click", () => {
  post("/api/play-again", { code: state.code, playerId: state.playerId }).catch(error => toast(error.message));
});

els.clearBtn.addEventListener("click", () => {
  post("/api/clear", { code: state.code, playerId: state.playerId }).catch(error => toast(error.message));
});

els.copyBtn.addEventListener("click", async () => {
  if (!state.code) return;
  const inviteUrl = `${window.location.origin}/join.html?room=${state.code}`;
  await navigator.clipboard.writeText(inviteUrl).catch(() => null);
  toast("Invite link copied.");
});

els.board.addEventListener("pointerdown", event => {
  if (state.room?.phase !== "drawing") return;
  state.drawing = true;
  state.currentStroke = [canvasPoint(event)];
  els.board.setPointerCapture(event.pointerId);
});

els.board.addEventListener("pointermove", event => {
  if (!state.drawing || state.room?.phase !== "drawing") return;
  const point = canvasPoint(event);
  const previous = state.currentStroke[state.currentStroke.length - 1];
  state.currentStroke.push(point);
  drawStroke({
    color: els.colorInput.value,
    size: Number(els.sizeInput.value),
    points: [previous, point]
  });
});

els.board.addEventListener("pointerup", async event => {
  if (!state.drawing) return;
  state.drawing = false;
  els.board.releasePointerCapture(event.pointerId);
  await sendStroke();
});

els.board.addEventListener("pointerleave", async () => {
  if (!state.drawing) return;
  state.drawing = false;
  await sendStroke();
});

setInterval(renderTimer, 500);
clearCanvas();
if (pageRoomCode) {
  els.codeInput.value = pageRoomCode;
  const pathName = window.location.pathname.toLowerCase();
  if (pathName.includes("join")) {
    state.code = "";
    state.playerId = "";
  } else if (pathName.includes("room") && state.code !== pageRoomCode) {
    state.code = pageRoomCode;
    state.playerId = "";
  }
}
if (state.code && state.playerId) connectEvents();
