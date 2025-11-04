const COLS = 10;
const ROWS = 20;
const PREVIEW_SIZE = 4;
const LINES_PER_LEVEL = 10;

const rootStyles = getComputedStyle(document.documentElement);
const COLORS = {
  I: rootStyles.getPropertyValue("--color-i").trim(),
  J: rootStyles.getPropertyValue("--color-j").trim(),
  L: rootStyles.getPropertyValue("--color-l").trim(),
  O: rootStyles.getPropertyValue("--color-o").trim(),
  S: rootStyles.getPropertyValue("--color-s").trim(),
  T: rootStyles.getPropertyValue("--color-t").trim(),
  Z: rootStyles.getPropertyValue("--color-z").trim(),
};

const TETROMINOES = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
  O: [
    [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  ],
};

const PIECES = Object.keys(TETROMINOES);

const boardElement = document.getElementById("board");
const nextElement = document.getElementById("next-board");
const holdElement = document.getElementById("hold-board");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const startButton = document.getElementById("start-button");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const overlayButton = document.getElementById("overlay-button");

const boardCells = [];
const nextCells = [];
const holdCells = [];

let board = createMatrix(ROWS, COLS);
let currentPiece = null;
let nextPiece = randomPiece();
let holdPiece = null;
let holdUsed = false;

let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000;

let score = 0;
let level = 1;
let clearedLines = 0;
let isPaused = false;
let isGameOver = false;

function createMatrix(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function randomPiece() {
  const type = PIECES[Math.floor(Math.random() * PIECES.length)];
  return createPiece(type);
}

function createPiece(type) {
  const shape = TETROMINOES[type][0];
  const size = shape.length;
  const offsetCol = Math.floor((COLS - size) / 2);
  return {
    type,
    matrix: shape.map((row) => [...row]),
    row: 0,
    col: offsetCol,
    rotation: 0,
  };
}

function initializeBoardUI() {
  boardElement.innerHTML = "";
  boardCells.length = 0;
  for (let i = 0; i < ROWS * COLS; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    boardCells.push(cell);
    boardElement.appendChild(cell);
  }
}

function initializeMiniBoard(element, storage) {
  element.innerHTML = "";
  storage.length = 0;
  for (let i = 0; i < PREVIEW_SIZE * PREVIEW_SIZE; i += 1) {
    const cell = document.createElement("div");
    cell.className = "mini-cell";
    storage.push(cell);
    element.appendChild(cell);
  }
}

function rotate(matrix, direction = 1) {
  const size = matrix.length;
  const result = createMatrix(size, size);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (direction === 1) {
        result[col][size - 1 - row] = matrix[row][col];
      } else {
        result[size - 1 - col][row] = matrix[row][col];
      }
    }
  }
  return result;
}

function isEmptyCell(matrix, row, col) {
  return matrix?.[row]?.[col] === 1;
}

function collide(boardState, piece, offsetRow = 0, offsetCol = 0) {
  const size = piece.matrix.length;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!isEmptyCell(piece.matrix, row, col)) continue;
      const boardRow = row + piece.row + offsetRow;
      const boardCol = col + piece.col + offsetCol;
      if (boardCol < 0 || boardCol >= COLS || boardRow >= ROWS) {
        return true;
      }
      if (boardRow >= 0 && boardState[boardRow][boardCol]) {
        return true;
      }
    }
  }
  return false;
}

function merge(boardState, piece) {
  const size = piece.matrix.length;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!isEmptyCell(piece.matrix, row, col)) continue;
      const boardRow = row + piece.row;
      const boardCol = col + piece.col;
      if (boardRow >= 0) {
        boardState[boardRow][boardCol] = piece.type;
      }
    }
  }
}

function clearLines() {
  let lines = 0;
  outer: for (let row = ROWS - 1; row >= 0; row -= 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (!board[row][col]) {
        continue outer;
      }
    }
    const removed = board.splice(row, 1)[0];
    board.unshift(Array(COLS).fill(null));
    lines += 1;
    row += 1;
  }
  if (lines > 0) {
    clearedLines += lines;
    const lineScores = [0, 100, 300, 500, 800];
    score += lineScores[lines] * level;
    const newLevel = Math.floor(clearedLines / LINES_PER_LEVEL) + 1;
    if (newLevel !== level) {
      level = newLevel;
      dropInterval = Math.max(120, 1000 * Math.pow(0.85, level - 1));
    }
    updateScoreboard();
  }
}

