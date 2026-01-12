import { Texture } from "pixi.js";

export type GameProps = {
    tileset: Texture;
    decorTex: Texture;
    screenW: number;
    screenH: number;
};

export type WallTiles = {
    tl: number;
    t: number;
    tr: number;
    l: number;
    r: number;
    bl: number;
    b: number;
    br: number;

    innerTL: number;
    innerTR: number;
    innerBL: number;
    innerBR: number;
};

export type Mask = boolean[][];

export type ObjectKind = "decor" | "door";

export type MapObject = {
    id: string;
    kind: "decor" | "door";
    tx: number;
    ty: number;

    prefabId?: string;
    z?: number;
};

export type DecorPrefab = {
    id: string;
    tiles: number[][];
    origin?: "tl" | "bl";
};

export type Rect = { x: number; y: number; w: number; h: number };

export type DoorState = "idle" | "opening" | "closing";

export type DoorProps = {
    x: number;
    y: number;

    idleUrl: string;
    openingUrl: string;
    closingUrl: string;

    frameW?: number; // 46
    frameH?: number; // 56
    fps?: number;    // 10–12

    state?: DoorState;
    autoCycle?: boolean;
};

export type AnimName = "idle" | "run" | "jump" | "attack" | "hit" | "dead" | "doorIn" | "doorOut";

export type EnemyProps = {
    x: number;
    y: number;
    anim: AnimName;

    idleUrl: string;
    runUrl: string;
    jumpUrl: string;
    attackUrl: string;
    hitUrl: string;
    deadUrl: string;

    onAnimComplete?: (name: AnimName) => void;

    frameW?: number; // 34
    frameH?: number; // 28
    fps?: number;    // 10–12
    flipX?: boolean;
};

export type PlayerProps = {
    x: number;
    y: number;
    anim: AnimName;

    idleUrl: string;
    runUrl: string;
    jumpUrl: string;
    attackUrl: string;
    hitUrl: string;
    deadUrl: string;
    doorInUrl: string;
    doorOutUrl: string;

    onAnimComplete?: (name: AnimName) => void;

    frameW?: number; // 78
    frameH?: number; // 58
    fps?: number;    // 10–12
    flipX?: boolean;
};

export type HPBarProps = {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    flipX?: boolean;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
};

export type MapObjectsProps = {
    objects: MapObject[];
    decorTex: Texture;
    tileSize: number;

    worldX: number;
    worldY: number;

    doorState?: "idle" | "opening" | "closing";
    levelIndex: 0 | 1 | 2;
    doorStates: Partial<Record<string, "idle" | "opening" | "closing">>;
};

export type TileMapProps = {
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

export type TilePaletteProps = {
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

export type KeysProps = {
    left: boolean;
    right: boolean;
    jump: boolean;
};