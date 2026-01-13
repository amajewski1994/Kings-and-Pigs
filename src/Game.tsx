import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState, useLayoutEffect, startTransition } from "react";

import { PLAYER_SPRITES, ENEMY_SPRITES } from './assets/sprites'
import { VISUAL_CONFIG } from './config/visuals'
import { COMBAT_CONFIG } from './config/combat'
import { POSITIONS } from './config/positions'
import { PLAYER_CONFIG } from "./config/player";
import { WORLD_CONFIG } from "./config/world";

import type { GameProps, Phase, DoorState, EntityId, EntityUI, Phys } from './game/types';

// import { TilePalette } from "./components/TilePalette";
import { TileMap } from "./components/TileMap";
import { Player } from "./components/Player";
import { Enemy } from "./components/Enemy";
import { HPBar } from "./components/HPBar";
import { useKeyboard } from "./components/useKeyboard";
import { MapObjects } from "./components/MapObjects";

import { makeSampleShapeMap0, makeSampleShapeMap1, makeSampleShapeMap2 } from "./game/shapeGen";
import { makeSolidSet, moveWithTileCollision } from "./game/collision";
import { OBJECTS } from "./game/objects";
import { makePhys, makeCombat } from "./game/runtime";

export function Game({
    tileset,
    decorTex,
    screenW,
    screenH
}: GameProps) {
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

    const {
        PLAYER_MAX_HP,
        ENEMY_MAX_HP,
        DAMAGE_PLAYER,
        DAMAGE_ENEMY,
        KING_MAX_HP,
        KING_DAMAGE,
        KING_SPEED,
        ATTACK_RANGE_X,
        ATTACK_RANGE_Y,
        ATTACK_WINDUP,
        ATTACK_ACTIVE,
        IFRAME_TIME,
        ENEMY_ATK_COOLDOWN,
        ENEMY_SPEED,
        ENEMY_STOP_DIST,
    } = COMBAT_CONFIG;

    const {
        START_PLAYER_X,
        START_PLAYER_Y,
        START_ENEMY_X,
        START_ENEMY_Y,
        START_ENEMY2_X,
        START_ENEMY2_Y,
    } = POSITIONS

    const { DOOR_VISUAL_BIAS_X } = VISUAL_CONFIG;

    const [entities, setEntities] = useState<Record<EntityId, EntityUI>>({
        player: { x: START_PLAYER_X, y: START_PLAYER_Y, hp: PLAYER_MAX_HP, flipX: false, anim: "idle", flags: { attacking: false, hit: false, dead: false } },
        enemy1: { x: START_ENEMY_X, y: START_ENEMY_Y, hp: ENEMY_MAX_HP, flipX: false, anim: "idle", flags: { attacking: false, hit: false, dead: false, aggro: false } },
        enemy2: { x: START_ENEMY2_X, y: START_ENEMY2_Y, hp: ENEMY_MAX_HP, flipX: false, anim: "idle", flags: { attacking: false, hit: false, dead: true, aggro: false } },
    });

    const { player, enemy1, enemy2 } = entities

    const [levelIndex, setLevelIndex] = useState<0 | 1 | 2>(0);
    const [phase, setPhase] = useState<Phase>("play");
    const [doorAState, setDoorAState] = useState<DoorState>("idle");
    const [doorBState, setDoorBState] = useState<DoorState>("idle");

    const mapOffsetRef = useRef({ x: 0, y: 0 });
    const transitionedRef = useRef(false);

    const isBossLevel = levelIndex === 2;
    const enemy1Profile = {
        maxHp: isBossLevel ? KING_MAX_HP : ENEMY_MAX_HP,
        damage: isBossLevel ? KING_DAMAGE : DAMAGE_ENEMY,
        speed: isBossLevel ? KING_SPEED : ENEMY_SPEED,
        frameW: isBossLevel ? 38 : 34,
        frameH: 28,
        urls: {
            idleUrl: isBossLevel ? ENEMY_SPRITES.kingPig.idle : ENEMY_SPRITES.pig.idle,
            runUrl: isBossLevel ? ENEMY_SPRITES.kingPig.run : ENEMY_SPRITES.pig.run,
            jumpUrl: isBossLevel ? ENEMY_SPRITES.kingPig.jump : ENEMY_SPRITES.pig.jump,
            attackUrl: isBossLevel ? ENEMY_SPRITES.kingPig.attack : ENEMY_SPRITES.pig.attack,
            hitUrl: isBossLevel ? ENEMY_SPRITES.kingPig.hit : ENEMY_SPRITES.pig.hit,
            deadUrl: isBossLevel ? ENEMY_SPRITES.kingPig.dead : ENEMY_SPRITES.pig.dead,
        },
    };

    const hasEnemy2 = levelIndex === 1;

    const playerPhys = useRef(makePhys(START_PLAYER_X, START_PLAYER_Y));
    const enemyPhys = useRef(makePhys(START_ENEMY_X, START_ENEMY_Y));
    const enemy2Phys = useRef(makePhys(START_ENEMY2_X, START_ENEMY2_Y));

    const playerCombat = useRef(makeCombat());
    const enemyCombat = useRef(makeCombat());
    const enemy2Combat = useRef(makeCombat());

    const pendingRespawnRef = useRef<null | { level: 0 | 1 | 2 }>(null);

    const keysRef = useKeyboard();

    const mapPxW = MAP_W * TILE;
    const mapPxH = MAP_H * TILE;

    const mapOffsetX = Math.floor((screenW - mapPxW) / 2);
    const mapOffsetY = Math.floor((screenH - mapPxH) / 2);

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

    const patchEntity = (id: EntityId, patch: Partial<EntityUI>) => {
        setEntities(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
    };

    const patchFlags = (id: EntityId, patch: Partial<EntityUI["flags"]>) => {
        setEntities(prev => ({
            ...prev,
            [id]: { ...prev[id], flags: { ...prev[id].flags, ...patch } },
        }));
    };

    useEffect(() => {
        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return;
            patchFlags('player', { attacking: true })
        };

        window.addEventListener("mousedown", onMouseDown);
        return () => window.removeEventListener("mousedown", onMouseDown);
    }, []);

    useEffect(() => { transitionedRef.current = false; }, [levelIndex]);

    useEffect(() => {
        startTransition(() => {
            setDoorAState(entities.enemy1.flags.dead ? "opening" : "idle");
        });
    }, [entities.enemy1.flags.dead]);

    useEffect(() => {
        if (levelIndex === 0) return;

        startTransition(() => {
            patchFlags('player', { dead: false, hit: false, attacking: false });

            patchEntity('enemy1', { hp: levelIndex === 2 ? KING_MAX_HP : ENEMY_MAX_HP })
            patchFlags('enemy1', { dead: false, hit: false, attacking: false, aggro: false });

            setDoorBState("closing");
            setDoorAState("idle");

            if (levelIndex === 1) {
                patchEntity('enemy2', { hp: ENEMY_MAX_HP })
                patchFlags('enemy2', { dead: false, hit: false, attacking: false, aggro: false });
            } else {
                patchFlags('enemy2', { dead: true });
            }
        });

        const t = window.setTimeout(() => {
            startTransition(() => setDoorBState("idle"));
        }, 600);

        return () => window.clearTimeout(t);
    }, [levelIndex]);

    useLayoutEffect(() => {
        mapOffsetRef.current.x = mapOffsetX;
        mapOffsetRef.current.y = mapOffsetY;
    }, [mapOffsetX, mapOffsetY]);

    const inMeleeRange = (ax: number, ay: number, bx: number, by: number) => {
        return Math.abs(ax - bx) <= ATTACK_RANGE_X && Math.abs(ay - by) <= ATTACK_RANGE_Y;
    };

    const stepCombatTimers = (dt: number, c: { iFramesT: number; atkCooldownT: number }) => {
        c.iFramesT = Math.max(0, c.iFramesT - dt);
        c.atkCooldownT = Math.max(0, c.atkCooldownT - dt);
    };

    const computeAttackActive = (attacking: boolean, atkT: number) =>
        attacking && atkT >= ATTACK_WINDUP && atkT <= (ATTACK_WINDUP + ATTACK_ACTIVE);

    const applyDamage = (targetId: EntityId, currentHp: number, dmg: number) => {
        const nextHp = Math.max(0, currentHp - dmg);
        patchEntity(targetId, { hp: nextHp });
        patchFlags(targetId, { dead: nextHp === 0, hit: nextHp > 0 });
        return nextHp;
    };

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

    useTick((Ticker) => {
        const dtRaw = Ticker.deltaMS / 1000;
        const dt = Math.min(dtRaw, 1 / 20);

        const k = keysRef.current;

        const p = playerPhys.current;
        const ep = enemyPhys.current;
        const ep2 = enemy2Phys.current;

        const pc = playerCombat.current;
        const ec = enemyCombat.current;
        const ec2 = enemy2Combat.current;

        const hasEnemy2 = levelIndex === 1;
        const allowInput = phase === "play" && !player.flags.dead;

        const pending = pendingRespawnRef.current;
        if (pending) {
            pendingRespawnRef.current = null;

            Object.assign(ep, makePhys(START_ENEMY_X, START_ENEMY_Y), { facing: -1 });
            if (pending.level === 1) Object.assign(ep2, makePhys(START_ENEMY2_X, START_ENEMY2_Y), { facing: -1 });
        }

        pc.iFramesT = Math.max(0, pc.iFramesT - dt);
        stepCombatTimers(dt, ec);
        if (hasEnemy2) stepCombatTimers(dt, ec2);

        if (player.flags.dead && enemy1.flags.attacking) patchFlags("enemy1", { attacking: false });

        let dir = 0;
        if (allowInput) {
            if (k.left) dir -= 1;
            if (k.right) dir += 1;
        }

        p.vx = dir * SPEED;
        if (allowInput && dir !== 0) p.facing = dir < 0 ? -1 : 1;

        if (allowInput && k.jump && p.grounded && !p.jumpLock) {
            p.vy = -JUMP_V;
            p.grounded = false;
            p.jumpLock = true;
        }
        if (!k.jump) p.jumpLock = false;

        const applyGravity = (ent: { grounded: boolean; vy: number }) => {
            ent.vy = ent.grounded ? 0 : ent.vy + GRAVITY * dt;
        };
        applyGravity(p);
        applyGravity(ep);
        if (hasEnemy2) applyGravity(ep2);

        const collide = (phys: Phys) => {
            const rect = { x: phys.x, y: phys.y, w: PLAYER_W, h: PLAYER_H };
            const res = moveWithTileCollision({ map, solid, tileSize: TILE, rect, vx: phys.vx, vy: phys.vy, dt });
            phys.x = res.rect.x; phys.y = res.rect.y; phys.vx = res.vx; phys.vy = res.vy; phys.grounded = res.grounded;
            return rect;
        };

        const pRect = collide(p);
        collide(ep);
        if (hasEnemy2) collide(ep2);

        const offX = mapOffsetRef.current.x;
        const offY = mapOffsetRef.current.y;

        const toRender = (phys: Phys) => ({
            x: Math.round(phys.x + PLAYER_W / 2 + RENDER_OFF_X),
            y: Math.floor(phys.y + PLAYER_H + RENDER_OFF_Y),
        });

        const pr = toRender(p);
        const er1 = toRender(ep);
        const er2 = hasEnemy2 ? toRender(ep2) : null;

        patchEntity("player", { x: offX + pr.x, y: offY + pr.y, flipX: p.facing === -1 });
        patchEntity("enemy1", { x: offX + er1.x, y: offY + er1.y, flipX: ep.facing === -1 });

        if (hasEnemy2 && er2) patchEntity("enemy2", { x: offX + er2.x, y: offY + er2.y, flipX: ep2.facing === -1 });

        if (offY + pr.y > 550) {
            if (!enemy1.flags.aggro) patchFlags("enemy1", { aggro: true });
            if (hasEnemy2 && !enemy2.flags.aggro) patchFlags("enemy2", { aggro: true });
        }

        const enemies = hasEnemy2
            ? ([
                { id: "enemy1" as const, ui: enemy1, phys: ep, combat: ec, speed: enemy1Profile.speed, damage: enemy1Profile.damage },
                { id: "enemy2" as const, ui: enemy2, phys: ep2, combat: ec2, speed: ENEMY_SPEED, damage: DAMAGE_ENEMY },
            ])
            : ([
                { id: "enemy1" as const, ui: enemy1, phys: ep, combat: ec, speed: enemy1Profile.speed, damage: enemy1Profile.damage },
            ]);

        for (const e of enemies) {
            const ui = e.ui;
            const phys = e.phys;
            const c = e.combat;

            if (ui.flags.aggro && !ui.flags.dead && !ui.flags.hit && !player.flags.dead) {
                const dx = p.x - phys.x;
                const absDx = Math.abs(dx);
                const dirE = dx < 0 ? -1 : 1;
                phys.facing = dirE as 1 | -1;

                phys.vx = (!ui.flags.attacking && absDx > ENEMY_STOP_DIST) ? dirE * e.speed : 0;
            } else {
                phys.vx = 0;
            }

            const canAct = !ui.flags.dead && !player.flags.dead;
            if (
                ui.flags.aggro &&
                canAct &&
                !ui.flags.attacking &&
                !ui.flags.hit &&
                c.atkCooldownT <= 0 &&
                inMeleeRange(phys.x, phys.y, p.x, p.y)
            ) {
                patchFlags(e.id, { attacking: true });
                c.atkT = 0;
                c.didHitThisSwing = false;
                c.atkCooldownT = ENEMY_ATK_COOLDOWN;
            }

            if (ui.flags.attacking) c.atkT += dt;
            else { c.atkT = 0; c.didHitThisSwing = false; }
        }

        if (player.flags.attacking) pc.atkT += dt;
        else { pc.atkT = 0; pc.didHitThisSwing = false; }

        const playerAttackActive = computeAttackActive(player.flags.attacking, pc.atkT);

        if (playerAttackActive && !pc.didHitThisSwing) {
            for (const e of enemies) {
                if (e.ui.flags.dead) continue;
                const c = e.combat;
                if (c.iFramesT > 0) continue;

                if (inMeleeRange(p.x, p.y, e.phys.x, e.phys.y)) {
                    pc.didHitThisSwing = true;
                    c.iFramesT = IFRAME_TIME;
                    applyDamage(e.id, e.ui.hp, DAMAGE_PLAYER);
                    break;
                }
            }
        }

        if (!player.flags.dead && pc.iFramesT <= 0) {
            for (const e of enemies) {
                const active = computeAttackActive(e.ui.flags.attacking, e.combat.atkT);
                if (!active || e.combat.didHitThisSwing) continue;

                if (inMeleeRange(e.phys.x, e.phys.y, p.x, p.y)) {
                    e.combat.didHitThisSwing = true;
                    pc.iFramesT = IFRAME_TIME;
                    applyDamage("player", player.hp, e.damage);
                    break;
                }
            }
        }

        const nextPlayerAnimBase: "idle" | "run" | "jump" = !p.grounded ? "jump" : dir !== 0 ? "run" : "idle";
        const nextPlayerAnim =
            phase === "doorIn" ? "doorIn" :
                phase === "doorOut" ? "doorOut" :
                    player.flags.dead ? "dead" :
                        player.flags.hit ? "hit" :
                            player.flags.attacking ? "attack" :
                                nextPlayerAnimBase;

        patchEntity("player", { anim: nextPlayerAnim });

        const enemyBaseAnim = (phys: Phys) => (!phys.grounded ? "jump" : phys.vx !== 0 ? "run" : "idle");
        for (const e of enemies) {
            const ui = e.ui;
            const base = enemyBaseAnim(e.phys);
            const anim =
                ui.flags.dead ? "dead" :
                    ui.flags.hit ? "hit" :
                        ui.flags.attacking ? "attack" :
                            base;

            patchEntity(e.id, { anim });
        }

        // NEXT LEVEL
        const allEnemiesDead = hasEnemy2 ? (enemy1.flags.dead && enemy2.flags.dead) : enemy1.flags.dead;

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
                patchEntity("player", { anim: 'doorIn' });
            }
        }
    });

    const onEnemyAnimComplete = (id: "enemy1" | "enemy2") => (name: string) => {
        if (name === "attack") patchFlags(id, { attacking: false });
        if (name === "hit") patchFlags(id, { hit: false });
    };

    const onPlayerAnimComplete = (name: string) => {
        if (name === "attack") patchFlags("player", { attacking: false });
        if (name === "hit") patchFlags("player", { hit: false });

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
            patchEntity("player", { anim: "doorOut" });
        }

        if (name === "doorOut") setPhase("play");
    };

    const enemiesToRender = hasEnemy2 ? ([
        {
            id: "enemy1" as const,
            ui: enemy1,
            hpMax: enemy1Profile.maxHp,
            enemyProps: {
                frameW: enemy1Profile.frameW,
                frameH: enemy1Profile.frameH,
                ...enemy1Profile.urls,
            },
        },
        {
            id: "enemy2" as const,
            ui: enemy2,
            hpMax: ENEMY_MAX_HP,
            enemyProps: {
                idleUrl: ENEMY_SPRITES.pig.idle,
                runUrl: ENEMY_SPRITES.pig.run,
                jumpUrl: ENEMY_SPRITES.pig.jump,
                attackUrl: ENEMY_SPRITES.pig.attack,
                hitUrl: ENEMY_SPRITES.pig.hit,
                deadUrl: ENEMY_SPRITES.pig.dead,
            },
        },
    ]) : ([
        {
            id: "enemy1" as const,
            ui: enemy1,
            hpMax: enemy1Profile.maxHp,
            enemyProps: {
                frameW: enemy1Profile.frameW,
                frameH: enemy1Profile.frameH,
                ...enemy1Profile.urls,
            },
        },
    ]);

    return (
        <>
            {/* WORLD */}
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

            {/* UI: HP bars (enemies first, then player) */}
            {enemiesToRender.map(({ id, ui, hpMax }) => (
                <HPBar
                    key={`${id}-hp`}
                    x={ui.x}
                    y={ui.y}
                    hp={ui.hp}
                    maxHp={hpMax}
                    flipX={ui.flipX}
                />
            ))}

            <HPBar
                x={player.x}
                y={player.y}
                hp={player.hp}
                maxHp={PLAYER_MAX_HP}
                flipX={player.flipX}
            />

            {/* ENTITIES */}
            {enemiesToRender.map(({ id, ui, enemyProps }) => (
                <Enemy
                    key={id}
                    x={ui.x}
                    y={ui.y}
                    anim={ui.anim}
                    flipX={ui.flipX}
                    fps={10}
                    onAnimComplete={onEnemyAnimComplete(id)}
                    {...enemyProps}
                />
            ))}

            <Player
                x={player.x}
                y={player.y}
                anim={player.anim}
                flipX={player.flipX}
                fps={10}
                idleUrl={PLAYER_SPRITES.idle}
                runUrl={PLAYER_SPRITES.run}
                jumpUrl={PLAYER_SPRITES.jump}
                attackUrl={PLAYER_SPRITES.attack}
                hitUrl={PLAYER_SPRITES.hit}
                deadUrl={PLAYER_SPRITES.dead}
                doorInUrl={PLAYER_SPRITES.doorIn}
                doorOutUrl={PLAYER_SPRITES.doorOut}
                onAnimComplete={onPlayerAnimComplete}
            />
        </>
    );
}
