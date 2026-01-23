const BASE = import.meta.env.BASE_URL;

export const SOUNDS = {
    playerMiss: `${BASE}assets/Sounds/playerMiss.mp3`,
    playerDead: `${BASE}assets/Sounds/playerDead.mp3`,
    playerHit0: `${BASE}assets/Sounds/playerHit0.mp3`,
    playerHit1: `${BASE}assets/Sounds/playerHit1.mp3`,
    pigDead: `${BASE}assets/Sounds/pigDead.mp3`,
    pigHit: `${BASE}assets/Sounds/pigHit.mp3`,
    kingPigDead: `${BASE}assets/Sounds/kingPigDead.mp3`,
    lost: `${BASE}assets/Sounds/lost.mp3`,
    victory: `${BASE}assets/Sounds/victory.mp3`,
    background: `${BASE}assets/Sounds/background.mp3`,
    nextLevel: `${BASE}assets/Sounds/nextLevel.mp3`,
} as const;