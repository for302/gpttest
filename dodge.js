const canvas = document.getElementById("dodge-canvas");
const ctx = canvas.getContext("2d");

const startButton = document.getElementById("dodge-start");
const scoreEl = document.getElementById("dodge-score");
const bestEl = document.getElementById("dodge-best");
const levelEl = document.getElementById("dodge-level");
const statusEl = document.getElementById("dodge-status");
const messageEl = document.getElementById("dodge-message");

const state = {
  running: false,
  lastTimestamp: 0,
  score: 0,
  bestScore: 0,
  spawnTimer: 0,
  spawnInterval: 900,
  player: {
    width: 52,
    height: 52,
    x: canvas.width / 2 - 26,
    y: canvas.height - 80,
    speed: 320,
  },
  poops: [],
};

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
};

function resetGameState() {
  state.poops.length = 0;
  state.score = 0;
  state.spawnTimer = 0;
  state.spawnInterval = 900;
  state.player.x = canvas.width / 2 - state.player.width / 2;
  state.player.y = canvas.height - 80;
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
  messageEl.textContent = "떨어지는 똥을 피해 오래 살아남아보세요!";
  statusEl.textContent = "게임 중";
  updateScoreDisplay();
  startButton.disabled = true;
  startButton.textContent = "플레이 중...";
}

function startGame() {
  if (state.running) {
    return;
  }
  resetGameState();
  state.running = true;
  state.lastTimestamp = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  state.running = false;
  statusEl.textContent = "게임 종료";
  messageEl.textContent = "부딪혔어요! 스페이스바를 누르면 다시 시작합니다.";
  state.bestScore = Math.max(state.bestScore, state.score);
  updateScoreDisplay();
  startButton.disabled = false;
  startButton.textContent = "다시 도전하기";
}

function updateScoreDisplay() {
  scoreEl.textContent = `${(state.score / 1000).toFixed(1)}초`;
  bestEl.textContent = `${(state.bestScore / 1000).toFixed(1)}초`;
  const level = Math.floor(state.score / 15000) + 1;
  levelEl.textContent = level;
}

function spawnPoop(level) {
  const radius = Math.floor(18 + Math.random() * 12);
  const x = radius + Math.random() * (canvas.width - radius * 2);
  state.poops.push({
    x,
    y: -radius,
    radius,
    speed: 180 + level * 40 + Math.random() * 30,
  });
}

function update(delta) {
  const dt = delta / 1000;
  const level = Math.floor(state.score / 15000) + 1;

  const distance = state.player.speed * dt;
  if (keys.ArrowLeft) {
    state.player.x -= distance;
  }
  if (keys.ArrowRight) {
    state.player.x += distance;
  }

  state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x));

  state.spawnTimer += delta;
  const targetInterval = Math.max(260, 900 - level * 70);
  if (state.spawnTimer >= targetInterval) {
    state.spawnTimer = 0;
    spawnPoop(level);
  }

  for (let i = state.poops.length - 1; i >= 0; i -= 1) {
    const poop = state.poops[i];
    poop.y += poop.speed * dt;
    if (poop.y - poop.radius > canvas.height) {
      state.poops.splice(i, 1);
      continue;
    }
    if (checkCollision(poop)) {
      endGame();
      return;
    }
  }

  state.score += delta;
  updateScoreDisplay();
}

function checkCollision(poop) {
  const player = state.player;
  const closestX = clamp(poop.x, player.x, player.x + player.width);
  const closestY = clamp(poop.y, player.y, player.y + player.height);
  const dx = poop.x - closestX;
  const dy = poop.y - closestY;
  return dx * dx + dy * dy < poop.radius * poop.radius * 0.9;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#fef1cf");
  gradient.addColorStop(1, "#f8d4f3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  const { x, y, width, height } = state.player;
  ctx.fillStyle = "#ffd972";
  const radius = 12;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();

  // eyes
  ctx.fillStyle = "#5c5138";
  ctx.beginPath();
  ctx.arc(x + width * 0.35, y + height * 0.45, 4, 0, Math.PI * 2);
  ctx.arc(x + width * 0.65, y + height * 0.45, 4, 0, Math.PI * 2);
  ctx.fill();

  // smile
  ctx.beginPath();
  ctx.arc(x + width / 2, y + height * 0.6, 12, 0, Math.PI);
  ctx.strokeStyle = "#5c5138";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawPoops() {
  state.poops.forEach((poop) => {
    ctx.beginPath();
    ctx.fillStyle = "#a3632d";
    ctx.arc(poop.x, poop.y, poop.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "#c78a4b";
    ctx.arc(poop.x, poop.y - poop.radius * 0.4, poop.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
  drawBackground();
  drawPlayer();
  drawPoops();
}

function loop(timestamp) {
  if (!state.running) {
    return;
  }
  const delta = timestamp - state.lastTimestamp;
  state.lastTimestamp = timestamp;
  update(delta);
  draw();
  if (state.running) {
    requestAnimationFrame(loop);
  }
}

startButton.addEventListener("click", () => {
  startGame();
});

function handleKeyDown(event) {
  if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
    event.preventDefault();
    keys[event.code] = true;
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (!state.running) {
      startGame();
    }
  }
}

function handleKeyUp(event) {
  if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
    event.preventDefault();
    keys[event.code] = false;
  }
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

draw();
