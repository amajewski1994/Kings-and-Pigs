import { useEffect, useMemo, useRef, useState } from "react";
import { Assets, Rectangle, Texture, AnimatedSprite } from "pixi.js";

type AnimName = "idle" | "run" | "jump";

type PlayerProps = {
    x: number;
    y: number;
    anim: AnimName;

    idleUrl: string;
    runUrl: string;
    jumpUrl: string;

    frameW?: number; // 78
    frameH?: number; // 58
    fps?: number;    // 10–12
    flipX?: boolean;
};

function sliceHorizontalSheet(tex: Texture, frameW: number, frameH: number) {
    const frames = Math.floor(tex.source.width / frameW);
    return Array.from({ length: frames }, (_, i) => {
        return new Texture({
            source: tex.source,
            frame: new Rectangle(i * frameW, 0, frameW, frameH),
        });
    });
}

export function Player({
    x,
    y,
    anim,
    idleUrl,
    runUrl,
    jumpUrl,
    frameW = 78,
    frameH = 58,
    fps = 10,
    flipX = false,
}: PlayerProps) {
    const [idleFrames, setIdleFrames] = useState<Texture[] | null>(null);
    const [runFrames, setRunFrames] = useState<Texture[] | null>(null);
    const [jumpFrames, setJumpFrames] = useState<Texture[] | null>(null);

    const spriteRef = useRef<AnimatedSprite | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const [idleTex, runTex, jumpTex] = await Promise.all([
                    Assets.load<Texture>(idleUrl),
                    Assets.load<Texture>(runUrl),
                    Assets.load<Texture>(jumpUrl),
                ]);

                idleTex.source.scaleMode = "nearest";
                runTex.source.scaleMode = "nearest";
                jumpTex.source.scaleMode = "nearest";

                const idle = sliceHorizontalSheet(idleTex, frameW, frameH);
                const run = sliceHorizontalSheet(runTex, frameW, frameH);
                const jump = sliceHorizontalSheet(jumpTex, frameW, frameH);

                if (!alive) return;

                setIdleFrames(idle);
                setRunFrames(run);
                setJumpFrames(jump);
            } catch (e) {
                console.error("Failed to load player sprites:", e);
            }
        })();

        return () => {
            alive = false;
        };
    }, [idleUrl, runUrl, jumpUrl, frameW, frameH]);

    const textures = useMemo(() => {
        if (anim === "idle") return idleFrames;
        if (anim === "run") return runFrames;
        return jumpFrames;
    }, [anim, idleFrames, runFrames, jumpFrames]);

    const animationSpeed = fps / 60;

    useEffect(() => {
        const s = spriteRef.current;
        if (!s || !textures) return;

        s.textures = textures;
        s.loop = anim !== "jump";
        s.animationSpeed = animationSpeed;
        s.gotoAndPlay(0);
    }, [textures, anim, animationSpeed]);

    if (!textures) return null;

    return (
        <pixiAnimatedSprite
            ref={(node: AnimatedSprite | null) => {
                spriteRef.current = node;
                if (node) {
                    node.animationSpeed = animationSpeed;
                    node.loop = anim !== "jump";
                    node.play();
                }
            }}
            textures={textures}
            x={x}
            y={y}
            anchor={{ x: 0.5, y: 1 }}
            scale={{ x: flipX ? -1 : 1, y: 1 }}
        />
    );
}
