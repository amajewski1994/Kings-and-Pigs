import { PLAYER_CONFIG } from "./config/player";
import { WORLD_CONFIG } from "./config/world";

import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState, useLayoutEffect, startTransition } from "react";
import { Texture } from "pixi.js";

import { TileMap } from "./components/TileMap";
// import { TilePalette } from "./components/TilePalette";
import { makeSampleShapeMap0, makeSampleShapeMap1, makeSampleShapeMap2 } from "./game/shapeGen";
import { Player } from "./components/Player";
import { Enemy } from "./components/Enemy";
import { useKeyboard } from "./components/useKeyboard";

import { makeSolidSet, moveWithTileCollision } from "./game/collision";
import { MapObjects } from "./components/MapObjects";
import { OBJECTS } from "./game/objects";
import { HPBar } from "./components/HPBar";

const playerIdleUrl = "/assets/Sprites/01-King Human/Idle.png";
const playerRunUrl = "/assets/Sprites/01-King Human/Run.png";
const playerJumpUrl = "/assets/Sprites/01-King Human/Jump.png";
const playerAttackUrl = "/assets/Sprites/01-King Human/Attack.png";
const playerHitUrl = "/assets/Sprites/01-King Human/Hit.png";
const playerDeadUrl = "/assets/Sprites/01-King Human/Dead.png";
const playerDoorInUrl = "/assets/Sprites/01-King Human/DoorIn.png";
const playerDoorOutUrl = "/assets/Sprites/01-King Human/DoorOut.png";

const enemyIdleUrl = "/assets/Sprites/03-Pig/Idle.png";
const enemyRunUrl = "/assets/Sprites/03-Pig/Run.png";
const enemyJumpUrl = "/assets/Sprites/03-Pig/Jump.png";
const enemyAttackUrl = "/assets/Sprites/03-Pig/Attack.png";
const enemyHitUrl = "/assets/Sprites/03-Pig/Hit.png";
const enemyDeadUrl = "/assets/Sprites/03-Pig/Dead.png";

const kingEnemyIdleUrl = "/assets/Sprites/02-King Pig/Idle.png";
const kingEnemyRunUrl = "/assets/Sprites/02-King Pig/Run.png";
const kingEnemyJumpUrl = "/assets/Sprites/02-King Pig/Jump.png";
const kingEnemyAttackUrl = "/assets/Sprites/02-King Pig/Attack.png";
const kingEnemyHitUrl = "/assets/Sprites/02-King Pig/Hit.png";
const kingEnemyDeadUrl = "/assets/Sprites/02-King Pig/Dead.png";

const PLAYER_MAX_HP = 100;
const ENEMY_MAX_HP = 60;

const DAMAGE_PLAYER = 60;
const DAMAGE_ENEMY = 12;

const KING_MAX_HP = 160;
const KING_DAMAGE = 18;
const KING_SPEED = 105;

const ATTACK_RANGE_X = 55;
const ATTACK_RANGE_Y = 40;
const ATTACK_WINDUP = 0.12;
const ATTACK_ACTIVE = 0.12;
const IFRAME_TIME = 0.25;
const ENEMY_ATK_COOLDOWN = 0.8;

const ENEMY_SPEED = 90;
const ENEMY_STOP_DIST = 45;

