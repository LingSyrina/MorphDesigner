import { createConfig } from './config.js';
import { Blob } from './blob.js';
import { drawBlob, drawAll, drawDraggablePoints, getAllPoints, interpolate2D } from './draw.js';
import { updateSidebar, updatePointInfo, getMousePos, exportBlobs } from './ui.js';

const state = {
  canvas: document.getElementById("canvas"),
  ctx: null,
  CONFIG: null,
  blobs: { A: null, B: null, C: null, D: null, M: null },
  userClicks: [],
  hoverPos: null,
  hoverHighlight: null,
  dragPoint: null,
  dragIndex: -1,
  isDragging: false,
  editMode: 'A',
  isPreviewing: false
};

state.ctx = state.canvas.getContext("2d");
state.CONFIG = createConfig(state.canvas);

//start with editing A
function resetAll() {
  state.CONFIG = createConfig(state.canvas, {
    numCtrls: parseInt(document.getElementById("ctrlCount").value)
  });
  state.blobs = { A: null, B: null, C: null, D: null, M: null };
  state.userClicks = [];
  state.editMode = 'A';
  console.log("Reset is drawing");
  drawAll(state);
}

// ****** Function for Js Loader ****** //

window.importBlobJson = function importBlobJson() {
  const input = document.getElementById("importBlobFile");
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      loadBlobsFromJson(data);
    } catch (err) {
      console.error("Failed to parse JSON:", err);
    }
  };
  reader.readAsText(file);
};

function loadBlobsFromJson(data) {
  // Might be re-derived later
  // Optional: keep this or let it compute
  const blobMap = {A: 'A',B: 'B',C: 'C',D: 'D', M: 'M'};
  for (const [key, value] of Object.entries(blobMap)) {
    if (data[key]) {
      const blob = new Blob(
        data[key].x,
        data[key].y,
        data[key].ctrlX1,
        data[key].ctrlY1,
        data[key].ctrlX2,
        data[key].ctrlY2
      );
      state.blobs[key] = blob;
      if (data[key].x) {
        state.CONFIG.numCtrls = data[key].x.length;
      }
    }
  } // After loading, draw everything
  drawAll(state);
  console.log("Blobs loaded and drawn.");
}


// **********  ********  ************* //



export const appState = state;
window.resetAll = resetAll;
window.exportBlobs = () => exportBlobs(state.blobs);
window.setEditMode = (mode) => {
  state.editMode = mode;
  const blob = state.blobs[state.editMode];
  const numAnchors = blob.x.length;
  const numCtrls = blob.ctrlX1.length;
  let anchorPoints = blob.x.map((x, i) => ({ x, y: blob.y[i], type: 'anchor', index: i }));
  let controlPoints = blob.ctrlX1.map((x, i) => ({ x, y: blob.ctrlY1[i], type: 'control', index: i }));
  if (state.editMode === 'B') {
    const halfA = Math.floor(numAnchors / 2);
    const halfC = Math.floor(numCtrls / 2);
    anchorPoints = anchorPoints.slice(halfA);
    controlPoints = controlPoints.slice(halfC);
  } else if (state.editMode === 'C') {
    const halfA = Math.floor(numAnchors / 2);
    const halfC = Math.floor(numCtrls / 2);
    anchorPoints = anchorPoints.slice(0, halfA);
    controlPoints = controlPoints.slice(0, halfC);
  }
  const points = anchorPoints.concat(controlPoints);
  state.hoverHighlight = points;
  drawAll(state);};

