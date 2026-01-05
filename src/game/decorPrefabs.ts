export type DecorPrefab = {
    id: string;
    tiles: number[][];
    origin?: "tl" | "bl";
};

export const DECOR_PREFABS: Record<string, DecorPrefab> = {
    windowA: {
        id: "windowA",
        origin: "tl",
        tiles: [
            [23, 24],
            [30, 31],
        ],
    },
    windowB: {
        id: "windowB",
        origin: "tl",
        tiles: [
            [25, 26],
            [32, 33],
        ],
    },

    pillarA: {
        id: "pillarA",
        origin: "tl",
        tiles: [
            [8],
            [15],
            [22],
        ],
    },

    pillarB: {
        id: "pillarB",
        origin: "tl",
        tiles: [
            [8],
            [15],
            [29],
        ],
    },
};
