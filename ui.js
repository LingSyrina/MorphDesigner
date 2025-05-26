export function updateSidebar(config, editMode, blobs, userClicks) {
  document.getElementById("status").textContent = editMode ? `Editing ${editMode}` : "Viewing";
  const activeBlob = blobs[editMode];
  document.getElementById("pointCount").textContent = activeBlob?.x.length || userClicks.length;
  document.getElementById("totalPoints").textContent = config.numCtrls * 2;
}

export function updatePointInfo(blob, config, highlightIndex) {
  const info = document.getElementById("infoContent");
  if (!blob) {
    info.textContent = "No data.";
    return;
  }
  let lines = [];
  for (let i = 0; i < config.numCtrls; i++) {
    const x = blob.x[i].toFixed(1), y = blob.y[i].toFixed(1);
    const cx = blob.ctrlX1[i].toFixed(1), cy = blob.ctrlY1[i].toFixed(1);
    lines.push(`P${i}: x=${x}, y=${y} | ctrlX=${cx}, ctrlY=${cy}`);
  }
  if (highlightIndex !== null && highlightIndex !== undefined) {
    lines[highlightIndex] = "➤ " + lines[highlightIndex];
  }
  info.textContent = lines.join("\n");
}

export function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

export function exportBlobs(blobs) {
  const data = JSON.stringify(blobs, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "blobs.json";
  link.click();
}