window.finishReference = () => {
  if (state.blobs.A) {
    const { numCtrls, ArcControl, distortionAmount } = state.CONFIG;
    state.blobs.B = new Blob(state.blobs.A.x, state.blobs.A.y, state.blobs.A.ctrlX1, state.blobs.A.ctrlY1);
    state.blobs.C = new Blob(state.blobs.A.x, state.blobs.A.y, state.blobs.A.ctrlX1, state.blobs.A.ctrlY1);
    state.editMode = null;
    console.log("finishReference is drawing");
    drawAll(state);
  }
};
window.enablePreview = () => {state.isPreviewing = true;};
window.disablePreview = () => {state.isPreviewing = false;};
window.GenerateMorphSpace = async function () {
  if (!state.blobs.A || !state.blobs.B || !state.blobs.C || !state.blobs.D) {
    alert("Make sure blobs A, B, C, and D exist first.");
    return;
  }
  const stepsX = parseInt(document.getElementById("morphX").value) || 20;
  const stepsY = parseInt(document.getElementById("morphY").value) || 3;
  const cellSize = 605; // pixels per blob cell
  const gridCanvas = document.createElement("canvas");
  gridCanvas.width = stepsX * cellSize;
  gridCanvas.height = stepsY * cellSize;
  const ctx = gridCanvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
  for (let j = 0; j < stepsY; j++) {
    const weightY = j / (stepsY - 1);
    for (let i = 0; i < stepsX; i++) {
      const weightX = i / (stepsX - 1);
      state.blobs.M = interpolate2D(state.blobs.A,state.blobs.B,state.blobs.C,state.blobs.D,weightX,weightY);
      const offset = [i * cellSize, j * cellSize];
      drawBlob(ctx, state.blobs.M, offset[0], offset[1], state.CONFIG); // assumes drawBlob uses offset correctly
    }
  }
  const imgDataUrl = gridCanvas.toDataURL("image/jpeg", 0.95); // use "image/png" if needed
  const link = document.createElement("a");
  link.href = imgDataUrl;
  link.download = "morph-grid.jpg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


state.canvas.addEventListener("mousemove", (e) => {
  state.hoverPos = getMousePos(e);
  //state.hoverHighlight = null;
  if (state.editMode === 'A' && !state.blobs.A) {
    drawAll(state);
  }
  if (state.editMode && state.blobs[state.editMode] && state.CONFIG.positions[state.editMode]) {
    const offset = state.CONFIG.positions[state.editMode];
    const localPos = {
      x: state.hoverPos.x - offset[0],
      y: state.hoverPos.y - offset[1]
    };
    const blob = state.blobs[state.editMode];
    const numAnchors = blob.x.length;
    const numCtrls = blob.ctrlX1.length;
    let anchorPoints = blob.x.map((x, i) => ({ x, y: blob.y[i], type: 'anchor', index: i }));
    let controlPoints = blob.ctrlX1.map((x, i) => ({ x, y: blob.ctrlY1[i], type: 'control', index: i }));
    if (state.editMode === 'B') {
      const halfA = Math.floor(numAnchors / 2);
      const halfC = Math.floor(numCtrls / 2);
      anchorPoints = anchorPoints.slice(halfA);
      controlPoints = controlPoints.slice(halfC);
    } else if (state.editMode === 'C') {
      const halfA = Math.floor(numAnchors / 2);
      const halfC = Math.floor(numCtrls / 2);
      anchorPoints = anchorPoints.slice(0, halfA);
      controlPoints = controlPoints.slice(0, halfC);
    }
    const points = anchorPoints.concat(controlPoints);
    state.hoverHighlight = points;
    // Handle dragging
    if (state.isDragging && state.dragPoint) {
      state.canvas.style.cursor = state.isDragging ? "grabbing" : "grab";
      const snapped = {
        x: Math.round(localPos.x / state.CONFIG.snapGrid) * state.CONFIG.snapGrid,
        y: Math.round(localPos.y / state.CONFIG.snapGrid) * state.CONFIG.snapGrid
      };
      const blob = state.blobs[state.editMode];
      if (state.dragPoint.type === "anchor") {
        blob.x[state.dragIndex] = snapped.x;
        blob.y[state.dragIndex] = snapped.y;
      } else if (state.dragPoint.type === "control") {
        blob.ctrlX1[state.dragIndex] = snapped.x;
        blob.ctrlY1[state.dragIndex] = snapped.y;
      }
      //blob.flipControlPoints();
      console.log("Drag is drawing");
      drawAll(state)
    }
  } else { // fallback if not editing
    state.canvas.style.cursor = "crosshair";
  }
  if (state.isPreviewing && state.blobs.B && state.blobs.C && state.blobs.A) {
    const canvasRect = state.canvas.getBoundingClientRect();
    const relX = (state.hoverPos.x - canvasRect.left) / state.canvas.width;
    const relY = (state.hoverPos.y - canvasRect.top) / state.canvas.height;
    const weightX = Math.max(0, Math.min(1, relX));
    const weightY = Math.max(0, Math.min(1, relY));
    state.blobs.M = interpolate2D(state.blobs.A, state.blobs.B, state.blobs.C, state.blobs.D, weightX, weightY);
    console.log("Preview is drawing");
    drawAll(state);
    }
  //drawAll(state);// Redraw on every move
});

state.canvas.addEventListener("mousedown", e => {
  const offset = state.CONFIG.positions[state.editMode];
  const localPos = {
    x: state.hoverPos.x - offset[0],
    y: state.hoverPos.y - offset[1]
  };
  const pos = getMousePos(e);
  const isCreatingA = state.editMode === 'A' && !state.blobs.A;
  if (isCreatingA && state.userClicks.length < state.CONFIG.numCtrls * 2) {
    const offset = state.CONFIG.positions.A;
    const boxSize = state.CONFIG.positionOffset;
    // Only accept points inside the defined region
    const withinBox =
      pos.x >= offset[0] &&
      pos.x <= offset[0] + boxSize &&
      pos.y >= offset[1] &&
      pos.y <= offset[1] + boxSize;
    if (!withinBox) return; // reject click
    state.userClicks.push({
      x: pos.x - offset[0],
      y: pos.y - offset[1]
    });
    if (state.userClicks.length === state.CONFIG.numCtrls * 2) {
      const anchor = state.userClicks.slice(0, state.CONFIG.numCtrls);
      const control = state.userClicks.slice(state.CONFIG.numCtrls);
      state.blobs.A = new Blob(anchor.map(p => p.x), anchor.map(p => p.y),
                         control.map(p => p.x), control.map(p => p.y));
      console.log("Immediately after creation:");
      console.log("ctrlX2:", state.blobs.A.ctrlX2);
      console.log("ctrlY2:", state.blobs.A.ctrlY2);
      state.userClicks = [];
      drawAll(state)
    }
    return;
  } else if (state.blobs[state.editMode]) {
    const pts = state.blobs[state.editMode].x.map((x, i) => ({ x, y: state.blobs[state.editMode].y[i], index: i, type: 'anchor' }))
      .concat(state.blobs[state.editMode].ctrlX1.map((x, i) => ({ x, y: state.blobs[state.editMode].ctrlY1[i], index: i, type: 'control' })));
    for (const pt of pts) {
      if (Math.hypot(localPos.x - pt.x, localPos.y - pt.y) < 8) {
        state.dragPoint = pt;
        state.dragIndex = pt.index;
        state.isDragging = true;
        break;
      }
    }
  }
});

state.canvas.addEventListener("mouseup", () => {
  state.dragPoint = null;
  state.dragIndex = -1;
  state.isDragging = false;
});

window.onload = () => {
  resetAll(); // already inside here
  console.log("Window is drawing");
  drawAll(state); // draw the empty canvas or starting layout
};