function updateScoreboard() {
  scoreEl.textContent = score.toLocaleString();
  levelEl.textContent = level;
  linesEl.textContent = clearedLines;
}

function drawBoard() {
  const snapshot = board.map((row) => [...row]);
  const ghost = getGhostPiece();
  if (ghost) {
    const size = ghost.matrix.length;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!isEmptyCell(ghost.matrix, row, col)) continue;
        const boardRow = row + ghost.row;
        const boardCol = col + ghost.col;
        if (boardRow >= 0) {
          snapshot[boardRow][boardCol] = "ghost";
        }
      }
    }
  }
  if (currentPiece) {
    const size = currentPiece.matrix.length;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!isEmptyCell(currentPiece.matrix, row, col)) continue;
        const boardRow = row + currentPiece.row;
        const boardCol = col + currentPiece.col;
        if (boardRow >= 0) {
          snapshot[boardRow][boardCol] = currentPiece.type;
        }
      }
    }
  }
  boardCells.forEach((cell, index) => {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    const value = snapshot[row][col];
    cell.classList.remove("filled", "ghost");
    cell.style.background = "";
    cell.style.removeProperty("box-shadow");

    if (!value) return;
    if (value === "ghost") {
      cell.classList.add("ghost");
      return;
    }
    cell.classList.add("filled");
    cell.style.background = COLORS[value];
  });
}

function drawMiniBoard(piece, cells) {
  cells.forEach((cell) => {
    cell.classList.remove("filled");
    cell.style.background = "rgba(255, 255, 255, 0.25)";
  });
  if (!piece) return;
  const size = piece.matrix.length;
  const offset = Math.floor((PREVIEW_SIZE - size) / 2);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!isEmptyCell(piece.matrix, row, col)) continue;
      const cellIndex = (row + offset) * PREVIEW_SIZE + (col + offset);
      const cell = cells[cellIndex];
      if (!cell) continue;
      cell.classList.add("filled");
      cell.style.background = COLORS[piece.type];
    }
  }
}

function getGhostPiece() {
  if (!currentPiece) return null;
  const ghost = {
    ...currentPiece,
    matrix: currentPiece.matrix.map((row) => [...row]),
    row: currentPiece.row,
    col: currentPiece.col,
  };
  while (!collide(board, ghost, 1, 0)) {
    ghost.row += 1;
  }
  return ghost;
}

function pieceDrop() {
  if (!currentPiece) return;
  if (!collide(board, currentPiece, 1, 0)) {
    currentPiece.row += 1;
  } else {
    lockPiece();
  }
  dropCounter = 0;
}

function hardDrop() {
  if (!currentPiece) return;
  while (!collide(board, currentPiece, 1, 0)) {
    currentPiece.row += 1;
    score += 2;
  }
  lockPiece();
  updateScoreboard();
}

function lockPiece() {
  merge(board, currentPiece);
  clearLines();
  spawnPiece();
}

function spawnPiece() {
  currentPiece = nextPiece;
  currentPiece.row = 0;
  currentPiece.col = Math.floor((COLS - currentPiece.matrix.length) / 2);
  nextPiece = randomPiece();
  holdUsed = false;
  if (collide(board, currentPiece, 0, 0)) {
    endGame();
    return;
  }
  drawMiniBoard(nextPiece, nextCells);
  drawBoard();
}

function holdCurrentPiece() {
  if (!currentPiece || holdUsed) return;
  const snapshot = {
    type: currentPiece.type,
    matrix: currentPiece.matrix.map((row) => [...row]),
  };
  const temp = holdPiece;
  holdPiece = snapshot;
  if (temp) {
    currentPiece = createPiece(temp.type);
    currentPiece.matrix = temp.matrix.map((row) => [...row]);
  } else {
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    drawMiniBoard(nextPiece, nextCells);
  }
  currentPiece.row = 0;
  currentPiece.col = Math.floor((COLS - currentPiece.matrix.length) / 2);
  holdUsed = true;
  drawMiniBoard(holdPiece, holdCells);
  drawBoard();
}

