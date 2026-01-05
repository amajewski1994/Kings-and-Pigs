import { useTick } from "@pixi/react";
import { useMemo, useRef, useState } from "react";
import { Texture } from "pixi.js";
import type { Ticker } from "pixi.js";

import { TileMap } from "./components/TileMap";
import { makeSampleShapeMap } from "./game/shapeGen";
import { Player } from "./components/Player";
import { useKeyboard } from "./components/useKeyboard";

type Props = { tileset: Texture };

const idleUrl = "/assets/Sprites/01-King Human/Idle.png";
const runUrl = "/assets/Sprites/01-King Human/Run.png";
const jumpUrl = "/assets/Sprites/01-King Human/Jump.png";

export function Game({ tileset }: Props) {
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

    const SPEED = 180;
    const GRAVITY = 1400;
    const JUMP_V = 520;

    useTick((ticker: Ticker) => {
        const dtRaw = ticker.deltaMS / 1000;
        const dt = Math.min(dtRaw, 1 / 20);

        const k = keysRef.current;
        const p = phys.current;

        let dir = 0;
        if (k.left) dir -= 1;
        if (k.right) dir += 1;

        p.vx = dir * SPEED;

        if (dir !== 0) {
            p.facing = dir < 0 ? -1 : 1;
        }

        if (k.jump && p.grounded && !p.jumpLock) {
            p.vy = -JUMP_V;
            p.grounded = false;
            p.jumpLock = true;
        }
        if (!k.jump) p.jumpLock = false;

        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.y >= groundY) {
            p.y = groundY;
            p.vy = 0;
            p.grounded = true;
        }

        if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.vy)) {
            console.error("Player position exploded:", {
                x: p.x, y: p.y, vx: p.vx, vy: p.vy, dtRaw, dt
            });
            p.x = 200;
            p.y = groundY;
            p.vx = 0;
            p.vy = 0;
            p.grounded = true;
        }

        p.x = Math.max(0, Math.min(p.x, 1000));
        p.y = Math.max(0, Math.min(p.y, 720));

        setPlayerX(p.x);
        setPlayerY(p.y);

        const nextFlip = p.facing === -1;
        setFlipX((prev) => (prev === nextFlip ? prev : nextFlip));

        const nextAnim: "idle" | "run" | "jump" =
            !p.grounded ? "jump" : dir !== 0 ? "run" : "idle";
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
            />

            <Player
                x={playerX}
                y={playerY}
                anim={anim}
                flipX={flipX}
                idleUrl={idleUrl}
                runUrl={runUrl}
                jumpUrl={jumpUrl}
                fps={10}
            />
        </>
    );
}
