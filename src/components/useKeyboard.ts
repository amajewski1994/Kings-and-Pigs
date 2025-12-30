import { useEffect, useRef } from "react";

type Keys = {
    left: boolean;
    right: boolean;
    jump: boolean;
};

export function useKeyboard() {
    const keysRef = useRef<Keys>({ left: false, right: false, jump: false });

    useEffect(() => {
        const onDown = (e: KeyboardEvent) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = true;
            if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = true;
            if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") keysRef.current.jump = true;
        };

        const onUp = (e: KeyboardEvent) => {
            if (e.code === "ArrowLeft" || e.code === "KeyA") keysRef.current.left = false;
            if (e.code === "ArrowRight" || e.code === "KeyD") keysRef.current.right = false;
            if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") keysRef.current.jump = false;
        };

        window.addEventListener("keydown", onDown);
        window.addEventListener("keyup", onUp);

        return () => {
            window.removeEventListener("keydown", onDown);
            window.removeEventListener("keyup", onUp);
        };
    }, []);

    return keysRef;
}
