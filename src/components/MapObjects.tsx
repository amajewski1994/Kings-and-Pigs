import { useMemo } from "react";
import { Texture } from "pixi.js";
import type { MapObject } from "../game/objects";
import { sliceGrid } from "../game/spritesheet";
import { DECOR_PREFABS } from "../game/decorPrefabs";
import { Door } from "./Door";

const doorIdleUrl = "/assets/Sprites/11-Door/Idle.png";
const doorOpeningUrl = "/assets/Sprites/11-Door/Opening.png";
const doorClosingUrl = "/assets/Sprites/11-Door/Closing.png";

type Props = {
    objects: MapObject[];
    decorTex: Texture;
    tileSize: number;

    worldX: number;
    worldY: number;
};

export function MapObjects({ objects, decorTex, tileSize, worldX, worldY }: Props) {
    const decorFrames = useMemo(() => {
        const { frames } = sliceGrid(decorTex, 32, 32, 0, 0, 0, 0);
        return frames;
    }, [decorTex]);

    return (
        <pixiContainer>
            {objects.map((o) => {
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

                if (o.kind === "door") {
                    const x = worldX + o.tx * tileSize + tileSize / 2;
                    const y = worldY + (o.ty + 1) * tileSize;

                    return (
                        <Door
                            key={o.id}
                            x={x}
                            y={y}
                            idleUrl={doorIdleUrl}
                            openingUrl={doorOpeningUrl}
                            closingUrl={doorClosingUrl}
                            fps={10}
                            state={"idle"}
                            autoCycle={false}
                        />
                    );
                }
            })}
        </pixiContainer>
    );
}
