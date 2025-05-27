export function createConfig(canvas, options = {}) {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const positionOffset = 600;
  return {
    canvasSize: canvasWidth, // optional — you can still keep this for square logic
    canvasHeight: canvasHeight,
    numCtrls: options.numCtrls || 3,
    snapGrid: 10,
    offset: 1.7,
    distortionAmount: 90,
    morphSpeed: 0.1,
    positionOffset: positionOffset,
    positions: {
      A: [0, 0],
      B: [canvasWidth-positionOffset, 0],
      C: [0, canvasHeight-positionOffset],
      D: [canvasWidth-positionOffset, canvasHeight-positionOffset],
      M: [(canvasWidth-positionOffset) / 2, (canvasHeight-positionOffset) / 2]
    },
    ArcControl: new Array(options.numCtrls || 3).fill(Math.PI / 2),
    styles: {
      fill: "rgba(122, 157, 128, 0.5)",
      stroke: "#000000",
      anchorColor: "#0084ff",
      ctrlColor: "#ff6600",
      previewColor: "#999999",
      highlightColor: "#00ff00"
    }
  };
}
