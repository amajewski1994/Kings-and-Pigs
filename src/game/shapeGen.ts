export type WallTiles = {
    tl: number;
    t: number;
    tr: number;
    l: number;
    r: number;
    bl: number;
    b: number;
    br: number;

    innerTL: number;
    innerTR: number;
    innerBL: number;
    innerBR: number;
};

type Mask = boolean[][];

function makeMask(w: number, h: number, initial = false): Mask {
    return Array.from({ length: h }, () => Array.from({ length: w }, () => initial));
}

function fillRect(mask: Mask, x0: number, y0: number, w: number, h: number, value = true) {
    for (let y = y0; y < y0 + h; y++) {
        if (y < 0 || y >= mask.length) continue;
        for (let x = x0; x < x0 + w; x++) {
            if (x < 0 || x >= mask[0].length) continue;
            mask[y][x] = value;
        }
    }
}

export function makeMapFromMask(
    mask: boolean[][],
    floor: number,
    wall: WallTiles,
    empty = -1
) {
    const h = mask.length;
    const w = mask[0].length;

    const inMask = (x: number, y: number) =>
        y >= 0 && y < h && x >= 0 && x < w && mask[y][x];

    const map: number[][] = Array.from({ length: h }, () =>
        Array.from({ length: w }, () => empty)
    );

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (!mask[y][x]) continue;

            const top = inMask(x, y - 1);
            const bottom = inMask(x, y + 1);
            const left = inMask(x - 1, y);
            const right = inMask(x + 1, y);

            const tlD = inMask(x - 1, y - 1);
            const trD = inMask(x + 1, y - 1);
            const blD = inMask(x - 1, y + 1);
            const brD = inMask(x + 1, y + 1);

            if (top && left && !tlD) {
                map[y][x] = wall.innerBR;
                continue;
            }
            if (top && right && !trD) {
                map[y][x] = wall.innerBL;
                continue;
            }
            if (bottom && left && !blD) {
                map[y][x] = wall.innerTR;
                continue;
            }
            if (bottom && right && !brD) {
                map[y][x] = wall.innerTL;
                continue;
            }

            if (top && bottom && left && right) {
                map[y][x] = floor;
                continue;
            }

            const outTop = !top;
            const outBottom = !bottom;
            const outLeft = !left;
            const outRight = !right;

            if (outTop && outLeft) map[y][x] = wall.tl;
            else if (outTop && outRight) map[y][x] = wall.tr;
            else if (outBottom && outLeft) map[y][x] = wall.bl;
            else if (outBottom && outRight) map[y][x] = wall.br;
            else if (outTop) map[y][x] = wall.t;
            else if (outBottom) map[y][x] = wall.b;
            else if (outLeft) map[y][x] = wall.l;
            else if (outRight) map[y][x] = wall.r;
            else map[y][x] = floor;
        }
    }

    return map;
}

export function makeSampleShapeMap(
    width: number,
    height: number,
    floor: number,
    wall: WallTiles
) {
    const mask = makeMask(width, height, false);

    fillRect(mask, 10, 3, 13, 9, true);

    fillRect(mask, 2, 3, 9, 5, true);

    fillRect(mask, 9, 6, 2, 2, true);

    return makeMapFromMask(mask, floor, wall, -1);
}
