const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DEFAULT_ROUND_SECONDS = 90;
const WORD_PACKS = {
  mixed: {
    label: "Mixed",
    words: [
      "airplane",
      "alarm clock",
      "apple",
      "astronaut",
      "auto rickshaw",
      "backpack",
      "banana",
      "beach",
      "bicycle",
      "birthday cake",
      "book",
      "bridge",
      "burger",
      "butterfly",
      "camera",
      "campfire",
      "car",
      "castle",
      "cat",
      "chai cup",
      "chef",
      "chess board",
      "cloud",
      "cricket bat",
      "crown",
      "dinosaur",
      "dog",
      "dragon",
      "drum",
      "duck",
      "elephant",
      "eye glasses",
      "factory",
      "fish",
      "flower",
      "football",
      "forest",
      "fountain",
      "guitar",
      "hamburger",
      "headphones",
      "heart",
      "helmet",
      "helicopter",
      "ice cream",
      "island",
      "kite",
      "ladder",
      "lamp",
      "laptop",
      "lion",
      "lighthouse",
      "magic wand",
      "mango",
      "microscope",
      "moon",
      "motorcycle",
      "mountain",
      "mushroom",
      "palm tree",
      "panda",
      "pencil",
      "penguin",
      "phone",
      "piano",
      "pirate",
      "pizza",
      "planet",
      "police car",
      "popcorn",
      "rainbow",
      "robot",
      "rocket",
      "sailboat",
      "sand castle",
      "school bus",
      "shark",
      "shoe",
      "skateboard",
      "snowman",
      "spaceship",
      "spider",
      "stadium",
      "star",
      "submarine",
      "sunflower",
      "sunglasses",
      "superhero",
      "taj mahal",
      "telescope",
      "tiger",
      "toothbrush",
      "train",
      "treasure",
      "tree house",
      "trophy",
      "truck",
      "umbrella",
      "unicorn",
      "violin",
      "volcano",
      "watch",
      "water bottle",
      "waterfall",
      "whale",
      "wizard",
      "zebra"
    ]
  },
  animals: {
    label: "Animals",
    words: [
      "cat",
      "dog",
      "elephant",
      "lion",
      "tiger",
      "panda",
      "penguin",
      "duck",
      "fish",
      "shark",
      "whale",
      "zebra",
      "butterfly",
      "spider",
      "dinosaur"
    ]
  },
  food: {
    label: "Food",
    words: [
      "apple",
      "banana",
      "mango",
      "pizza",
      "burger",
      "hamburger",
      "ice cream",
      "popcorn",
      "birthday cake",
      "chai cup"
    ]
  },
  india: {
    label: "India",
    words: [
      "auto rickshaw",
      "chai cup",
      "cricket bat",
      "taj mahal",
      "mango",
      "school bus",
      "train",
      "umbrella",
      "festival lamp",
      "street food cart"
    ]
  },
  fantasy: {
    label: "Fantasy",
    words: [
      "dragon",
      "castle",
      "wizard",
      "magic wand",
      "pirate",
      "treasure",
      "unicorn",
      "superhero",
      "robot",
      "spaceship",
      "rocket",
      "planet",
      "astronaut"
    ]
  },
  objects: {
    label: "Objects",
    words: [
      "alarm clock",
      "backpack",
      "book",
      "camera",
      "eye glasses",
      "guitar",
      "headphones",
      "helmet",
      "lamp",
      "laptop",
      "microscope",
      "pencil",
      "phone",
      "piano",
      "shoe",
      "sunglasses",
      "telescope",
      "toothbrush",
      "watch",
      "water bottle"
    ]
  },
  places: {
    label: "Places",
    words: [
      "beach",
      "bridge",
      "campfire",
      "factory",
      "forest",
      "fountain",
      "island",
      "lighthouse",
      "mountain",
      "stadium",
      "tree house",
      "volcano",
      "waterfall"
    ]
  }
};

const rooms = new Map();

