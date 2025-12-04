// ======================================
// TEAM LIFE - CONWAY GAME OF LIFE
// Versió amb 4 equips, peces predefinides,
// món toroidal i detecció d'estat final
// ======================================

// ---------- Configuració del món ----------
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const CELL_SIZE = 10;

let cols, rows;
let grid, nextGrid;

// ---------- Estat de la simulació ----------
let isRunning = false;
let generation = 0;

// Guarda històries per detectar bucles
let previousGrid = null;      // ⭐ estat anterior
let twoStepsAgoGrid = null;   // ⭐ estat de fa dues generacions

// ---------- Estadístiques ----------
let teamCounts = [0, 0, 0, 0, 0];
let totalAlive = 0;

// ---------- UI ----------
let playPauseBtn, stepBtn, randomBtn, clearBtn, speedSlider;
let generationSpan, team1Span, team2Span, team3Span, team4Span;
let team1PercentSpan, team2PercentSpan, team3PercentSpan, team4PercentSpan;

let currentBrushTeam = 1;
let currentPiece = "none";

// ---------- Peces ----------
const PATTERNS = {
  block: [
    [1, 1],
    [1, 1],
  ],
  glider: [
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 1],
  ],
  lws: [
    [0, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0],
  ],
  loaf: [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 0],
  ],
};

// ======================================
// SETUP
// ======================================

function setup() {
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.parent("canvas-container");

  cols = floor(width / CELL_SIZE);
  rows = floor(height / CELL_SIZE);

  grid = createEmptyGrid();
  nextGrid = createEmptyGrid();

  setupUI();
  updateStatsDisplay();
}

