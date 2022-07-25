import p5 from "p5";
import Heap from "heap-js";

type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
type ColorAndError = {
  color: number;
  error: number;
};
type Quad = {
  rect: Rect;
  score: number;
  color: string;
};

new p5((p: p5) => {
  const iterations = 1000;
  const INF = 9999;
  const minSize = 4;
  const areaPower = 0.2;
  let img: p5.Image;
  let heap: Heap<Quad>;

  p.preload = () => {
    img = p.loadImage("input.png");
  };

  p.setup = () => {
    p.createCanvas(img.width, img.height);
    p.stroke("#000");
    p.strokeWeight(1);

    heap = new Heap((a, b) => b.score - a.score);

    img.loadPixels();
    const root = createQuad({ left: 0, right: img.width - 1, top: 0, bottom: img.height - 1 });
    heap.push(root);
    render(root);
  };

  p.draw = () => {
    if (p.frameCount >= iterations) {
      return;
    }

    const quad = heap.pop();
    if (quad) {
      const rects = split(quad.rect);
      for (const rect of rects) {
        const child = createQuad(rect);
        heap.push(child);
        render(child);
      }
    }
  };

  const render = (quad: Quad): void => {
    const { left, right, top, bottom } = quad.rect;

    p.fill(quad.color);
    p.rect(left, top, right - left + 1, bottom - top + 1);
  };

  const calcColorAndError = (rect: Rect, colorIndex: number): ColorAndError => {
    const hist = getRectColor(rect, colorIndex);
    const total = hist.reduce((prev, cur, i) => prev + cur * i, 0);
    const num = hist.reduce((prev, cur) => prev + cur, 0);
    const avg = total / num;
    const error = (hist.reduce((prev, cur, i) => prev + cur * (i - avg) ** 2, 0) / num) ** 0.5;

    return { color: Math.floor(avg), error };
  };

  const calcArea = (rect: Rect): number => {
    return (rect.right - rect.left + 1) * (rect.bottom - rect.top + 1);
  };

  const createQuad = (rect: Rect): Quad => {
    const r = calcColorAndError(rect, 0);
    const g = calcColorAndError(rect, 1);
    const b = calcColorAndError(rect, 2);
    const color = p.color(r.color, g.color, b.color).toString();
    const error = r.error * 0.2989 + g.error * 0.587 + b.error * 0.114;
    let score = error * calcArea(rect) ** areaPower;

    if (rect.right - rect.left + 1 <= minSize || rect.bottom - rect.top + 1 <= minSize) {
      score = -INF;
    }

    return { rect, score, color };
  };

  const getRectColor = (rect: Rect, colorIndex: number): number[] => {
    const ret = new Array(256).fill(0);
    for (let y = rect.top; y <= rect.bottom; y++) {
      for (let x = rect.left; x <= rect.right; x++) {
        const index = (y * img.width + x) * 4 + colorIndex;
        const value = img.pixels[index];
        ret[value]++;
      }
    }

    return ret;
  };

  const split = (rect: Rect): Rect[] => {
    const centerX = Math.floor((rect.left + rect.right) / 2);
    const centerY = Math.floor((rect.top + rect.bottom) / 2);

    return [
      {
        left: rect.left,
        right: centerX - 1,
        top: rect.top,
        bottom: centerY - 1,
      },
      {
        left: centerX,
        right: rect.right,
        top: rect.top,
        bottom: centerY - 1,
      },
      {
        left: rect.left,
        right: centerX - 1,
        top: centerY,
        bottom: rect.bottom,
      },
      {
        left: centerX,
        right: rect.right,
        top: centerY,
        bottom: rect.bottom,
      },
    ];
  };
});