const funPromptBases = [
  "airplane",
  "apple",
  "backpack",
  "banana",
  "basketball",
  "bee",
  "bicycle",
  "birthday cake",
  "book",
  "bridge",
  "burger",
  "butterfly",
  "camera",
  "car",
  "castle",
  "cat",
  "chair",
  "cloud",
  "cricket bat",
  "crown",
  "dinosaur",
  "dog",
  "dragon",
  "duck",
  "elephant",
  "fish",
  "flower",
  "football",
  "guitar",
  "headphones",
  "helicopter",
  "ice cream",
  "island",
  "kite",
  "ladder",
  "lamp",
  "laptop",
  "lion",
  "lighthouse",
  "mango",
  "microscope",
  "moon",
  "motorcycle",
  "mountain",
  "mushroom",
  "panda",
  "pencil",
  "penguin",
  "phone",
  "piano",
  "pirate",
  "pizza",
  "planet",
  "police car",
  "popcorn",
  "rainbow",
  "robot",
  "rocket",
  "sailboat",
  "school bus",
  "shark",
  "shoe",
  "skateboard",
  "snowman",
  "spaceship",
  "spider",
  "stadium",
  "star",
  "submarine",
  "sunflower",
  "sunglasses",
  "superhero",
  "telescope",
  "tiger",
  "toothbrush",
  "train",
  "treasure",
  "tree house",
  "trophy",
  "truck",
  "umbrella",
  "unicorn",
  "violin",
  "volcano",
  "watch",
  "water bottle",
  "waterfall",
  "whale",
  "wizard",
  "zebra",
  "anchor",
  "balloon",
  "campfire",
  "chef",
  "compass",
  "drum",
  "helmet",
  "hot air balloon",
  "key",
  "mailbox",
  "parrot",
  "suitcase"
];

const funPromptStyles = ["giant", "tiny", "flying", "sleepy"];
const funPromptWords = funPromptStyles.flatMap(style => funPromptBases.map(word => `${style} ${word}`));

WORD_PACKS.fun = {
  label: "Fun Prompts",
  words: funPromptWords
};
WORD_PACKS.mixed.words = [...WORD_PACKS.mixed.words, ...funPromptWords].slice(0, 500);

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return rooms.has(code) ? makeCode() : code;
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request is too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function cleanName(name) {
  return String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 18);
}

function findPlayer(room, playerId) {
  return room.players.find(player => player.id === playerId);
}

function cleanSettings(settings) {
  const category = WORD_PACKS[settings?.category] ? settings.category : "mixed";
  const allowedTimes = [45, 60, 90, 120];
  const roundSeconds = allowedTimes.includes(Number(settings?.roundSeconds))
    ? Number(settings.roundSeconds)
    : DEFAULT_ROUND_SECONDS;
  return { category, roundSeconds };
}

function pickWord(category) {
  const pack = WORD_PACKS[category] || WORD_PACKS.mixed;
  return pack.words[Math.floor(Math.random() * pack.words.length)];
}

function publicState(room, viewerId) {
  const viewer = findPlayer(room, viewerId);
  const isHidden = room.hiddenId && viewerId === room.hiddenId;
  const allVotesIn =
    room.phase === "voting" &&
    room.players.length > 1 &&
    Object.keys(room.votes).length >= room.players.length;
  const voters = Object.keys(room.votes)
    .map(voterId => room.players.find(player => player.id === voterId)?.name)
    .filter(Boolean);

  return {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    viewerId,
    round: room.round,
    players: room.players.map(player => ({
      id: player.id,
      name: player.name,
      score: player.score,
      connected: player.connected
    })),
    word:
      room.phase === "drawing" || room.phase === "voting" || room.phase === "results"
        ? isHidden
          ? "???"
          : room.word
        : null,
    revealWord: room.phase === "results" ? room.word : null,
    hiddenId: room.phase === "results" ? room.hiddenId : null,
    hiddenName:
      room.phase === "results"
        ? room.players.find(player => player.id === room.hiddenId)?.name || "Unknown"
        : null,
    drawing: room.drawing,
    votes: room.phase === "results" ? room.votes : {},
    hasVoted: Boolean(room.votes[viewerId]),
    voters,
    voteCount: Object.keys(room.votes).length,
    allVotesIn,
    timerEndsAt: room.timerEndsAt,
    resultText: room.resultText,
    settings: room.settings,
    categories: Object.entries(WORD_PACKS).map(([id, pack]) => ({
      id,
      label: pack.label,
      count: pack.words.length
    })),
    isHost: viewer?.id === room.hostId
  };
}