const DOOR_VISUAL_BIAS_X = 6;

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

    const startPlayerX = 200;
    const startPlayerY = 200;
    const startEnemyX = 600;
    const startEnemyY = 200;
    const startEnemy2X = 500;
    const startEnemy2Y = 200;
    const groundY = 190;

    // PLAYER STATES
    const [playerX, setPlayerX] = useState(startPlayerX);
    const [playerY, setPlayerY] = useState(startPlayerY);
    const [playerAnim, setPlayerAnim] = useState<
        "idle" | "run" | "jump" | "attack" | "hit" | "dead" | "doorIn" | "doorOut"
    >("idle");
    const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
    const [isPlayerHit, setIsPlayerHit] = useState(false);
    const [isPlayerDead, setIsPlayerDead] = useState(false);

    const [flipPlayerX, setFlipPlayerX] = useState(false);

    const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);

    // ENEMY STATES
    const [enemyX, setEnemyX] = useState(startEnemyX);
    const [enemyY, setEnemyY] = useState(startEnemyY);
    const [enemyAnim, setEnemyAnim] = useState<
        "idle" | "run" | "jump" | "attack" | "hit" | "dead"
    >("idle");
    const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);
    const [isEnemyHit, setIsEnemyHit] = useState(false);
    const [isEnemyDead, setIsEnemyDead] = useState(false);

    const [flipEnemyX, setFlipEnemyX] = useState(false);

    const [enemyHp, setEnemyHp] = useState(ENEMY_MAX_HP);
    const [enemyAggro, setEnemyAggro] = useState(false);

    const [enemy2X, setEnemy2X] = useState(startEnemy2X);
    const [enemy2Y, setEnemy2Y] = useState(startEnemy2Y);
    const [enemy2Anim, setEnemy2Anim] = useState<"idle" | "run" | "jump" | "attack" | "hit" | "dead">("idle");
    const [isEnemy2Attacking, setIsEnemy2Attacking] = useState(false);
    const [isEnemy2Hit, setIsEnemy2Hit] = useState(false);
    const [isEnemy2Dead, setIsEnemy2Dead] = useState(false);
    const [flipEnemy2X, setFlipEnemy2X] = useState(false);
    const [enemy2Hp, setEnemy2Hp] = useState(ENEMY_MAX_HP);
    const [enemy2Aggro, setEnemy2Aggro] = useState(false);

    const [levelIndex, setLevelIndex] = useState<0 | 1 | 2>(0);
    const [phase, setPhase] = useState<"play" | "doorIn" | "doorOut">("play");
    const [doorAState, setDoorAState] = useState<"idle" | "opening" | "closing">("idle");
    const [doorBState, setDoorBState] = useState<"idle" | "opening" | "closing">("idle");

    const mapOffsetRef = useRef({ x: 0, y: 0 });
    const transitionedRef = useRef(false);

    const isBossLevel = levelIndex === 2;
    const enemy1Profile = isBossLevel
        ? {
            maxHp: KING_MAX_HP,
            damage: KING_DAMAGE,
            speed: KING_SPEED,
            frameW: 38,
            frameH: 28,
            urls: {
                idleUrl: kingEnemyIdleUrl,
                runUrl: kingEnemyRunUrl,
                jumpUrl: kingEnemyJumpUrl,
                attackUrl: kingEnemyAttackUrl,
                hitUrl: kingEnemyHitUrl,
                deadUrl: kingEnemyDeadUrl,
            },
        }
        : {
            maxHp: ENEMY_MAX_HP,
            damage: DAMAGE_ENEMY,
            speed: ENEMY_SPEED,
            frameW: 34,
            frameH: 28,
            urls: {
                idleUrl: enemyIdleUrl,
                runUrl: enemyRunUrl,
                jumpUrl: enemyJumpUrl,
                attackUrl: enemyAttackUrl,
                hitUrl: enemyHitUrl,
                deadUrl: enemyDeadUrl,
            },
        };

    const hasEnemy2 = levelIndex === 1;

    const map = useMemo(() => {
        const wall = {
            tl: 6, t: 37, tr: 7,
            l: 20, r: 18,
            bl: 24, b: 1, br: 25,
            innerTL: 0, innerTR: 2, innerBL: 36, innerBR: 38,
        };

        if (levelIndex === 0) return makeSampleShapeMap0(MAP_W, MAP_H, 127, wall);
        if (levelIndex === 1) return makeSampleShapeMap1(MAP_W, MAP_H, 127, wall);
        return makeSampleShapeMap2(MAP_W, MAP_H, 127, wall);
    }, [levelIndex, MAP_W, MAP_H]);

    const solid = useMemo(() => makeSolidSet({
        tl: 6, t: 37, tr: 7,
        l: 20, r: 18,
        bl: 24, b: 1, br: 25,
        innerTL: 0, innerTR: 2, innerBL: 36, innerBR: 38,
    }), []);

    const doorObj = useMemo(() => OBJECTS.find(o => o.kind === "door"), []);

    const doorStates = useMemo(() => ({ doorA: doorAState, doorB: doorBState }), [doorAState, doorBState]);

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
            if (e.code === "KeyE") setEnemyAggro((v) => !v); // test "Aggro"
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    useEffect(() => { transitionedRef.current = false; }, [levelIndex]);

    useEffect(() => {
        startTransition(() => {
            setDoorAState(isEnemyDead ? "opening" : "idle");
        });
    }, [isEnemyDead]);

    useEffect(() => {
        if (levelIndex === 0) return;

        startTransition(() => {
            setEnemyHp(levelIndex === 2 ? KING_MAX_HP : ENEMY_MAX_HP);
            setIsEnemyDead(false);
            setIsEnemyHit(false);
            setIsEnemyAttacking(false);
            setEnemyAggro(false);

            setIsPlayerAttacking(false);
            setIsPlayerHit(false);
            setIsPlayerDead(false);

            setDoorBState("closing");
            setDoorAState("idle");

            if (levelIndex === 1) {
                setEnemy2Hp(ENEMY_MAX_HP);
                setIsEnemy2Dead(false);
                setIsEnemy2Hit(false);
                setIsEnemy2Attacking(false);
                setEnemy2Aggro(false);
            } else {
                setIsEnemy2Dead(true);
            }
        });

        const t = window.setTimeout(() => {
            startTransition(() => setDoorBState("idle"));
        }, 600);

        return () => window.clearTimeout(t);
    }, [levelIndex]);


    const playerPhys = useRef({
        x: startPlayerX,
        y: groundY,
        vx: 0,
        vy: 0,
        grounded: true,
        jumpLock: false,
        facing: 1 as 1 | -1,
    });

    const enemyPhys = useRef({
        x: startEnemyX,
        y: groundY,
        vx: 0,
        vy: 0,
        grounded: true,
        facing: 1 as 1 | -1,
    });

    const enemy2Phys = useRef({
        x: startEnemy2X,
        y: groundY,
        vx: 0,
        vy: 0,
        grounded: true,
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

    const enemy2CombatRef = useRef({
        atkT: 0,
        didHitThisSwing: false,
        iFramesT: 0,
        atkCooldownT: 0,
    });

    const pendingRespawnRef = useRef<null | { level: 0 | 1 | 2 }>(null);

    const keysRef = useKeyboard();

    const mapPxW = MAP_W * TILE;
    const mapPxH = MAP_H * TILE;

    const mapOffsetX = Math.floor((screenW - mapPxW) / 2);
    const mapOffsetY = Math.floor((screenH - mapPxH) / 2);

    useLayoutEffect(() => {
        mapOffsetRef.current.x = mapOffsetX;
        mapOffsetRef.current.y = mapOffsetY;
    }, [mapOffsetX, mapOffsetY]);

    const inMeleeRange = (ax: number, ay: number, bx: number, by: number) => {
        return Math.abs(ax - bx) <= ATTACK_RANGE_X && Math.abs(ay - by) <= ATTACK_RANGE_Y;
    };

    useTick((Ticker) => {
        const dtRaw = Ticker.deltaMS / 1000;
        const dt = Math.min(dtRaw, 1 / 20);

        const k = keysRef.current;
        const p = playerPhys.current;
        const ep = enemyPhys.current;
        const c = combatRef.current;

        const hasEnemy2 = levelIndex === 1;
        const isBossLevel = levelIndex === 2;

        const enemy1Damage = isBossLevel ? KING_DAMAGE : DAMAGE_ENEMY;
        const enemy1Speed = isBossLevel ? KING_SPEED : ENEMY_SPEED;

        const ep2 = enemy2Phys.current;
        const c2 = enemy2CombatRef.current;

        const pending = pendingRespawnRef.current;
        if (pending) {
            pendingRespawnRef.current = null;

            ep.x = startEnemyX;
            ep.y = startEnemyY;
            ep.vx = 0;
            ep.vy = 0;
            ep.grounded = true;
            ep.facing = -1;

            if (pending.level === 1) {
                const ep2 = enemy2Phys.current;
                ep2.x = startEnemy2X;
                ep2.y = startEnemy2Y;
                ep2.vx = 0;
                ep2.vy = 0;
                ep2.grounded = true;
                ep2.facing = -1;
            }
        }

        const allowInput = phase === "play" && !isPlayerDead;

        c.playerIFramesT = Math.max(0, c.playerIFramesT - dt);
        c.enemyIFramesT = Math.max(0, c.enemyIFramesT - dt);
        c.enemyAtkCooldownT = Math.max(0, c.enemyAtkCooldownT - dt);

        if (hasEnemy2) {
            c2.iFramesT = Math.max(0, c2.iFramesT - dt);
            c2.atkCooldownT = Math.max(0, c2.atkCooldownT - dt);
        }

        if (isPlayerDead && isEnemyAttacking) setIsEnemyAttacking(false);

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

        if (!ep.grounded) {
            ep.vy += GRAVITY * dt;
        } else {
            ep.vy = 0;
        }

        if (hasEnemy2) {
            if (!ep2.grounded) ep2.vy += GRAVITY * dt;
            else ep2.vy = 0;
        }

        // collision
        const pRect = { x: p.x, y: p.y, w: PLAYER_W, h: PLAYER_H };
        const pRes = moveWithTileCollision({
            map,
            solid,
            tileSize: TILE,
            rect: pRect,
            vx: p.vx,
            vy: p.vy,
            dt,
        });

        p.x = pRes.rect.x;
        p.y = pRes.rect.y;
        p.vx = pRes.vx;
        p.vy = pRes.vy;
        p.grounded = pRes.grounded;

        const pRenderX = Math.round(p.x + PLAYER_W / 2 + RENDER_OFF_X);
        const pRenderY = Math.floor(p.y + PLAYER_H + RENDER_OFF_Y);

        setFlipPlayerX((prev) => {
            const nextFlip = p.facing === -1;
            return prev === nextFlip ? prev : nextFlip;
        });

        const eRect = { x: ep.x, y: ep.y, w: PLAYER_W, h: PLAYER_H };
        const eRes = moveWithTileCollision({
            map,
            solid,
            tileSize: TILE,
            rect: eRect,
            vx: ep.vx,
            vy: ep.vy,
            dt,
        });

        ep.x = eRes.rect.x;
        ep.y = eRes.rect.y;
        ep.vx = eRes.vx;
        ep.vy = eRes.vy;
        ep.grounded = eRes.grounded;

        const eRenderX = Math.round(ep.x + PLAYER_W / 2 + RENDER_OFF_X);
        const eRenderY = Math.floor(ep.y + PLAYER_H + RENDER_OFF_Y);

        let e2RenderX = 0;
        let e2RenderY = 0;

        if (hasEnemy2) {
            const e2Rect = { x: ep2.x, y: ep2.y, w: PLAYER_W, h: PLAYER_H };
            const e2Res = moveWithTileCollision({
                map,
                solid,
                tileSize: TILE,
                rect: e2Rect,
                vx: ep2.vx,
                vy: ep2.vy,
                dt,
            });

            ep2.x = e2Res.rect.x;
            ep2.y = e2Res.rect.y;
            ep2.vx = e2Res.vx;
            ep2.vy = e2Res.vy;
            ep2.grounded = e2Res.grounded;

            e2RenderX = Math.round(ep2.x + PLAYER_W / 2 + RENDER_OFF_X);
            e2RenderY = Math.floor(ep2.y + PLAYER_H + RENDER_OFF_Y);
        }


        const offX = mapOffsetRef.current.x;
        const offY = mapOffsetRef.current.y;

        if ((offY + pRenderY) > 550 && !enemyAggro) setEnemyAggro(true);

        setPlayerX(offX + pRenderX);
        setPlayerY(offY + pRenderY);

        setEnemyX(offX + eRenderX);
        setEnemyY(offY + eRenderY);

        if (hasEnemy2) {
            setEnemy2X(offX + e2RenderX);
            setEnemy2Y(offY + e2RenderY);
        }

        if (!isEnemyDead) {
            setFlipEnemyX(ep.facing === -1);
        }

        if (hasEnemy2 && !isEnemy2Dead) {
            setFlipEnemy2X(ep2.facing === -1);
        }

        if (enemyAggro && !isEnemyDead && !isEnemyHit && !isPlayerDead) {
            const dx = p.x - ep.x;
            const absDx = Math.abs(dx);
            const dirE = dx < 0 ? -1 : 1;

            ep.facing = dirE as 1 | -1;

            if (!isEnemyAttacking && absDx > ENEMY_STOP_DIST) {
                ep.vx = dirE * enemy1Speed;
            } else {
                ep.vx = 0;
            }
        } else {
            ep.vx = 0;
        }

        if (hasEnemy2) {
            if ((offY + pRenderY) > 550 && !enemy2Aggro) setEnemy2Aggro(true);

            if (enemy2Aggro && !isEnemy2Dead && !isEnemy2Hit && !isPlayerDead) {
                const dx2 = p.x - ep2.x;
                const absDx2 = Math.abs(dx2);
                const dirE2 = dx2 < 0 ? -1 : 1;

                ep2.facing = dirE2 as 1 | -1;

                if (!isEnemy2Attacking && absDx2 > ENEMY_STOP_DIST) {
                    ep2.vx = dirE2 * ENEMY_SPEED;
                } else {
                    ep2.vx = 0;
                }
            } else {
                ep2.vx = 0;
            }
        }

        const canEnemyAct = !isEnemyDead && !isPlayerDead;

        if (
            enemyAggro &&
            canEnemyAct &&
            !isEnemyAttacking &&
            !isEnemyHit &&
            c.enemyAtkCooldownT <= 0 &&
            inMeleeRange(ep.x, ep.y, p.x, p.y)
        ) {
            setIsEnemyAttacking(true);
            c.enemyAtkT = 0;
            c.enemyDidHitThisSwing = false;
            c.enemyAtkCooldownT = ENEMY_ATK_COOLDOWN;
        }

        if (hasEnemy2) {
            const canEnemy2Act = !isEnemy2Dead && !isPlayerDead;

            if (
                enemy2Aggro &&
                canEnemy2Act &&
                !isEnemy2Attacking &&
                !isEnemy2Hit &&
                c2.atkCooldownT <= 0 &&
                inMeleeRange(ep2.x, ep2.y, p.x, p.y)
            ) {
                setIsEnemy2Attacking(true);
                c2.atkT = 0;
                c2.didHitThisSwing = false;
                c2.atkCooldownT = ENEMY_ATK_COOLDOWN;
            }
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

        if (hasEnemy2) {
            if (isEnemy2Attacking) c2.atkT += dt;
            else {
                c2.atkT = 0;
                c2.didHitThisSwing = false;
            }
        }

        const playerAttackActive =
            isPlayerAttacking && c.playerAtkT >= ATTACK_WINDUP && c.playerAtkT <= (ATTACK_WINDUP + ATTACK_ACTIVE);

        const enemyAttackActive =
            isEnemyAttacking && c.enemyAtkT >= ATTACK_WINDUP && c.enemyAtkT <= (ATTACK_WINDUP + ATTACK_ACTIVE);

        const enemy2AttackActive =
            hasEnemy2 && isEnemy2Attacking && c2.atkT >= ATTACK_WINDUP && c2.atkT <= (ATTACK_WINDUP + ATTACK_ACTIVE);

        if (
            playerAttackActive &&
            !c.playerDidHitThisSwing &&
            !isEnemyDead &&
            c.enemyIFramesT <= 0 &&
            inMeleeRange(p.x, p.y, ep.x, ep.y)
        ) {
            c.playerDidHitThisSwing = true;
            c.enemyIFramesT = IFRAME_TIME;

            setEnemyHp((hp) => {
                const next = Math.max(0, hp - DAMAGE_PLAYER);
                if (next === 0) setIsEnemyDead(true);
                else setIsEnemyHit(true);
                return next;
            });
        }

        if (
            hasEnemy2 &&
            playerAttackActive &&
            !c.playerDidHitThisSwing &&
            !isEnemy2Dead &&
            c2.iFramesT <= 0 &&
            inMeleeRange(p.x, p.y, ep2.x, ep2.y)
        ) {
            c.playerDidHitThisSwing = true;
            c2.iFramesT = IFRAME_TIME;

            setEnemy2Hp((hp) => {
                const next = Math.max(0, hp - DAMAGE_PLAYER);
                if (next === 0) setIsEnemy2Dead(true);
                else setIsEnemy2Hit(true);
                return next;
            });
        }

        if (
            enemyAttackActive &&
            !c.enemyDidHitThisSwing &&
            !isPlayerDead &&
            c.playerIFramesT <= 0 &&
            inMeleeRange(ep.x, ep.y, p.x, p.y)
        ) {
            c.enemyDidHitThisSwing = true;
            c.playerIFramesT = IFRAME_TIME;

            setPlayerHp((hp) => {
                const next = Math.max(0, hp - enemy1Damage);
                if (next === 0) setIsPlayerDead(true);
                else setIsPlayerHit(true);
                return next;
            });
        }

        if (
            hasEnemy2 &&
            enemy2AttackActive &&
            !c2.didHitThisSwing &&
            !isPlayerDead &&
            c.playerIFramesT <= 0 &&
            inMeleeRange(ep2.x, ep2.y, p.x, p.y)
        ) {
            c2.didHitThisSwing = true;
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
            phase === "doorIn" ? "doorIn" :
                phase === "doorOut" ? "doorOut" :
                    isPlayerDead ? "dead" :
                        isPlayerHit ? "hit" :
                            isPlayerAttacking ? "attack" :
                                nextPlayerAnimBase;

        setPlayerAnim((prev) => (prev === nextPlayerAnim ? prev : nextPlayerAnim));

        const nextEnemyAnimBase: "idle" | "run" | "jump" =
            !ep.grounded ? "jump" :
                ep.vx !== 0 ? "run" : "idle";

        const nextEnemyAnim =
            isEnemyDead ? "dead" :
                isEnemyHit ? "hit" :
                    isEnemyAttacking ? "attack" :
                        nextEnemyAnimBase;

        setEnemyAnim((prev) => (prev === nextEnemyAnim ? prev : nextEnemyAnim));

        if (hasEnemy2) {
            const nextEnemy2AnimBase: "idle" | "run" | "jump" =
                !ep2.grounded ? "jump" : ep2.vx !== 0 ? "run" : "idle";

            const nextEnemy2Anim =
                isEnemy2Dead ? "dead" :
                    isEnemy2Hit ? "hit" :
                        isEnemy2Attacking ? "attack" :
                            nextEnemy2AnimBase;

            setEnemy2Anim((prev) => (prev === nextEnemy2Anim ? prev : nextEnemy2Anim));
        }

        // NEXT LEVEL
        const intersectsDoorCenter = (
            player: { x: number; y: number; w: number; h: number },
            door: { x: number; y: number; w: number; h: number }
        ) => {
            const playerCenterX = player.x + player.w / 2;
            const doorCenterX = door.x + door.w / 2;

            const centerDistX = Math.abs(playerCenterX - doorCenterX);

            const maxCenterOffset = TILE * 0.25;

            const overlapY =
                player.y < door.y + door.h &&
                player.y + player.h > door.y;

            return centerDistX <= maxCenterOffset && overlapY;
        };

        const allEnemiesDead = hasEnemy2 ? (isEnemyDead && isEnemy2Dead) : isEnemyDead;

        if (phase === "play" && allEnemiesDead && doorObj && !transitionedRef.current) {
            const doorBottomY = (doorObj.ty + 1) * TILE;

            const doorRect = {
                x: doorObj.tx * TILE,
                y: doorBottomY - 2 * TILE,
                w: TILE,
                h: 2 * TILE,
            };

            if (intersectsDoorCenter(pRect, doorRect)) {
                transitionedRef.current = true;

                const p = playerPhys.current;
                const doorCenterX = doorObj.tx * TILE + TILE / 2;
                const bias = (p.facing === -1 ? -DOOR_VISUAL_BIAS_X : DOOR_VISUAL_BIAS_X);
                p.x = doorCenterX - PLAYER_W / 2 - RENDER_OFF_X + bias;
                p.y = doorBottomY - PLAYER_H;
                p.vx = 0;
                p.vy = 0;
                p.grounded = true;

                setPhase("doorIn");
                setPlayerAnim("doorIn");
            }
        }
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
                levelIndex={levelIndex}
                doorStates={doorStates}
            />

            {hasEnemy2 && (
                <HPBar
                    x={enemy2X}
                    y={enemy2Y}
                    hp={enemy2Hp}
                    maxHp={ENEMY_MAX_HP}
                    flipX={flipEnemy2X}
                />
            )}

            <HPBar
                x={enemyX}
                y={enemyY}
                hp={enemyHp}
                maxHp={enemy1Profile.maxHp}
                flipX={flipEnemyX}
            />

            <HPBar
                x={playerX}
                y={playerY}
                hp={playerHp}
                maxHp={PLAYER_MAX_HP}
                flipX={flipPlayerX}
            />

            {hasEnemy2 && (
                <Enemy
                    x={enemy2X}
                    y={enemy2Y}
                    anim={enemy2Anim}
                    flipX={flipEnemy2X}
                    idleUrl={enemyIdleUrl}
                    runUrl={enemyRunUrl}
                    jumpUrl={enemyJumpUrl}
                    attackUrl={enemyAttackUrl}
                    hitUrl={enemyHitUrl}
                    deadUrl={enemyDeadUrl}
                    fps={10}
                    onAnimComplete={(name) => {
                        if (name === "attack") setIsEnemy2Attacking(false);
                        if (name === "hit") setIsEnemy2Hit(false);
                    }}
                />
            )}

            <Enemy
                x={enemyX}
                y={enemyY}
                anim={enemyAnim}
                flipX={flipEnemyX}
                idleUrl={enemy1Profile.urls.idleUrl}
                runUrl={enemy1Profile.urls.runUrl}
                jumpUrl={enemy1Profile.urls.jumpUrl}
                attackUrl={enemy1Profile.urls.attackUrl}
                hitUrl={enemy1Profile.urls.hitUrl}
                deadUrl={enemy1Profile.urls.deadUrl}
                frameW={enemy1Profile.frameW}
                frameH={enemy1Profile.frameH}
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
                doorInUrl={playerDoorInUrl}
                doorOutUrl={playerDoorOutUrl}
                fps={10}
                onAnimComplete={(name) => {
                    if (name === "attack") setIsPlayerAttacking(false);
                    if (name === "hit") setIsPlayerHit(false);

                    if (name === "doorIn") {
                        const nextLevel = ((levelIndex + 1) as 0 | 1 | 2);
                        pendingRespawnRef.current = { level: nextLevel };
                        setLevelIndex(nextLevel);

                        const entry = OBJECTS.find(o => o.id === "doorB");
                        if (entry) {
                            const p = playerPhys.current;
                            p.facing = 1;

                            const doorCenterX = entry.tx * TILE + TILE / 2;
                            const doorBottomY = (entry.ty + 1) * TILE;

                            p.x = doorCenterX - PLAYER_W / 2 - RENDER_OFF_X + DOOR_VISUAL_BIAS_X;
                            p.y = doorBottomY - PLAYER_H;

                            p.vx = 0;
                            p.vy = 0;
                            p.grounded = true;
                        }

                        setPhase("doorOut");
                        setPlayerAnim("doorOut");
                    }

                    if (name === "doorOut") {
                        setPhase("play");
                    }
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
