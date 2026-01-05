import { Rectangle, Texture } from "pixi.js";

export function sliceGrid(tex: Texture, tileW: number, tileH: number, gapX = 0, gapY = 0, offsetX = 0, offsetY = 0) {
    const usableW = tex.source.width - offsetX;
    const usableH = tex.source.height - offsetY;

    const cols = Math.floor((usableW + gapX) / (tileW + gapX));
    const rows = Math.floor((usableH + gapY) / (tileH + gapY));
    const count = cols * rows;

    const frames = Array.from({ length: count }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        const x = offsetX + col * (tileW + gapX);
        const y = offsetY + row * (tileH + gapY);

        return new Texture({
            source: tex.source,
            frame: new Rectangle(x, y, tileW, tileH),
        });
    });

    return { frames, cols, rows };
}

export function sliceRect(tex: Texture, x: number, y: number, w: number, h: number) {
    return new Texture({
        source: tex.source,
        frame: new Rectangle(x, y, w, h),
    });
}