function broadcast(room) {
  for (const client of room.clients) {
    client.res.write(`data: ${JSON.stringify(publicState(room, client.playerId))}\n\n`);
  }
}

function finishDrawing(room) {
  if (room.phase !== "drawing") return;
  room.phase = "voting";
  room.timerEndsAt = null;
  broadcast(room);
}

function finishVoting(room) {
  if (room.phase !== "voting") return;

  const counts = {};
  for (const targetId of Object.values(room.votes)) {
    counts[targetId] = (counts[targetId] || 0) + 1;
  }

  let topId = null;
  let topVotes = -1;
  let tied = false;
  for (const [targetId, count] of Object.entries(counts)) {
    if (count > topVotes) {
      topId = targetId;
      topVotes = count;
      tied = false;
    } else if (count === topVotes) {
      tied = true;
    }
  }

  const hiddenPlayer = findPlayer(room, room.hiddenId);
  const hiddenCaught = !tied && topId === room.hiddenId;

  if (hiddenCaught) {
    room.players.forEach(player => {
      if (player.id !== room.hiddenId) player.score += 2;
    });
    room.resultText = `${hiddenPlayer?.name || "The spy sketcher"} was caught. Artists score!`;
  } else {
    if (hiddenPlayer) hiddenPlayer.score += 3;
    room.resultText = `${hiddenPlayer?.name || "The spy sketcher"} escaped. Spy sketcher scores!`;
  }

  room.phase = "results";
  room.timerEndsAt = null;
  broadcast(room);
}

function startRound(room) {
  if (room.players.length < 3) {
    throw new Error("You need at least 3 players to start.");
  }

  room.round += 1;
  room.phase = "drawing";
  room.settings = cleanSettings(room.settings);
  room.word = pickWord(room.settings.category);
  room.hiddenId = room.players[Math.floor(Math.random() * room.players.length)].id;
  room.drawing = [];
  room.votes = {};
  room.resultText = "";
  room.timerEndsAt = Date.now() + room.settings.roundSeconds * 1000;
  clearTimeout(room.timer);
  room.timer = setTimeout(() => finishDrawing(room), room.settings.roundSeconds * 1000);
  broadcast(room);
}

function nextRound(room) {
  room.phase = "lobby";
  room.word = null;
  room.hiddenId = null;
  room.drawing = [];
  room.votes = {};
  room.resultText = "";
  room.timerEndsAt = null;
  clearTimeout(room.timer);
  broadcast(room);
}

function serveStatic(req, res) {
  if (req.url === "/health") {
    sendJson(res, 200, {
      status: "ok",
      app: "SpySketch",
      uptime: Math.round(process.uptime())
    });
    return;
  }

  const requested = req.url === "/" ? "/index.html" : decodeURIComponent(req.url);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      fs.readFile(path.join(PUBLIC_DIR, "index.html"), (fallbackError, fallback) => {
        if (fallbackError) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fallback);
      });
      return;
    }

    const ext = path.extname(filePath);
    const types = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".png": "image/png",
      ".svg": "image/svg+xml"
    };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(content);
  });
}

