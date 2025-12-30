import { useMemo, useState } from "react";
import { Rectangle, Texture } from "pixi.js";

type TilePaletteProps = {
    tileset: Texture;
    tileSize?: number;

    offsetX?: number;
    offsetY?: number;

    gapX?: number;
    gapY?: number;

    padding?: number;
    columns?: number;
    onPick?: (index: number) => void;
};

function makeTileTexture(
    tileset: Texture,
    index: number,
    sheetCols: number,
    tileSize: number,
    offsetX: number,
    offsetY: number,
    gapX: number,
    gapY: number
) {
    const col = index % sheetCols;
    const row = Math.floor(index / sheetCols);

    const x = offsetX + col * (tileSize + gapX);
    const y = offsetY + row * (tileSize + gapY);

    return new Texture({
        source: tileset.source,
        frame: new Rectangle(x, y, tileSize, tileSize),
    });
}

export function TilePalette({
    tileset,
    tileSize = 32,
    offsetX = 32,
    offsetY = 32,
    gapX = 2,
    gapY = 2,
    padding = 4,
    columns,
    onPick,
}: TilePaletteProps) {
    const [selected, setSelected] = useState<number | null>(null);

    const { sheetCols, sheetRows, tileCount } = useMemo(() => {
        const usableW = tileset.source.width - offsetX;
        const usableH = tileset.source.height - offsetY;

        const sheetCols = Math.floor((usableW + gapX) / (tileSize + gapX));
        const sheetRows = Math.floor((usableH + gapY) / (tileSize + gapY));

        return { sheetCols, sheetRows, tileCount: sheetCols * sheetRows };
    }, [tileset, tileSize, offsetX, offsetY, gapX, gapY]);

    const previewCols = columns ?? sheetCols;

    const tileTextures = useMemo(() => {
        return Array.from({ length: tileCount }, (_, index) =>
            makeTileTexture(tileset, index, sheetCols, tileSize, offsetX, offsetY, gapX, gapY)
        );
    }, [tileset, tileCount, sheetCols, tileSize, offsetX, offsetY, gapX, gapY]);

    const labelStyle = useMemo(
        () => ({
            fontFamily: "monospace",
            fontSize: 12,
            fill: 0xffffff,
            stroke: { color: 0x000000, width: 3 },
        }),
        []
    );

    const headerStyle = useMemo(
        () => ({
            fontFamily: "monospace",
            fontSize: 16,
            fill: 0xffffff,
            stroke: { color: 0x000000, width: 4 },
        }),
        []
    );

    return (
        <pixiContainer>
            <pixiText
                text={
                    selected === null
                        ? `Pick number | sheet ${sheetCols}x${sheetRows} | offset ${offsetX},${offsetY} | gap ${gapX},${gapY}`
                        : `Picked: ${selected} | sheet ${sheetCols}x${sheetRows} | offset ${offsetX},${offsetY} | gap ${gapX},${gapY}`
                }
                x={12}
                y={12}
                style={headerStyle}
            />

            <pixiContainer x={12} y={44}>
                {tileTextures.map((tex, index) => {
                    const gx = index % previewCols;
                    const gy = Math.floor(index / previewCols);
                    const x = gx * (tileSize + padding);
                    const y = gy * (tileSize + padding);
                    const isSelected = selected === index;

                    return (
                        <pixiContainer
                            key={index}
                            x={x}
                            y={y}
                            eventMode="static"
                            cursor="pointer"
                            onPointerDown={() => {
                                setSelected(index);
                                onPick?.(index);
                                console.log("Picked tile index:", index);
                            }}
                        >
                            <pixiSprite texture={tex} />

                            {isSelected && (
                                <pixiGraphics
                                    draw={(g) => {
                                        g.clear();
                                        g.rect(0, 0, tileSize, tileSize);
                                        g.stroke({ width: 2, color: 0x00ff88 });
                                    }}
                                />
                            )}

                            <pixiText text={String(index)} x={2} y={2} style={labelStyle} />
                        </pixiContainer>
                    );
                })}
            </pixiContainer>
        </pixiContainer>
    );
}
