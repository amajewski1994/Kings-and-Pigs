export type ObjectKind = "decor" | "door";

export type MapObject = {
    id: string;
    kind: "decor" | "door";
    tx: number;
    ty: number;

    prefabId?: string;
    z?: number;
};


export const OBJECTS: MapObject[] = [
    { id: "winA", kind: "decor", tx: 6, ty: 4.5, prefabId: "windowA", z: 0 },
    { id: "winB", kind: "decor", tx: 12, ty: 4.5, prefabId: "windowB", z: 0 },
    { id: "winC", kind: "decor", tx: 18, ty: 4.5, prefabId: "windowA", z: 0 },
    { id: "pillarA", kind: "decor", tx: 12, ty: 7, prefabId: "pillarA", z: 0 },
    { id: "pillarB", kind: "decor", tx: 14.5, ty: 7, prefabId: "pillarB", z: 0 },
    { id: "pillarC", kind: "decor", tx: 17, ty: 7, prefabId: "pillarA", z: 0 },
    { id: "doorA", kind: "door", tx: 20, ty: 10, z: 0 },
];