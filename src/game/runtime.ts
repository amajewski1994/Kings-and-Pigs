import type { Phys, CombatState } from "./types";

export const makePhys = (x: number, y: number): Phys => ({
    x,
    y,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
    jumpLock: false,
});

export const makeCombat = (): CombatState => ({
    atkT: 0,
    didHitThisSwing: false,
    iFramesT: 0,
    atkCooldownT: 0,
});

export const resetCombat = (c: CombatState) => {
    c.atkT = 0;
    c.didHitThisSwing = false;
    c.iFramesT = 0;
    c.atkCooldownT = 0;
};
