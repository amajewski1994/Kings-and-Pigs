import { useMemo } from "react";
import { Texture, Rectangle } from "pixi.js";

type TileMapProps = {
    tileset: Texture;
    map: number[][];
    tileSize?: number;

    offsetX?: number;
    offsetY?: number;

    gapX?: number;
    gapY?: number;

    worldX?: number;
    worldY?: number;
};

export function TileMap({
    tileset,
    map,
    tileSize = 32,
    offsetX = 32,
    offsetY = 32,
    gapX = 2,
    gapY = 2,
    worldX = 0,
    worldY = 0,
}: TileMapProps) {
    const { sheetCols, tileCount } = useMemo(() => {
        const usableW = tileset.source.width - offsetX;
        const usableH = tileset.source.height - offsetY;

        const sheetCols = Math.floor((usableW + gapX) / (tileSize + gapX));
        const sheetRows = Math.floor((usableH + gapY) / (tileSize + gapY));

        return { sheetCols, tileCount: sheetCols * sheetRows };
    }, [tileset, tileSize, offsetX, offsetY, gapX, gapY]);

    const tileTextures = useMemo(() => {
        return Array.from({ length: tileCount }, (_, index) => {
            const col = index % sheetCols;
            const row = Math.floor(index / sheetCols);

            const x = offsetX + col * (tileSize + gapX);
            const y = offsetY + row * (tileSize + gapY);

            return new Texture({
                source: tileset.source,
                frame: new Rectangle(x, y, tileSize, tileSize),
            });
        });
    }, [tileset, tileCount, sheetCols, tileSize, offsetX, offsetY, gapX, gapY]);

    return (
        <pixiContainer>
            {map.map((row, y) =>
                row.map((tileIndex, x) => {
                    if (tileIndex < 0) return null; // <-- puste pole = nie rysujemy
                    return (
                        <pixiSprite
                            key={`${x}-${y}`}
                            texture={tileTextures[tileIndex]}
                            x={worldX + x * tileSize}
                            y={worldY + y * tileSize}
                        />
                    );
                })
            )}

        </pixiContainer>
    );
}
