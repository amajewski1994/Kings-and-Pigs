import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedSprite, Assets, Rectangle, Texture } from "pixi.js";

type DoorState = "idle" | "opening" | "closing";

type Props = {
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

const defer = (fn: () => void) => {
    if (typeof queueMicrotask === "function") queueMicrotask(fn);
    else setTimeout(fn, 0);
};

function sliceHorizontal(tex: Texture, frameW: number, frameH: number) {
    const frames = Math.floor(tex.source.width / frameW);
    return Array.from({ length: frames }, (_, i) => {
        return new Texture({
            source: tex.source,
            frame: new Rectangle(i * frameW, 0, frameW, frameH),
        });
    });
}

export function Door({
    x,
    y,
    idleUrl,
    openingUrl,
    closingUrl,
    frameW = 46,
    frameH = 56,
    fps = 10,
    state = "idle",
    autoCycle = false,
}: Props) {
    const [idleFrames, setIdleFrames] = useState<Texture[] | null>(null);
    const [openFrames, setOpenFrames] = useState<Texture[] | null>(null);
    const [closeFrames, setCloseFrames] = useState<Texture[] | null>(null);

    const spriteRef = useRef<AnimatedSprite | null>(null);

    const [internalState, setInternalState] = useState<DoorState>(state);

    const effectiveState: DoorState = autoCycle ? internalState : state;

    useEffect(() => {
        let alive = true;

        (async () => {
            const [idleTex, openTex, closeTex] = await Promise.all([
                Assets.load<Texture>(idleUrl),
                Assets.load<Texture>(openingUrl),
                Assets.load<Texture>(closingUrl),
            ]);

            idleTex.source.scaleMode = "nearest";
            openTex.source.scaleMode = "nearest";
            closeTex.source.scaleMode = "nearest";

            const idle = sliceHorizontal(idleTex, frameW, frameH);
            const opening = sliceHorizontal(openTex, frameW, frameH);
            const closing = sliceHorizontal(closeTex, frameW, frameH);

            if (!alive) return;
            setIdleFrames(idle);
            setOpenFrames(opening);
            setCloseFrames(closing);
        })();

        return () => {
            alive = false;
        };
    }, [idleUrl, openingUrl, closingUrl, frameW, frameH]);

    const textures = useMemo(() => {
        if (effectiveState === "opening") return openFrames;
        if (effectiveState === "closing") return closeFrames;
        return idleFrames;
    }, [effectiveState, idleFrames, openFrames, closeFrames]);

    const animationSpeed = fps / 60;

    const startedRef = useRef(false);
    useEffect(() => {
        if (!autoCycle) {
            startedRef.current = false;
            return;
        }
        if (!idleFrames || !openFrames || !closeFrames) return;
        if (startedRef.current) return;

        startedRef.current = true;
        defer(() => setInternalState("opening"));
    }, [autoCycle, idleFrames, openFrames, closeFrames]);

    useEffect(() => {
        const s = spriteRef.current;
        if (!s || !textures) return;

        s.textures = textures;
        s.animationSpeed = animationSpeed;

        s.onComplete = undefined;

        if (effectiveState === "opening" || effectiveState === "closing") {
            // Opening || Closing
            s.loop = false;
            s.gotoAndPlay(0);

            if (autoCycle) {
                s.onComplete = () => {
                    defer(() => {
                        setInternalState((prev) => (prev === "opening" ? "closing" : "opening"));
                    });
                };
            }
        } else {
            // Idle
            s.loop = true;
            s.gotoAndPlay(0);
        }
    }, [textures, effectiveState, animationSpeed, autoCycle]);

    if (!textures) return null;

    return (
        <pixiAnimatedSprite
            ref={(node: AnimatedSprite | null) => {
                spriteRef.current = node;
            }}
            textures={textures}
            x={x}
            y={y}
            anchor={{ x: 0.5, y: 1 }}
        />
    );
}
