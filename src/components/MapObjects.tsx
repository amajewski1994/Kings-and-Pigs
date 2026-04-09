import { useEffect, useMemo } from "react";
import type { MapObjectsProps } from "../game/types";
import { sliceGrid } from "../game/spritesheet";
import { DECOR_PREFABS } from "../game/decorPrefabs";
import { Door } from "./Door";
import { DOOR_SPRITES } from '../assets/sprites'

const { doorIdleUrl, doorOpeningUrl, doorClosingUrl } = DOOR_SPRITES;

export function MapObjects({ objects, decorTex, tileSize, worldX, worldY, doorStates, levelIndex = 0 }: MapObjectsProps) {
    const decorFrames = useMemo(() => {
        const { frames } = sliceGrid(decorTex, 32, 32, 0, 0, 0, 0);
        return frames;
    }, [decorTex]);

    useEffect(() => {
        console.log("[MapObjects] mounted");
        return () => console.log("[MapObjects] unmounted");
    }, []);

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

                if (o.id === "doorB" && levelIndex === 0) return null;

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
                            state={doorStates[o.id] ?? "idle"}
                            autoCycle={false}
                        />
                    );
                }
            })}
        </pixiContainer>
    );
}
