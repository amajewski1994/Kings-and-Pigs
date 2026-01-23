const BASE = import.meta.env.BASE_URL;

export const PLAYER_SPRITES = {
    idle: `${BASE}assets/Sprites/01-King Human/Idle.png`,
    run: `${BASE}assets/Sprites/01-King Human/Run.png`,
    jump: `${BASE}assets/Sprites/01-King Human/Jump.png`,
    attack: `${BASE}assets/Sprites/01-King Human/Attack.png`,
    hit: `${BASE}assets/Sprites/01-King Human/Hit.png`,
    dead: `${BASE}assets/Sprites/01-King Human/Dead.png`,
    doorIn: `${BASE}assets/Sprites/01-King Human/DoorIn.png`,
    doorOut: `${BASE}assets/Sprites/01-King Human/DoorOut.png`,
} as const;

export const ENEMY_SPRITES = {
    pig: {
        idle: `${BASE}assets/Sprites/03-Pig/Idle.png`,
        run: `${BASE}assets/Sprites/03-Pig/Run.png`,
        jump: `${BASE}assets/Sprites/03-Pig/Jump.png`,
        attack: `${BASE}assets/Sprites/03-Pig/Attack.png`,
        hit: `${BASE}assets/Sprites/03-Pig/Hit.png`,
        dead: `${BASE}assets/Sprites/03-Pig/Dead.png`,
    },
    kingPig: {
        idle: `${BASE}assets/Sprites/02-King Pig/Idle.png`,
        run: `${BASE}assets/Sprites/02-King Pig/Run.png`,
        jump: `${BASE}assets/Sprites/02-King Pig/Jump.png`,
        attack: `${BASE}assets/Sprites/02-King Pig/Attack.png`,
        hit: `${BASE}assets/Sprites/02-King Pig/Hit.png`,
        dead: `${BASE}assets/Sprites/02-King Pig/Dead.png`,
    },
} as const;

export const DOOR_SPRITES = {
    doorIdleUrl: `${BASE}assets/Sprites/11-Door/Idle.png`,
    doorOpeningUrl: `${BASE}assets/Sprites/11-Door/Opening.png`,
    doorClosingUrl: `${BASE}assets/Sprites/11-Door/Closing.png`,
} as const;

export const TILES_SPRITES = {
    tilesetUrl: `${BASE}assets/Sprites/14-TileSets/Terrain.png`,
    decorUrl: `${BASE}assets/Sprites/14-TileSets/Decorations.png`,
} as const;