import { PLAYER_CONFIG } from "./config/player";
import { WORLD_CONFIG } from "./config/world";

import { useTick } from "@pixi/react";
import { useMemo, useRef, useState } from "react";
import { Texture } from "pixi.js";

import { TileMap } from "./components/TileMap";
// import { TilePalette } from "./components/TilePalette";
import { makeSampleShapeMap } from "./game/shapeGen";
import { Player } from "./components/Player";
import { useKeyboard } from "./components/useKeyboard";

import { makeSolidSet, moveWithTileCollision } from "./game/collision";
import { MapObjects } from "./components/MapObjects";
import { OBJECTS } from "./game/objects";

const playerIdleUrl = "/assets/Sprites/01-King Human/Idle.png";
const playerRunUrl = "/assets/Sprites/01-King Human/Run.png";
const playerJumpUrl = "/assets/Sprites/01-King Human/Jump.png";

type Props = {
    tileset: Texture;
    decorTex: Texture;
    screenW: number;
    screenH: number;
};

export function Game({
    tileset,
    decorTex,
    screenW,
    screenH
}: Props) {
    const {
        SPEED,
        GRAVITY,
        JUMP_V,
        HITBOX: { W: PLAYER_W, H: PLAYER_H },
        RENDER: { OFF_X: RENDER_OFF_X, OFF_Y: RENDER_OFF_Y },
    } = PLAYER_CONFIG;

    const {
        TILE,
        MAP_W,
        MAP_H
    } = WORLD_CONFIG;

    const map = useMemo(
        () =>
            makeSampleShapeMap(25, 15, 127, {
                tl: 6,
                t: 37,
                tr: 7,
                l: 20,
                r: 18,
                bl: 24,
                b: 1,
                br: 25,

                innerTL: 0,
                innerTR: 2,
                innerBL: 36,
                innerBR: 38,
            }),
        []
    );

    const solid = useMemo(() => makeSolidSet({
        tl: 6, t: 37, tr: 7,
        l: 20, r: 18,
        bl: 24, b: 1, br: 25,
        innerTL: 0, innerTR: 2, innerBL: 36, innerBR: 38,
    }), []);


    const startX = 400;
    const groundY = 300;

    const [playerX, setPlayerX] = useState(startX);
    const [playerY, setPlayerY] = useState(groundY);
    const [anim, setAnim] = useState<"idle" | "run" | "jump">("idle");
    const [flipX, setFlipX] = useState(false);

    const phys = useRef({
        x: startX,
        y: groundY,
        vx: 0,
        vy: 0,
        grounded: true,
        jumpLock: false,
        facing: 1 as 1 | -1,
    });

    const keysRef = useKeyboard();

    const mapPxW = MAP_W * TILE;
    const mapPxH = MAP_H * TILE;

    const mapOffsetX = Math.floor((screenW - mapPxW) / 2);
    const mapOffsetY = Math.floor((screenH - mapPxH) / 2);

    useTick((Ticker) => {
        const dtRaw = Ticker.deltaMS / 1000;
        const dt = Math.min(dtRaw, 1 / 20);

        const k = keysRef.current;
        const p = phys.current;

        let dir = 0;
        if (k.left) dir -= 1;
        if (k.right) dir += 1;

        p.vx = dir * SPEED;

        if (dir !== 0) p.facing = dir < 0 ? -1 : 1;

        // jump
        if (k.jump && p.grounded && !p.jumpLock) {
            p.vy = -JUMP_V;
            p.grounded = false;
            p.jumpLock = true;
        }
        if (!k.jump) p.jumpLock = false;

        if (!p.grounded) {
            p.vy += GRAVITY * dt;
        } else {
            p.vy = 0; // stay on the ground
        }

        // collision
        const rect = { x: p.x, y: p.y, w: PLAYER_W, h: PLAYER_H };
        const res = moveWithTileCollision({
            map,
            solid,
            tileSize: TILE,
            rect,
            vx: p.vx,
            vy: p.vy,
            dt,
        });

        p.x = res.rect.x;
        p.y = res.rect.y;
        p.vx = res.vx;
        p.vy = res.vy;
        p.grounded = res.grounded;

        const renderX = Math.round(p.x + PLAYER_W / 2 + RENDER_OFF_X);
        const renderY = Math.round(p.y + PLAYER_H + RENDER_OFF_Y);
        setPlayerX(mapOffsetX + renderX);
        setPlayerY(mapOffsetY + renderY);

        setFlipX((prev) => {
            const nextFlip = p.facing === -1;
            return prev === nextFlip ? prev : nextFlip;
        });

        const nextAnim: "idle" | "run" | "jump" = !p.grounded ? "jump" : dir !== 0 ? "run" : "idle";
        setAnim((prev) => (prev === nextAnim ? prev : nextAnim));
    });

    return (
        <>
            <TileMap
                tileset={tileset}
                map={map}
                tileSize={32}
                offsetX={32}
                offsetY={32}
                gapX={0}
                gapY={0}
                worldX={mapOffsetX}
                worldY={mapOffsetY}
            />

            <MapObjects
                objects={OBJECTS}
                decorTex={decorTex}
                tileSize={TILE}
                worldX={mapOffsetX}
                worldY={mapOffsetY}
            />

            <Player
                x={playerX}
                y={playerY}
                anim={anim}
                flipX={flipX}
                idleUrl={playerIdleUrl}
                runUrl={playerRunUrl}
                jumpUrl={playerJumpUrl}
                fps={10}
            />

            {/* <TilePalette
                tileset={decorTex}
                tileSize={32}
                offsetX={32}
                offsetY={32}
                gapX={0}
                gapY={0}
            /> */}
        </>
    );
}