function setupUI() {
  playPauseBtn = document.getElementById("play-pause-btn");
  stepBtn = document.getElementById("step-btn");
  randomBtn = document.getElementById("random-btn");
  clearBtn = document.getElementById("clear-btn");
  speedSlider = document.getElementById("speed-slider");

  generationSpan = document.getElementById("generation-counter");
  team1Span = document.getElementById("team1-count");
  team2Span = document.getElementById("team2-count");
  team3Span = document.getElementById("team3-count");
  team4Span = document.getElementById("team4-count");
  team1PercentSpan = document.getElementById("team1-percent");
  team2PercentSpan = document.getElementById("team2-percent");
  team3PercentSpan = document.getElementById("team3-percent");
  team4PercentSpan = document.getElementById("team4-percent");

  playPauseBtn.onclick = togglePlayPause;
  stepBtn.onclick = stepOnce;
  randomBtn.onclick = randomizeGrid;
  clearBtn.onclick = clearGrid;

  document.querySelectorAll('input[name="brush-team"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      currentBrushTeam = parseInt(radio.value);
    })
  );

  document.querySelectorAll("[data-piece]").forEach((btn) =>
    btn.addEventListener("click", () => {
      currentPiece = btn.dataset.piece;
      document
        .querySelectorAll(".piece-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    })
  );
}

// ======================================
// DRAW
// ======================================

function draw() {
  background(10);
  drawGrid();

  if (isRunning) {
    const speed = parseInt(speedSlider.value);
    const framesPerStep = int(map(speed, 1, 20, 15, 1));
    if (frameCount % framesPerStep === 0) nextGeneration();
  }
}

// ======================================
// INTERACCIÓ
// ======================================

function mousePressed() {
  if (!insideCanvas()) return;
  if (currentPiece === "none") paintSingleCell();
  else placeCurrentPiece();
}

function mouseDragged() {
  if (!insideCanvas()) return;
  if (currentPiece === "none") paintSingleCell();
}

function insideCanvas() {
  return mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;
}

// Pintar 1 cel·la
function paintSingleCell() {
  const x = floor(mouseX / CELL_SIZE);
  const y = floor(mouseY / CELL_SIZE);

  if (currentBrushTeam === 0) {
    grid[x][y] = 0;
  } else {
    if (!isInTeamZone(x, y, currentBrushTeam)) return;
    grid[x][y] = currentBrushTeam;
  }

  recomputeStats();
  updateStatsDisplay();
}

// Col·locar peça
function placeCurrentPiece() {
  const pattern = PATTERNS[currentPiece];
  if (!pattern) return;

  const ax = floor(mouseX / CELL_SIZE);
  const ay = floor(mouseY / CELL_SIZE);

  if (!canPlacePatternAt(ax, ay, currentBrushTeam, pattern)) return;

  for (let py = 0; py < pattern.length; py++) {
    for (let px = 0; px < pattern[0].length; px++) {
      if (pattern[py][px] === 1) {
        grid[ax + px][ay + py] = currentBrushTeam;
      }
    }
  }

  recomputeStats();
  updateStatsDisplay();
}

// ======================================
// FUNCIONS DE MÓN
// ======================================

function createEmptyGrid() {
  const g = [];
  for (let x = 0; x < cols; x++) {
    g[x] = [];
    for (let y = 0; y < rows; y++) g[x][y] = 0;
  }
  return g;
}

function drawGrid() {
  stroke(30);
  strokeWeight(1);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const s = grid[x][y];

      if (s === 0) fill(8, 10, 18);
      else if (s === 1) fill(0, 122, 241);
      else if (s === 2) fill(240, 70, 70);
      else if (s === 3) fill(255, 219, 0);
      else if (s === 4) fill(0, 200, 120);

      rect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  }

  // Línies quadrants
  stroke(60, 60, 100, 180);
  strokeWeight(2);
  line((cols / 2) * CELL_SIZE, 0, (cols / 2) * CELL_SIZE, height);
  line(0, (rows / 2) * CELL_SIZE, width, (rows / 2) * CELL_SIZE);
}

// ======================================
// NEXT GENERATION + DETECTOR DE FINAL
// ======================================

function nextGeneration() {
  // ⭐ Guardem estat antic per detectar bucles o immobilitat
  twoStepsAgoGrid = previousGrid;
  previousGrid = copyGrid(grid);

  let newCounts = [0, 0, 0, 0, 0];
  let alive = 0;

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const current = grid[x][y];

      let aliveNeighbours = 0;
      let neighbourTeams = [0, 0, 0, 0, 0];

      // ⭐ Wrap toroidal
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;

          const nx = (x + i + cols) % cols;
          const ny = (y + j + rows) % rows;

          const ns = grid[nx][ny];
          if (ns > 0) {
            aliveNeighbours++;
            neighbourTeams[ns]++;
          }
        }
      }

      let nextState = current;

      if (current > 0) {
        if (aliveNeighbours < 2 || aliveNeighbours > 3) nextState = 0;
      } else {
        if (aliveNeighbours === 3) {
          nextState = chooseMajorityTeam(neighbourTeams);
        }
      }

      nextGrid[x][y] = nextState;

      if (nextState > 0) {
        alive++;
        newCounts[nextState]++;
      }
    }
  }

  // Intercanvi
  const tmp = grid;
  grid = nextGrid;
  nextGrid = tmp;

  teamCounts = newCounts;
  totalAlive = alive;
  generation++;

  updateStatsDisplay();

  // ⭐ Comprovació de final de partida:
  if (previousGrid && gridsEqual(grid, previousGrid)) {
    endGame("STATIC");
  } else if (twoStepsAgoGrid && gridsEqual(grid, twoStepsAgoGrid)) {
    endGame("OSCILLATION");
  }
}

// ======================================
// ÚTILS PER FINAL DE PARTIDA
// ======================================

// Copiar graella
function copyGrid(g) {
  const out = [];
  for (let x = 0; x < cols; x++) out[x] = [...g[x]];
  return out;
}

// Comparar dues graelles
function gridsEqual(g1, g2) {
  if (!g1 || !g2) return false;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (g1[x][y] !== g2[x][y]) return false;
    }
  }
  return true;
}

