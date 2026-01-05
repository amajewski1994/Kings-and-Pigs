import { useMemo } from "react";
import { Texture } from "pixi.js";
import type { MapObject } from "../game/objects";
import { sliceGrid } from "../game/spritesheet";
import { DECOR_PREFABS } from "../game/decorPrefabs";

type Props = {
    objects: MapObject[];
    decorTex: Texture;
    doorTex: Texture;
    tileSize: number;

    worldX: number;
    worldY: number;
};

export function MapObjects({ objects, decorTex, doorTex, tileSize, worldX, worldY }: Props) {
    const decorFrames = useMemo(() => {
        const { frames } = sliceGrid(decorTex, 32, 32, 0, 0, 0, 0);
        return frames;
    }, [decorTex]);

    return (
        <pixiContainer>
            {objects.map((o) => {
                const x = worldX + o.tx * tileSize;
                const y = worldY + o.ty * tileSize;

                if (o.kind === "decor") {
                    const prefab = o.prefabId ? DECOR_PREFABS[o.prefabId] : null;
                    if (!prefab) return null;

                    const origin = prefab.origin ?? "tl";
                    const tiles = prefab.tiles;

                    const h = tiles.length;

                    const baseTy = origin === "bl" ? o.ty - (h - 1) : o.ty;

                    return (
                        <pixiContainer key={o.id}>
                            {tiles.map((row, dy) =>
                                row.map((frameIndex, dx) => {
                                    if (frameIndex < 0) return null;
                                    const tex = decorFrames[frameIndex];
                                    return (
                                        <pixiSprite
                                            key={`${o.id}-${dx}-${dy}`}
                                            texture={tex}
                                            x={worldX + (o.tx + dx) * tileSize}
                                            y={worldY + (baseTy + dy) * tileSize}
                                        />
                                    );
                                })
                            )}
                        </pixiContainer>
                    );
                }

                return <pixiSprite key={o.id} texture={doorTex} x={x} y={y} anchor={{ x: 0.5, y: 1 }} />;
            })}
        </pixiContainer>
    );
}
