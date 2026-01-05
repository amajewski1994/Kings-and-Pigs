import { useEffect, useMemo, useRef, useState } from "react";
import { Assets, Rectangle, Texture, AnimatedSprite } from "pixi.js";

type AnimName = "idle" | "run" | "jump" | "attack" | "hit" | "dead";

type PlayerProps = {
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
    attackUrl,
    hitUrl,
    deadUrl,
    frameW = 78,
    frameH = 58,
    fps = 10,
    flipX = false,
    onAnimComplete
}: PlayerProps) {
    const [idleFrames, setIdleFrames] = useState<Texture[] | null>(null);
    const [runFrames, setRunFrames] = useState<Texture[] | null>(null);
    const [jumpFrames, setJumpFrames] = useState<Texture[] | null>(null);
    const [attackFrames, setAttackFrames] = useState<Texture[] | null>(null);
    const [hitFrames, setHitFrames] = useState<Texture[] | null>(null);
    const [deadFrames, setDeadFrames] = useState<Texture[] | null>(null);

    const spriteRef = useRef<AnimatedSprite | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const [idleTex, runTex, jumpTex, attackTex, hitTex, deadTex] = await Promise.all([
                    Assets.load<Texture>(idleUrl),
                    Assets.load<Texture>(runUrl),
                    Assets.load<Texture>(jumpUrl),
                    Assets.load<Texture>(attackUrl),
                    Assets.load<Texture>(hitUrl),
                    Assets.load<Texture>(deadUrl),
                ]);

                idleTex.source.scaleMode = "nearest";
                runTex.source.scaleMode = "nearest";
                jumpTex.source.scaleMode = "nearest";
                attackTex.source.scaleMode = "nearest";
                hitTex.source.scaleMode = "nearest";
                deadTex.source.scaleMode = "nearest";

                const idle = sliceHorizontalSheet(idleTex, frameW, frameH);
                const run = sliceHorizontalSheet(runTex, frameW, frameH);
                const jump = sliceHorizontalSheet(jumpTex, frameW, frameH);
                const attack = sliceHorizontalSheet(attackTex, frameW, frameH);
                const hit = sliceHorizontalSheet(hitTex, frameW, frameH);
                const dead = sliceHorizontalSheet(deadTex, frameW, frameH);

                if (!alive) return;

                setIdleFrames(idle);
                setRunFrames(run);
                setJumpFrames(jump);
                setAttackFrames(attack);
                setHitFrames(hit);
                setDeadFrames(dead);
            } catch (e) {
                console.error("Failed to load player sprites:", e);
            }
        })();

        return () => {
            alive = false;
        };
    }, [idleUrl, runUrl, jumpUrl, attackUrl, hitUrl, deadUrl, frameW, frameH]);

    const textures = useMemo(() => {
        switch (anim) {
            case "idle": return idleFrames;
            case "run": return runFrames;
            case "jump": return jumpFrames;
            case "attack": return attackFrames;
            case "hit": return hitFrames;
            case "dead": return deadFrames;
        }
    }, [anim, idleFrames, runFrames, jumpFrames, attackFrames, hitFrames, deadFrames]);

    const animationSpeed = fps / 60;

    const prevAnim = useRef<AnimName | null>(null);

    useEffect(() => {
        const s = spriteRef.current;
        if (!s || !textures) return;

        const animChanged = prevAnim.current !== anim;

        if (s.textures !== textures) {
            s.textures = textures;
        }

        const isOneShot = anim === "jump" || anim === "attack" || anim === "hit" || anim === "dead";
        s.loop = !isOneShot;
        s.animationSpeed = animationSpeed;

        s.onComplete = undefined;
        if (anim === "attack") s.onComplete = () => onAnimComplete?.("attack");
        if (anim === "hit") s.onComplete = () => onAnimComplete?.("hit");

        if (animChanged) {
            s.gotoAndPlay(0);
            prevAnim.current = anim;
        } else {
            if (!s.playing) s.play();
        }
    }, [anim, textures, animationSpeed, onAnimComplete]);



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
