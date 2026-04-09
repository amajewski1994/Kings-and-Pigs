import { Application } from "@pixi/react";
import { Assets, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Game } from "./Game";
import { TILES_SPRITES } from "./assets/sprites";

const { tilesetUrl, decorUrl } = TILES_SPRITES;

export default function App() {
  const [tileset, setTileset] = useState<Texture | null>(null);
  const [decorTex, setDecorTex] = useState<Texture | null>(null);
  const [gameReady, setGameReady] = useState(false);

  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    console.log("[App] render", {
      gameReady,
      hasTileset: !!tileset,
      hasDecorTex: !!decorTex,
    })

    let alive = true;

    (async () => {
      console.log("[App] start loading textures");

      const [terrain, decor] = await Promise.all([
        Assets.load<Texture>(tilesetUrl),
        Assets.load<Texture>(decorUrl),
      ]);

      console.log("[App] textures loaded", {
        tilesetUrl,
        decorUrl,
        terrainWidth: terrain.width,
        terrainHeight: terrain.height,
        decorWidth: decor.width,
        decorHeight: decor.height,
      });

      terrain.source.scaleMode = "nearest";
      decor.source.scaleMode = "nearest";

      if (!alive) return;

      setTileset(terrain);
      setDecorTex(decor);
      console.log("[App] textures saved to state");
    })();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!tileset || !decorTex) return;

    console.log("[App] scheduling Game mount after 2 RAFs");

    let raf1 = 0;
    let raf2 = 0;

    raf1 = requestAnimationFrame(() => {
      console.log("[App] RAF 1");
      raf2 = requestAnimationFrame(() => {
        console.log("[App] RAF 2 -> gameReady=true");
        setGameReady(true);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [tileset, decorTex]);

  useEffect(() => {
    console.log("[App] gameReady changed:", gameReady);
  }, [gameReady]);

  useEffect(() => {
    console.log("[App] tileset changed:", !!tileset);
  }, [tileset]);

  useEffect(() => {
    console.log("[App] decorTex changed:", !!decorTex);
  }, [decorTex]);

  useEffect(() => {
    return () => {
      console.log("[App] unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[Application wrapper] mounted");
    return () => console.log("[Application wrapper] unmounted");
  }, []);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      console.error("[window.onerror]", event.message, event.error);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[unhandledrejection]", event.reason);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Application
        width={size.w}
        height={size.h}
        backgroundColor={0x0b1020}
        antialias={false}
        autoDensity
        resolution={window.devicePixelRatio || 1}
      >
        {gameReady && tileset && decorTex && (
          <Game
            key="game-ready"
            tileset={tileset}
            decorTex={decorTex}
            screenW={size.w}
            screenH={size.h}
          />
        )}
      </Application>
    </div>
  );
}