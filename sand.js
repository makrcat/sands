//@ts-check
import { GameCanvas } from "./game_engine.js";
import { Line } from "./game_engine.js";
import { startGame } from "./game_utils.js";

const canvas = document.getElementById("canvas");
const gameCanvas = new GameCanvas(canvas);
const GAME_CTX = gameCanvas.ctx;

let mouseDown = false;

//@ts-ignore
canvas.addEventListener('mousedown', (e) => {
  mouseDown = true;
  updateCoordinates(e); // update mouse position immediately
});

//@ts-ignore
canvas.addEventListener('mouseup', (e) => {
  mouseDown = false;
});

//@ts-ignore
canvas.addEventListener('mousemove', (e) => {
  if (mouseDown) {
    updateCoordinates(e);
  }
});



function make2DArray(cols, rows) {
  let arr = new Array(cols);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
    // Fill the array with nulls
    for (let j = 0; j < arr[i].length; j++) {
      arr[i][j] = null;
    }
  }
  return arr;
}

function withinCols(i) {
  return i >= 0 && i <= cols - 1;
}
function withinRows(j) {
  return j >= 0 && j <= rows - 1;
}

///////////////////define variables/////////////////////

const cellw = 2;
//@ts-ignore
const rows = Math.floor(canvas.clientHeight / cellw);
//@ts-ignore
const cols = Math.floor(canvas.clientWidth / cellw);

const gravity = 0.1;
let hueValue = 200;

class Particle {
  constructor(vx, vy, hue) {
    this.color = `hsla(${hue}, 100%, 70%, 1)`;
    this.vx = vx;
    this.vy = vy;
  }
}

document.onmousemove = updateCoordinates;
let clientX = 0;
let clientY = 0;

function updateCoordinates(e) {
  clientX = e.clientX;
  clientY = e.clientY;
  // console.log("Mouse coordinates", clientX, clientY);
}

let grid = make2DArray(cols, rows);

//////////////////game!////////////////////////////////

function logic() {
  if (mouseDown) {
    let mouseCol = Math.floor(clientX / cellw);
    let mouseRow = Math.floor(clientY / cellw);

    let matrix = 1;
    let extent = Math.floor(matrix / 2);
    for (let i = -extent; i <= extent; i++) {
      for (let j = -extent; j <= extent; j++) {
        if (Math.random() < 0.75) {
          let col = mouseCol + i;
          let row = mouseRow + j;
          if (withinCols(col) && withinRows(row)) {
            grid[col][row] = new Particle(0, 0, hueValue);
          }
        }
      }
    }
    }

  // Slowly change color hue
  hueValue += 0.5;
  if (hueValue > 360) hueValue = 1;

  // Draw all particles
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let p = grid[i][j];
      if (p == null) continue;

      // Adjust alpha based on vertical velocity (vy)
      let alpha = p.vy !== 0 ? 0.5 : 1;
      // Replace last alpha in color string with dynamic alpha
      GAME_CTX.fillStyle = p.color.replace(/, 1\)$/, `, ${alpha})`);

      GAME_CTX.fillRect(i * cellw, j * cellw, cellw, cellw);
    }
  }

  // Create next grid frame
  let nextGrid = make2DArray(cols, rows);

  // Sand falling logic (bottom-up)
  for (let i = 0; i < cols; i++) {
    for (let j = rows - 1; j >= 0; j--) {
      let p = grid[i][j];
      if (p == null) continue;

      // Reset velocity before update (default 0 = resting)
      p.vy = 0;

      // Try to move particle down
      if (withinRows(j + 1) && grid[i][j + 1] == null) {
        p.vy = gravity;  // falling down
        nextGrid[i][j + 1] = p; // move down
      } else {
        // Try to move diagonally down-left or down-right randomly
        let dir = Math.random() < 0.5 ? -1 : 1;
        if (
          withinCols(i + dir) &&
          withinRows(j + 1) &&
          grid[i + dir][j + 1] == null
        ) {
          p.vy = gravity;  // sliding diagonally down
          nextGrid[i + dir][j + 1] = p;
        } else if (
          withinCols(i - dir) &&
          withinRows(j + 1) &&
          grid[i - dir][j + 1] == null
        ) {
          p.vy = gravity;  // sliding diagonally other side
          nextGrid[i - dir][j + 1] = p;
        } else {
          p.vy = 0;  // resting
          nextGrid[i][j] = p; // stay in place
        }
      }
    }
  }

  grid = nextGrid;
}

export function gameLoop() {
  logic();
}

startGame();



