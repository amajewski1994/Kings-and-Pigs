import { PLAYER_CONFIG } from "./config/player";
import { WORLD_CONFIG } from "./config/world";

import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Texture } from "pixi.js";

import { TileMap } from "./components/TileMap";
// import { TilePalette } from "./components/TilePalette";
import { makeSampleShapeMap } from "./game/shapeGen";
import { Player } from "./components/Player";
import { Enemy } from "./components/Enemy";
import { useKeyboard } from "./components/useKeyboard";

import { makeSolidSet, moveWithTileCollision } from "./game/collision";
import { MapObjects } from "./components/MapObjects";
import { OBJECTS } from "./game/objects";

const playerIdleUrl = "/assets/Sprites/01-King Human/Idle.png";
const playerRunUrl = "/assets/Sprites/01-King Human/Run.png";
const playerJumpUrl = "/assets/Sprites/01-King Human/Jump.png";
const playerAttackUrl = "/assets/Sprites/01-King Human/Attack.png";
const playerHitUrl = "/assets/Sprites/01-King Human/Hit.png";
const playerDeadUrl = "/assets/Sprites/01-King Human/Dead.png";

const enemyIdleUrl = "/assets/Sprites/03-Pig/Idle.png";
const enemyRunUrl = "/assets/Sprites/03-Pig/Run.png";
const enemyJumpUrl = "/assets/Sprites/03-Pig/Jump.png";
const enemyAttackUrl = "/assets/Sprites/03-Pig/Attack.png";
const enemyHitUrl = "/assets/Sprites/03-Pig/Hit.png";
const enemyDeadUrl = "/assets/Sprites/03-Pig/Dead.png";

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 60;

const DAMAGE_PLAYER = 10;
const DAMAGE_ENEMY = 12;