function movePiece(offsetCol) {
  if (!currentPiece) return;
  if (!collide(board, currentPiece, 0, offsetCol)) {
    currentPiece.col += offsetCol;
  }
}

function softDrop() {
  if (!currentPiece) return;
  if (!collide(board, currentPiece, 1, 0)) {
    currentPiece.row += 1;
    score += 1;
    updateScoreboard();
  } else {
    lockPiece();
  }
  dropCounter = 0;
}

function rotatePiece(direction = 1) {
  if (!currentPiece) return;
  const rotated = rotate(currentPiece.matrix, direction);
  const originalCol = currentPiece.col;
  let offset = 0;
  const size = rotated.length;
  while (offset < size) {
    if (!collide(board, { ...currentPiece, matrix: rotated }, 0, offset)) {
      currentPiece.matrix = rotated;
      currentPiece.col += offset;
      return;
    }
    if (!collide(board, { ...currentPiece, matrix: rotated }, 0, -offset)) {
      currentPiece.matrix = rotated;
      currentPiece.col -= offset;
      return;
    }
    offset += 1;
  }
  currentPiece.col = originalCol;
}

function resetGame() {
  board = createMatrix(ROWS, COLS);
  score = 0;
  level = 1;
  clearedLines = 0;
  dropInterval = 1000;
  dropCounter = 0;
  lastTime = 0;
  currentPiece = null;
  nextPiece = randomPiece();
  holdPiece = null;
  holdUsed = false;
  isGameOver = false;
  isPaused = false;
  updateScoreboard();
  drawBoard();
  drawMiniBoard(null, holdCells);
  drawMiniBoard(nextPiece, nextCells);
  spawnPiece();
  overlay.classList.remove("visible");
  overlay.classList.add("hidden");
}

function togglePause() {
  if (isGameOver) return;
  isPaused = !isPaused;
  overlayTitle.textContent = isPaused ? "일시 정지" : "";
  overlayMessage.textContent = isPaused
    ? "계속하려면 버튼을 누르거나 P 키를 누르세요."
    : "";
  overlayButton.textContent = "계속";
  overlay.classList.toggle("hidden", !isPaused);
  overlay.classList.toggle("visible", isPaused);
}

function endGame() {
  isGameOver = true;
  overlayTitle.textContent = "게임 오버";
  overlayMessage.textContent = `최종 점수: ${score.toLocaleString()}점`;
  overlayButton.textContent = "다시 플레이";
  overlay.classList.remove("hidden");
  overlay.classList.add("visible");
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!isPaused && !isGameOver) {
    dropCounter += delta;
    if (dropCounter >= dropInterval) {
      pieceDrop();
    }
    drawBoard();
    drawMiniBoard(holdPiece, holdCells);
  }

  requestAnimationFrame(update);
}

function handleKeyDown(event) {
  if (isGameOver) return;
  if (isPaused && event.key.toLowerCase() !== "p") {
    event.preventDefault();
    return;
  }
  switch (event.key) {
    case "ArrowLeft":
      movePiece(-1);
      break;
    case "ArrowRight":
      movePiece(1);
      break;
    case "ArrowDown":
      softDrop();
      break;
    case "ArrowUp":
      rotatePiece(1);
      break;
    case " ":
      event.preventDefault();
      hardDrop();
      break;
    case "Shift":
      holdCurrentPiece();
      break;
    case "p":
    case "P":
      togglePause();
      break;
    default:
      break;
  }
}

initializeBoardUI();
initializeMiniBoard(nextElement, nextCells);
initializeMiniBoard(holdElement, holdCells);

document.addEventListener("keydown", handleKeyDown);
startButton.addEventListener("click", resetGame);
overlayButton.addEventListener("click", () => {
  if (isPaused) {
    togglePause();
    return;
  }
  resetGame();
});

drawBoard();
drawMiniBoard(null, holdCells);
drawMiniBoard(nextPiece, nextCells);
spawnPiece();
requestAnimationFrame(update);
