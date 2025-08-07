//@ts-check
import { GameCanvas } from "./game_engine.js";
import { Line } from "./game_engine.js";
import { startGame } from "./game_utils.js";


////eeeeverythign is fine

let eraser = false;

const eraserCheckbox = document.getElementById("eraser");
// typescript AGUHG

eraserCheckbox.addEventListener("change", () => {
  eraser = eraserCheckbox.checked;
  console.log("Eraser is now:", eraser ? "ON" : "OFF");
});

let brushSize = 4; 

const brushSizeInput = document.getElementById("brush-size-input");

brushSize = parseInt(brushSizeInput.value, 10);

brushSizeInput.addEventListener("input", () => {
  brushSize = parseInt(brushSizeInput.value, 10);
});




/// everything is fine guys
const hueSlider = document.getElementById("hue-slider");
const hueValueEl = document.getElementById("hue-value");
const huePreview = document.getElementById("hue-preview");

let hueValue = parseInt(hueSlider.value, 10); 

// Create style tag for dynamic thumb color
const styleTag = document.createElement('style');
styleTag.id = 'hue-thumb-style';
document.head.appendChild(styleTag);


function updateHueUI(hue) {
  if (hueValueEl) hueValueEl.textContent = hue;
  if (huePreview) huePreview.style.backgroundColor = `hsla(${hue}, 100%, 50%, 50%)`;

  // Update thumb color (Chrome/WebKit)
  hueSlider.style.setProperty('--thumb-color', `hsla(${hue}, 100%, 50%, 50%)`);

  // For Firefox and Safari (fallback)
  const thumbStyle = `
    #hue-slider::-webkit-slider-thumb {
      background-color: hsl(${hue}, 100%, 50%);
    }
    #hue-slider::-moz-range-thumb {
      background-color: hsl(${hue}, 100%, 50%);
    }
  `;
  styleTag.textContent = thumbStyle;
  hueValue = parseInt(hueSlider.value, 10); 
}

hueSlider.addEventListener("input", () => {
  const hue = parseInt(hueSlider.value, 10);
  updateHueUI(hue);
});

// Initial update
updateHueUI(parseInt(hueSlider.value, 10));


import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


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

const cellw = 4;
//@ts-ignore
const rows = Math.floor(canvas.clientHeight / cellw);
//@ts-ignore
const cols = Math.floor(canvas.clientWidth / cellw);

const gravity = 0.1;

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

/**
 * @param {MouseEvent} e
 */
function updateCoordinates(e) {
  //@ts-ignore
  const rect = canvas.getBoundingClientRect();
  clientX = e.clientX - rect.left;
  clientY = e.clientY - rect.top;
  // console.log("Mouse coordinates", clientX, clientY);
}

let grid = make2DArray(cols, rows);

//////////////////game!////////////////////////////////

function logic() {
  if (mouseDown) {
    let mouseCol = Math.floor(clientX / cellw);
    let mouseRow = Math.floor(clientY / cellw);

    let matrix = brushSize;
    let extent = Math.floor(matrix / 2);
    
    for (let i = -extent; i <= extent; i++) {
      for (let j = -extent; j <= extent; j++) {
        if (Math.random() < 0.75) {
          let col = mouseCol + i;
          let row = mouseRow + j;
          if (withinCols(col) && withinRows(row)) {
            if (eraser) {
              grid[col][row] = null; // or 0, or undefined depending on your system
            } else {
              if (!grid[col][row]) {
                
                grid[col][row] = new Particle(0, 0, hueValue);
              }
            }
          }
        }
      }
    }
  }


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



export function exportJar() {
  const hslGrid = make2DArray(cols, rows);

  // Regex to match hsl or hsla colors like:
  // hsl(210, 50%, 40%) or hsla(210, 50%, 40%, 0.5)
  const hslRegex = /hsl(a)?\(\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)%\s*,\s*(\d+\.?\d*)%/i;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const p = grid[i][j];
      if (p && typeof p.color === "string") {
        const match = p.color.match(hslRegex);
        if (match) {
          const h = parseFloat(match[2]);
          const s = parseFloat(match[3]);
          const l = parseFloat(match[4]);
          hslGrid[i][j] = [h, s, l];
        } else {
          console.warn(`Invalid color format at col ${i}, row ${j}:`, p.color);
          hslGrid[i][j] = null;
        }
      } else {
        hslGrid[i][j] = null;
      }
    }
  }

  grid = make2DArray(cols, rows);

  return hslGrid;
}



// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAhDMMUFPTf4IHIrzFkXmMzYNFJaA1ftdU",
  authDomain: "sands-446ea.firebaseapp.com",
  projectId: "sands-446ea",
  storageBucket: "sands-446ea.appspot.com",
  messagingSenderId: "1045402590545",
  appId: "1:1045402590545:web:d0cca450b4d08eb4d2c770"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Save the grid
 * @param {number} x
 * @param {number} y
 */
export async function save(x, y) {
  try {
    const counterRef = doc(db, "sands", "counter");
    const counterSnap = await getDoc(counterRef);

    let num = 0;
    if (counterSnap.exists()) {
      const data = counterSnap.data();
      num = data.num;
    }

    const grid = exportJar();
    const gridString = JSON.stringify(grid);

    const gridRef = doc(db, "sands", String(num));
    await setDoc(gridRef, {
      x: x,
      y: y,
      grid: gridString
    });

    await setDoc(counterRef, { num: num + 1 });

    console.log(`✅ Grid saved to sands/${num}`);
  } catch (error) {
    console.error("❌ Error saving grid:", error);
  }


  load();
}


window.done = function () {
  save(10, 5);
};


export async function load() {
  const sandsRef = collection(db, "sands");
  const querySnapshot = await getDocs(sandsRef);

  const container = document.getElementById("jars");
  if (!container) {
    console.error('Element with id "jars" not found.');
    return;
  }
  container.innerHTML = "";

  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "10px";

  querySnapshot.forEach((docSnap) => {
    if (docSnap.id !== "counter") {
      const data = docSnap.data();
      const x = data.x;
      const y = data.y;
      const grid = JSON.parse(data.grid);

      // Create wrapper div with class "mini"
      const wrapper = document.createElement("div");
      wrapper.classList.add("mini");

      // Create canvas element (no class)
      const canvas = document.createElement("canvas");
      const cellSize = 2;
      canvas.width = grid.length * cellSize;
      canvas.height = grid[0].length * cellSize;
      canvas.style.border = "1px solid lightgray";

      wrapper.appendChild(canvas);
      container.appendChild(wrapper);

      const ctx = canvas.getContext("2d");
      for (let col = 0; col < grid.length; col++) {
        for (let row = 0; row < grid[col].length; row++) {
          if (!grid[col][row]) continue;
          const [h, s, l] = grid[col][row];
          ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }

      const label = document.createElement("div");
      label.textContent = `#${docSnap.id}`;
      label.style.fontSize = "12px";
      label.style.color = "white";
      label.style.marginBottom = "4px";
      container.appendChild(label);
    }
  });

  console.log("✅ Finished creating all canvases.");
}

window.load = load;
