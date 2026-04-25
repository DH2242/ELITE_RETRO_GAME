// === CONFIG ===
const lanes = 4;
const laneKeys = ["a", "s", "d", "f"];
const laneColors = ["red", "yellow", "green", "blue"];

// Gesture mapping
const gestureToLane = { left: 0, fist: 1, nothing: 2, right: 3 };

// Game tuning
const noteSpeed = 0.12;
const spawnInterval = 600;
const hitWindow = 150;

// DOM references
const gameArea = document.querySelector(".game-area");
const laneContainer = document.getElementById("laneContainer");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const hitFeedback = document.getElementById("hitFeedback");

// Game state
let notes = [];
let lastTime = null;
let running = false;
let spawnTimer = 0;
let score = 0;
let combo = 0;

// Reset game
function resetGame() {
  notes.forEach(n => n.el.remove());
  notes = [];
  score = 0;
  combo = 0;
  scoreEl.textContent = score;
  comboEl.textContent = combo;
  messageEl.textContent = "Song started! Use gestures.";
}

// Spawn a falling note
function spawnNote() {
  const laneIndex = Math.floor(Math.random() * lanes);
  const laneEl = laneContainer.children[laneIndex];

  const noteEl = document.createElement("div");
  noteEl.classList.add("note", laneColors[laneIndex]);
  laneEl.appendChild(noteEl);

  const note = { el: noteEl, lane: laneIndex, y: -30 };
  notes.push(note);
  updateNotePosition(note);
}

function updateNotePosition(note) {
  note.el.style.top = note.y + "px";
}

function getHitLineY() {
  const rect = gameArea.getBoundingClientRect();
  const hitLine = document.querySelector(".hit-line");
  const hitRect = hitLine.getBoundingClientRect();
  return hitRect.top - rect.top;
}

// Main loop
function gameLoop(timestamp) {
  if (!running) return;

  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  const hitLineY = getHitLineY();

  notes.forEach(note => {
    note.y += noteSpeed * delta;
    updateNotePosition(note);
  });

  notes = notes.filter(note => {
    if (note.y > gameArea.clientHeight + 40) {
      showHitFeedback("MISS", "miss");
      combo = 0;
      comboEl.textContent = combo;
      note.el.remove();
      return false;
    }
    return true;
  });

  spawnTimer += delta;
  if (spawnTimer >= spawnInterval) {
    spawnTimer = 0;
    spawnNote();
  }

  requestAnimationFrame(gameLoop);
}

function showHitFeedback(text, type) {
  hitFeedback.textContent = text;
  hitFeedback.className = "hit-feedback " + type + " show";
  setTimeout(() => hitFeedback.classList.remove("show"), 150);
}

function processHit(laneIndex) {
  const hitLineY = getHitLineY();

  let bestNote = null;
  let bestDist = Infinity;

  notes.forEach(note => {
    if (note.lane !== laneIndex) return;
    const dist = Math.abs(note.y - hitLineY);
    if (dist < bestDist) {
      bestDist = dist;
      bestNote = note;
    }
  });

  if (bestNote && bestDist <= hitWindow) {
    const quality = bestDist < hitWindow / 2 ? "GOOD" : "OK";
    const type = quality === "GOOD" ? "good" : "ok";

    showHitFeedback(quality, type);

    const base = quality === "GOOD" ? 150 : 80;
    combo += 1;
    score += base + combo * 5;

    scoreEl.textContent = score;
    comboEl.textContent = combo;

    bestNote.el.remove();
    notes = notes.filter(n => n !== bestNote);
  } else {
    showHitFeedback("MISS", "miss");
    combo = 0;
    comboEl.textContent = combo;
  }
}

// Gesture input from TM model
function handleModelInput(gesture) {
  const laneIndex = gestureToLane[gesture];
  if (laneIndex === undefined) return;

  processHit(laneIndex);
  document.getElementById("gestureLabel").textContent = gesture;
}

// Start game
function startGame() {
  if (running) return;
  running = true;
  lastTime = null;
  spawnTimer = 0;
  resetGame();
  requestAnimationFrame(gameLoop);
}

startBtn.addEventListener("click", startGame);

// Webcam setup
const webcam = document.getElementById("webcam");
navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  webcam.srcObject = stream;
});

// Export gesture handler for TM model
window.handleModelInput = handleModelInput;