async function handleApi(req, res) {
  try {
    if (req.method === "GET" && req.url.startsWith("/events")) {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const code = String(url.searchParams.get("code") || "").toUpperCase();
      const playerId = String(url.searchParams.get("playerId") || "");
      const room = rooms.get(code);

      if (!room || !findPlayer(room, playerId)) {
        res.writeHead(404);
        res.end("Room or player not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });

      const player = findPlayer(room, playerId);
      player.connected = true;
      const client = { playerId, res };
      room.clients.add(client);
      res.write(`data: ${JSON.stringify(publicState(room, playerId))}\n\n`);
      broadcast(room);

      req.on("close", () => {
        room.clients.delete(client);
        const stillConnected = [...room.clients].some(item => item.playerId === playerId);
        player.connected = stillConnected;
        broadcast(room);
      });
      return;
    }

    if (!req.url.startsWith("/api/")) {
      serveStatic(req, res);
      return;
    }

    const body = await parseBody(req);

    if (req.method === "POST" && req.url === "/api/create") {
      const name = cleanName(body.name);
      if (!name) return sendJson(res, 400, { error: "Enter a nickname." });

      const player = { id: makeId(), name, score: 0, connected: true };
      const code = makeCode();
      const room = {
        code,
        hostId: player.id,
        players: [player],
        phase: "lobby",
        round: 0,
        word: null,
        hiddenId: null,
        drawing: [],
        votes: {},
        resultText: "",
        settings: cleanSettings({}),
        timerEndsAt: null,
        timer: null,
        clients: new Set()
      };
      rooms.set(code, room);
      sendJson(res, 200, { code, playerId: player.id });
      return;
    }

    if (req.method === "POST" && req.url === "/api/join") {
      const code = String(body.code || "").trim().toUpperCase();
      const name = cleanName(body.name);
      const room = rooms.get(code);
      if (!name) return sendJson(res, 400, { error: "Enter a nickname." });
      if (!room) return sendJson(res, 404, { error: "Room not found." });
      if (room.phase !== "lobby") return sendJson(res, 400, { error: "This game already started." });
      if (room.players.length >= 8) return sendJson(res, 400, { error: "Room is full." });

      const player = { id: makeId(), name, score: 0, connected: true };
      room.players.push(player);
      sendJson(res, 200, { code, playerId: player.id });
      broadcast(room);
      return;
    }

    const code = String(body.code || "").trim().toUpperCase();
    const playerId = String(body.playerId || "");
    const room = rooms.get(code);
    const player = room ? findPlayer(room, playerId) : null;

    if (!room || !player) {
      sendJson(res, 404, { error: "Room or player not found." });
      return;
    }

    if (req.method === "POST" && req.url === "/api/start") {
      if (room.hostId !== playerId) return sendJson(res, 403, { error: "Only host can start." });
      startRound(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/settings") {
      if (room.hostId !== playerId) return sendJson(res, 403, { error: "Only host can change settings." });
      if (room.phase !== "lobby") return sendJson(res, 400, { error: "Settings can change in lobby only." });
      room.settings = cleanSettings(body.settings);
      broadcast(room);
      sendJson(res, 200, { ok: true, settings: room.settings });
      return;
    }

    if (req.method === "POST" && req.url === "/api/stroke") {
      if (room.phase !== "drawing") return sendJson(res, 400, { error: "Drawing is closed." });
      const stroke = body.stroke;
      if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2) {
        return sendJson(res, 400, { error: "Invalid stroke." });
      }
      room.drawing.push({
        id: makeId(),
        playerId,
        color: String(stroke.color || "#111827").slice(0, 20),
        size: Math.max(2, Math.min(18, Number(stroke.size) || 5)),
        points: stroke.points.slice(0, 250).map(point => ({
          x: Number(point.x),
          y: Number(point.y)
        }))
      });
      broadcast(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/clear") {
      if (room.phase !== "drawing") return sendJson(res, 400, { error: "Drawing is closed." });
      room.drawing = [];
      broadcast(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/vote") {
      if (room.phase !== "voting") return sendJson(res, 400, { error: "Voting is closed." });
      if (room.votes[playerId]) return sendJson(res, 400, { error: "You already voted." });
      const targetId = String(body.targetId || "");
      if (!findPlayer(room, targetId)) return sendJson(res, 400, { error: "Choose a valid player." });
      room.votes[playerId] = targetId;
      broadcast(room);
      if (Object.keys(room.votes).length >= room.players.length) finishVoting(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/finish-voting") {
      if (room.hostId !== playerId) return sendJson(res, 403, { error: "Only host can reveal." });
      finishVoting(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/next") {
      if (room.hostId !== playerId) return sendJson(res, 403, { error: "Only host can continue." });
      nextRound(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && req.url === "/api/play-again") {
      if (room.hostId !== playerId) return sendJson(res, 403, { error: "Only host can start the next round." });
      if (room.phase !== "results") return sendJson(res, 400, { error: "Finish the current round first." });
      startRound(room);
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { error: "Unknown action." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error." });
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/") || req.url.startsWith("/events")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`SpySketch is running at http://localhost:${PORT}`);
});
