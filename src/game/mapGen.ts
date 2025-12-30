export type WallTiles = {
    tl: number;
    t: number;
    tr: number;
    l: number;
    r: number;
    bl: number;
    b: number;
    br: number;
};

export function makeRoomMap(
    width: number,
    height: number,
    floor: number,
    wall: WallTiles
) {
    const map: number[][] = [];

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            const isLeft = x === 0;
            const isRight = x === width - 1;
            const isTop = y === 0;
            const isBottom = y === height - 1;

            if (isTop && isLeft) row.push(wall.tl);
            else if (isTop && isRight) row.push(wall.tr);
            else if (isBottom && isLeft) row.push(wall.bl);
            else if (isBottom && isRight) row.push(wall.br);
            else if (isTop) row.push(wall.t);
            else if (isBottom) row.push(wall.b);
            else if (isLeft) row.push(wall.l);
            else if (isRight) row.push(wall.r);
            else row.push(floor);
        }
        map.push(row);
    }

    return map;
}
