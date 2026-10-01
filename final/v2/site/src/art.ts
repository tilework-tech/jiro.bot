const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`failed to load ${src}`));
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

export function crispContext(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