// Quan el joc acaba:
function endGame(type) {
  isRunning = false;

  // Qui guanya?
  const winner = findWinnerTeam();

  let msg = "";
  if (winner === 0) msg = "GAME OVER – DRAW";
  else msg = `GAME OVER – TEAM ${winner} WINS!`;

  // Mostrar al navegador:
  alert(msg);
}

// Trobar equip guanyador
function findWinnerTeam() {
  const counts = teamCounts.slice(1); // [team1, team2, team3, team4]
  const max = Math.max(...counts);
  const winners = [];

  for (let i = 0; i < counts.length; i++) {
    if (counts[i] === max && max > 0) winners.push(i + 1);
  }

  if (winners.length === 1) return winners[0];
  return 0; // empat
}

// ======================================
// MÉS FUNCIONS BÀSIQUES
// ======================================

function chooseMajorityTeam(neighbours) {
  let max = 0;
  let candidates = [];

  for (let t = 1; t <= 4; t++) {
    if (neighbours[t] > max) max = neighbours[t];
  }
  for (let t = 1; t <= 4; t++) {
    if (neighbours[t] === max && max > 0) candidates.push(t);
  }

  if (candidates.length === 0) return 0;
  return candidates[floor(random(candidates.length))];
}

function isInTeamZone(x, y, team) {
  const halfX = cols / 2;
  const halfY = rows / 2;

  if (team === 1) return x < halfX && y < halfY;
  if (team === 2) return x >= halfX && y < halfY;
  if (team === 3) return x < halfX && y >= halfY;
  if (team === 4) return x >= halfX && y >= halfY;
  return false;
}

function canPlacePatternAt(ax, ay, team, pattern) {
  for (let py = 0; py < pattern.length; py++) {
    for (let px = 0; px < pattern[0].length; px++) {
      if (pattern[py][px] === 1) {
        const gx = ax + px;
        const gy = ay + py;

        if (!isInTeamZone(gx, gy, team)) return false;
      }
    }
  }
  return true;
}

function recomputeStats() {
  let c = [0, 0, 0, 0, 0];
  let alive = 0;

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const s = grid[x][y];
      if (s > 0) {
        alive++;
        c[s]++;
      }
    }
  }

  teamCounts = c;
  totalAlive = alive;
}

function updateStatsDisplay() {
  generationSpan.textContent = generation;

  const [_, a, b, c, d] = teamCounts;

  team1Span.textContent = a;
  team2Span.textContent = b;
  team3Span.textContent = c;
  team4Span.textContent = d;

  const pct = (n) => (totalAlive > 0 ? ((n / totalAlive) * 100).toFixed(1) : 0);

  team1PercentSpan.textContent = pct(a);
  team2PercentSpan.textContent = pct(b);
  team3PercentSpan.textContent = pct(c);
  team4PercentSpan.textContent = pct(d);
}

// CONTROL
function togglePlayPause() {
  isRunning = !isRunning;
  playPauseBtn.textContent = isRunning ? "Pause" : "Play";
}

function stepOnce() {
  if (!isRunning) nextGeneration();
}

function randomizeGrid() {
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const team = teamForPosition(x, y);
      grid[x][y] = random() < 0.2 ? team : 0;
    }
  }
  generation = 0;
  previousGrid = null;
  twoStepsAgoGrid = null;
  recomputeStats();
  updateStatsDisplay();
}

function clearGrid() {
  grid = createEmptyGrid();
  generation = 0;
  previousGrid = null;
  twoStepsAgoGrid = null;
  recomputeStats();
  updateStatsDisplay();
}

function teamForPosition(x, y) {
  const halfX = cols / 2;
  const halfY = rows / 2;

  if (x < halfX && y < halfY) return 1;
  if (x >= halfX && y < halfY) return 2;
  if (x < halfX && y >= halfY) return 3;
  if (x >= halfX && y >= halfY) return 4;
  return 0;
}
