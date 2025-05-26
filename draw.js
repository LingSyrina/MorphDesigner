import { updateSidebar, updatePointInfo, getMousePos, exportBlobs } from './ui.js';
import { Blob } from './blob.js';

export function drawBlob(ctx, blob, offsetX, offsetY, config) {
  blob.flipControlPoints();
  ctx.beginPath();
  ctx.moveTo(blob.x[0] + offsetX, blob.y[0] + offsetY);
  for (let i = 0; i < config.numCtrls; i++) {
    const next = (i + 1) % config.numCtrls;
    ctx.bezierCurveTo(
      blob.ctrlX1[i] + offsetX, blob.ctrlY1[i] + offsetY,
      blob.ctrlX2[i] + offsetX, blob.ctrlY2[i] + offsetY,
      blob.x[next] + offsetX, blob.y[next] + offsetY
    );
  }
  ctx.fillStyle = config.styles.fill;
  ctx.fill();
}

export function getAllPoints(blob) {
  return blob.x.map((x, i) => ({ x, y: blob.y[i], type: 'anchor', index: i }))
    .concat(blob.ctrlX1.map((x, i) => ({ x, y: blob.ctrlY1[i], type: 'control', index: i })));
}

export function interpolate2D(A, B, C, D, tx, ty) {
  const AB = Blob.interpolate(A, B, tx); // top edge
  const CD = Blob.interpolate(C, D, tx); // bottom edge
  return Blob.interpolate(AB, CD, ty);   // vertical between top and bottom
}

export function drawAll(state) {
  const {
    ctx, canvas, CONFIG, blobs, userClicks,
    hoverPos, hoverHighlight, dragIndex, editMode, isPreviewing
  } = state;
  console.log("Draw called:", blobs.A);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (editMode === 'A' && !blobs.A) {
    const offset = CONFIG.positions.A;
    const boxSize = CONFIG.positionOffset;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    // Step 2: Cut out the editable area
    ctx.moveTo(offset[0], offset[1]);
    ctx.rect(offset[0], offset[1], boxSize, boxSize);
    ctx.fill("evenodd"); // fill outside the box only
    ctx.restore();
    ctx.beginPath();
    ctx.rect(offset[0], offset[1], boxSize, boxSize);
    ctx.strokeStyle = "#1a1a1a";
  }
  // Show raw points while building Reference A
  if (editMode === 'A' && (!blobs.A || userClicks.length < CONFIG.numCtrls * 2)) {
    for (let i = 0; i < userClicks.length; i++) {
      const p = userClicks[i];
      const isAnchor = i < CONFIG.numCtrls;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = isAnchor ? CONFIG.styles.anchorColor : CONFIG.styles.ctrlColor;
      ctx.fill();
    }
  // Preview point under hover (only when creating A)
  if (editMode === 'A' && !blobs.A && hoverPos && userClicks.length < CONFIG.numCtrls * 2) {
      ctx.beginPath();
      ctx.arc(hoverPos.x, hoverPos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.styles.previewColor;
      ctx.fill();
    }
  }
  if (['A', 'B', 'C'].includes(editMode) && blobs[editMode]) {
    drawDraggablePoints(state, blobs[editMode], editMode);
  }
  // D and M computation
  if (blobs.B && blobs.C) {
    const mid = Math.floor(blobs.B.x.length / 2);
    const x = [...blobs.C.x.slice(0, mid),...blobs.B.x.slice(mid)];
    const y = [...blobs.C.y.slice(0, mid),...blobs.B.y.slice(mid)];
    const ctrlX1 = [...blobs.C.ctrlX1.slice(0, mid),...blobs.B.ctrlX1.slice(mid)];
    const ctrlY1 = [...blobs.C.ctrlY1.slice(0, mid),...blobs.B.ctrlY1.slice(mid)];
    blobs.D = new Blob(x, y, ctrlX1, ctrlY1);
    if (!isPreviewing && blobs.A) {
      const AB = Blob.interpolate(blobs.A, blobs.B, 0.5);
      const CD = Blob.interpolate(blobs.C, blobs.D, 0.5);
      blobs.M = Blob.interpolate(AB, CD, 0.5);
    }
  }
  for (const k in CONFIG.positions) {
    //if (editMode === 'A' && k !== 'A') continue;  // only show A during edit
    const pos = CONFIG.positions[k];
    if (blobs[k]) drawBlob(ctx, blobs[k], pos[0], pos[1], CONFIG);
  }
  updateSidebar(CONFIG, editMode, blobs, userClicks);
  updatePointInfo(blobs[editMode], CONFIG, dragIndex);
}

export function drawDraggablePoints(state, blob, key) {
  const { ctx, CONFIG, hoverHighlight, editMode } = state;
  const offset = CONFIG.positions[key];
  if (hoverHighlight && editMode === key) {
    for (const pt of hoverHighlight){
      ctx.beginPath();
      ctx.arc(pt.x + offset[0], pt.y + offset[1], 6, 0, Math.PI * 2);
      ctx.fillStyle = pt.type === 'anchor' ? CONFIG.styles.anchorColor : CONFIG.styles.ctrlColor;
      ctx.fill();}
  }
}
