function cloneArray(arr) {
  return JSON.parse(JSON.stringify(arr));
}

function flipped(px, py, cx, cy) {
  return [(cx - px) + cx, (cy - py) + cy];
}

export class Blob {
  constructor(x, y, ctrlX, ctrlY) {
    this.x = cloneArray(x);
    this.y = cloneArray(y);
    this.ctrlX1 = cloneArray(ctrlX);
    this.ctrlY1 = cloneArray(ctrlY);
    this.ctrlX2 = new Array(x.length).fill(0);
    this.ctrlY2 = new Array(y.length).fill(0);
    //this.flipControlPoints();
  }

  flipControlPoints() {
    for (let i = 0; i < this.x.length; i++) {
      const next = (i + 1) % this.x.length;
      const [fx, fy] = flipped(this.ctrlX1[next], this.ctrlY1[next], this.x[next], this.y[next]);
      this.ctrlX2[i] = fx;
      this.ctrlY2[i] = fy;
    }
  }

  distort(ctrlIndex, angle, distance) {
    this.ctrlX1[ctrlIndex] += Math.cos(angle) * distance;
    this.ctrlY1[ctrlIndex] += Math.sin(angle) * distance;
  }

  copyFrom(blob) {
    this.x = [...blob.x];
    this.y = [...blob.y];
    this.ctrlX1 = [...blob.ctrlX1];
    this.ctrlY1 = [...blob.ctrlY1];
    //this.flipControlPoints();
  }

  static interpolate(blob1, blob2, ratio) {
    const lerp = (a, b) => a + (b - a) * ratio;
    const x = blob1.x.map((v, i) => lerp(v, blob2.x[i], ratio));
    const y = blob1.y.map((v, i) => lerp(v, blob2.y[i], ratio));
    const cx = blob1.ctrlX1.map((v, i) => lerp(v, blob2.ctrlX1[i], ratio));
    const cy = blob1.ctrlY1.map((v, i) => lerp(v, blob2.ctrlY1[i], ratio));
    return new Blob(x, y, cx, cy);
  }
}
