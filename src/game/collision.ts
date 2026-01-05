import type { WallTiles } from "./shapeGen";

export function makeSolidSet(wall: WallTiles) {
    return new Set<number>([
        wall.tl, wall.t, wall.tr,
        wall.l, wall.r,
        wall.bl, wall.b, wall.br,
        wall.innerTL, wall.innerTR, wall.innerBL, wall.innerBR,
    ]);
}

export type Rect = { x: number; y: number; w: number; h: number };

function isSolidAt(
    map: number[][],
    solid: Set<number>,
    tx: number,
    ty: number
) {
    if (ty < 0 || ty >= map.length) return true;
    if (tx < 0 || tx >= map[0].length) return true;
    const v = map[ty][tx];
    return v >= 0 && solid.has(v);
}

function rectToTileRange(r: Rect, tileSize: number) {
    const left = Math.floor(r.x / tileSize);
    const right = Math.floor((r.x + r.w - 1) / tileSize);
    const top = Math.floor(r.y / tileSize);
    const bottom = Math.floor((r.y + r.h - 1) / tileSize);
    return { left, right, top, bottom };
}

function touchesGround(map: number[][], solid: Set<number>, tileSize: number, rect: Rect) {
    const probe: Rect = { ...rect, y: rect.y + 1 };
    const { left, right, bottom } = rectToTileRange(probe, tileSize);
    for (let tx = left; tx <= right; tx++) {
        if (isSolidAt(map, solid, tx, bottom)) return true;
    }
    return false;
}

export function moveWithTileCollision(params: {
    map: number[][];
    solid: Set<number>;
    tileSize: number;
    rect: Rect;
    vx: number;
    vy: number;
    dt: number;
}) {
    const { map, solid, tileSize, dt } = params;
    let { rect, vx, vy } = params;

    rect = { ...rect, x: rect.x + vx * dt };
    {
        const { left, right, top, bottom } = rectToTileRange(rect, tileSize);

        if (vx > 0) {
            for (let ty = top; ty <= bottom; ty++) {
                if (isSolidAt(map, solid, right, ty)) {
                    rect.x = right * tileSize - rect.w;
                    vx = 0;
                    break;
                }
            }
        } else if (vx < 0) {
            for (let ty = top; ty <= bottom; ty++) {
                if (isSolidAt(map, solid, left, ty)) {
                    rect.x = (left + 1) * tileSize;
                    vx = 0;
                    break;
                }
            }
        }
    }

    rect = { ...rect, y: rect.y + vy * dt };
    let grounded = false;
    {
        const { left, right, top, bottom } = rectToTileRange(rect, tileSize);

        if (vy > 0) {
            for (let tx = left; tx <= right; tx++) {
                if (isSolidAt(map, solid, tx, bottom)) {
                    rect.y = bottom * tileSize - rect.h;
                    vy = 0;
                    grounded = true;
                    break;
                }
            }
        } else if (vy < 0) {
            for (let tx = left; tx <= right; tx++) {
                if (isSolidAt(map, solid, tx, top)) {
                    rect.y = (top + 1) * tileSize;
                    vy = 0;
                    break;
                }
            }
        }
    }

    grounded = grounded || touchesGround(map, solid, tileSize, rect);
    return { rect, vx, vy, grounded };
}