const ATTACK_RANGE_X = 55;     // zasięg w px w poziomie
const ATTACK_RANGE_Y = 40;     // tolerancja w pionie
const ATTACK_WINDUP = 0.12;    // od startu animacji do aktywnego hitboxa
const ATTACK_ACTIVE = 0.12;    // długość aktywnego okna
const IFRAME_TIME = 0.25;      // krótkie "nieśmiertelne" po trafieniu
const ENEMY_ATK_COOLDOWN = 0.8;

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


    const startPlayerX = 400;
    const startEnemyX = 600;
    const groundY = 300;

    // PLAYER STATES
    const [playerX, setPlayerX] = useState(startPlayerX);
    const [playerY, setPlayerY] = useState(groundY);
    const [playerAnim, setPlayerAnim] = useState<
        "idle" | "run" | "jump" | "attack" | "hit" | "dead"
    >("idle");
    const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
    const [isPlayerHit, setIsPlayerHit] = useState(false);
    const [isPlayerDead, setIsPlayerDead] = useState(false);

    const [flipPlayerX, setFlipPlayerX] = useState(false);

    const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);

    // ENEMY STATES
    const [enemyX, setEnemyX] = useState(startEnemyX);
    const [enemyY, setEnemyY] = useState(groundY);
    const [enemyAnim, setEnemyAnim] = useState<
        "idle" | "run" | "jump" | "attack" | "hit" | "dead"
    >("idle");
    const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
    const [isEnemyHit, setIsEnemyHit] = useState(false);
    const [isEnemyDead, setIsEnemyDead] = useState(false);

    const [flipEnemyX, setFlipEnemyX] = useState(false);

    const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            setIsPlayerAttacking((prev) => {
                if (prev) return prev;
                return true;
            });
        };

        window.addEventListener("mousedown", onMouseDown);
        return () => window.removeEventListener("mousedown", onMouseDown);
    }, []);

    // TEST HIT AND DEAD
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.code === "KeyH") setIsPlayerHit(true);     // test "Hit"
            if (e.code === "KeyK") setIsPlayerDead(true);    // test "Dead"
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const phys = useRef({
        x: startPlayerX,
        y: groundY,
        vx: 0,
        vy: 0,
        grounded: true,
        jumpLock: false,
        facing: 1 as 1 | -1,
    });

    const combatRef = useRef({
        // player
        playerAtkT: 0,
        playerDidHitThisSwing: false,
        playerIFramesT: 0,

        // enemy
        enemyAtkT: 0,
        enemyDidHitThisSwing: false,
        enemyIFramesT: 0,
        enemyAtkCooldownT: 0,
    });

    const keysRef = useKeyboard();

    const mapPxW = MAP_W * TILE;
    const mapPxH = MAP_H * TILE;

    const mapOffsetX = Math.floor((screenW - mapPxW) / 2);
    const mapOffsetY = Math.floor((screenH - mapPxH) / 2);

    const inMeleeRange = (ax: number, ay: number, bx: number, by: number) => {
        return Math.abs(ax - bx) <= ATTACK_RANGE_X && Math.abs(ay - by) <= ATTACK_RANGE_Y;
    };

    useTick((Ticker) => {
        const dtRaw = Ticker.deltaMS / 1000;
        const dt = Math.min(dtRaw, 1 / 20);

        const k = keysRef.current;
        const p = phys.current;

        const allowInput = !isPlayerDead;

        const c = combatRef.current;

        c.playerIFramesT = Math.max(0, c.playerIFramesT - dt);
        c.enemyIFramesT = Math.max(0, c.enemyIFramesT - dt);
        c.enemyAtkCooldownT = Math.max(0, c.enemyAtkCooldownT - dt);

        let dir = 0;
        if (allowInput) {
            if (k.left) dir -= 1;
            if (k.right) dir += 1;
        }

        p.vx = dir * SPEED;

        if (allowInput && dir !== 0) p.facing = dir < 0 ? -1 : 1;

        // jump
        if (allowInput && k.jump && p.grounded && !p.jumpLock) {
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
        setEnemyY(mapOffsetY + renderY);

        setFlipPlayerX((prev) => {
            const nextFlip = p.facing === -1;
            return prev === nextFlip ? prev : nextFlip;
        });

        setFlipEnemyX(() => enemyX > playerX);

        const canEnemyAct = !isEnemyDead;

        if (
            canEnemyAct &&
            !isEnemyAttacking &&
            !isEnemyHit &&
            c.enemyAtkCooldownT <= 0 &&
            inMeleeRange(enemyX, enemyY, playerX, playerY)
        ) {
            setIsEnemyAttacking(true);
            c.enemyAtkT = 0;
            c.enemyDidHitThisSwing = false;
            c.enemyAtkCooldownT = ENEMY_ATK_COOLDOWN;
        }

        if (isPlayerAttacking) {
            c.playerAtkT += dt;
        } else {
            c.playerAtkT = 0;
            c.playerDidHitThisSwing = false;
        }

        if (isEnemyAttacking) {
            c.enemyAtkT += dt;
        } else {
            c.enemyAtkT = 0;
            c.enemyDidHitThisSwing = false;
        }

        const playerAttackActive =
            isPlayerAttacking && c.playerAtkT >= ATTACK_WINDUP && c.playerAtkT <= (ATTACK_WINDUP + ATTACK_ACTIVE);

        const enemyAttackActive =
            isEnemyAttacking && c.enemyAtkT >= ATTACK_WINDUP && c.enemyAtkT <= (ATTACK_WINDUP + ATTACK_ACTIVE);

        if (
            playerAttackActive &&
            !c.playerDidHitThisSwing &&
            !isEnemyDead &&
            c.enemyIFramesT <= 0 &&
            inMeleeRange(playerX, playerY, enemyX, enemyY)
        ) {
            c.playerDidHitThisSwing = true;
            c.enemyIFramesT = IFRAME_TIME;

            setEnemyHp((hp) => {
                const next = Math.max(0, hp - DAMAGE_PLAYER);
                if (next === 0) setIsEnemyDead(true);
                else setIsEnemyHit(true);
                return next;
            });

            console.log(enemyHp)
        }

        if (
            enemyAttackActive &&
            !c.enemyDidHitThisSwing &&
            !isPlayerDead &&
            c.playerIFramesT <= 0 &&
            inMeleeRange(enemyX, enemyY, playerX, playerY)
        ) {
            c.enemyDidHitThisSwing = true;
            c.playerIFramesT = IFRAME_TIME;

            setPlayerHp((hp) => {
                const next = Math.max(0, hp - DAMAGE_ENEMY);
                if (next === 0) setIsPlayerDead(true);
                else setIsPlayerHit(true);
                return next;
            });
        }

        const nextPlayerAnimBase: "idle" | "run" | "jump" =
            !p.grounded ? "jump" : dir !== 0 ? "run" : "idle";

        const nextPlayerAnim =
            isPlayerDead ? "dead" :
                isPlayerHit ? "hit" :
                    isPlayerAttacking ? "attack" :
                        nextPlayerAnimBase;

        setPlayerAnim((prev) => (prev === nextPlayerAnim ? prev : nextPlayerAnim));

        const nextEnemyAnimBase: "idle" | "run" | "jump" =
            !p.grounded ? "jump" : dir !== 0 ? "run" : "idle";

        const nextEnemyAnim =
            isEnemyDead ? "dead" :
                isEnemyHit ? "hit" :
                    isEnemyAttacking ? "attack" :
                        nextEnemyAnimBase;

        setEnemyAnim((prev) => (prev === nextEnemyAnim ? prev : nextEnemyAnim));
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

            <Enemy
                x={enemyX}
                y={enemyY}
                anim={enemyAnim}
                flipX={flipEnemyX}
                idleUrl={enemyIdleUrl}
                runUrl={enemyRunUrl}
                jumpUrl={enemyJumpUrl}
                attackUrl={enemyAttackUrl}
                hitUrl={enemyHitUrl}
                deadUrl={enemyDeadUrl}
                fps={10}
                onAnimComplete={(name) => {
                    if (name === "attack") setIsEnemyAttacking(false);
                    if (name === "hit") setIsEnemyHit(false);
                }}
            />

            <Player
                x={playerX}
                y={playerY}
                anim={playerAnim}
                flipX={flipPlayerX}
                idleUrl={playerIdleUrl}
                runUrl={playerRunUrl}
                jumpUrl={playerJumpUrl}
                attackUrl={playerAttackUrl}
                hitUrl={playerHitUrl}
                deadUrl={playerDeadUrl}
                fps={10}
                onAnimComplete={(name) => {
                    if (name === "attack") setIsPlayerAttacking(false);
                    if (name === "hit") setIsPlayerHit(false);
                }}
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
