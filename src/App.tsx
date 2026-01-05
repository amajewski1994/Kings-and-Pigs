import { Application } from "@pixi/react";
import { Assets, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Game } from "./Game";

const tilesetUrl = "/assets/Sprites/14-TileSets/Terrain.png";
const decorUrl = "/assets/Sprites/14-TileSets/Decorations.png";
const doorUrl = "/assets/Sprites/11-Door/Idle.png";

export default function App() {
  const [tileset, setTileset] = useState<Texture | null>(null);
  const [decorTex, setDecorTex] = useState<Texture | null>(null);
  const [doorTex, setDoorTex] = useState<Texture | null>(null);

  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [terrain, decor, door] = await Promise.all([
        Assets.load<Texture>(tilesetUrl),
        Assets.load<Texture>(decorUrl),
        Assets.load<Texture>(doorUrl),
      ]);

      terrain.source.scaleMode = "nearest";
      decor.source.scaleMode = "nearest";
      door.source.scaleMode = "nearest";
      if (!alive) return;
      setTileset(terrain);
      setDecorTex(decor);
      setDoorTex(door);
    })();
    return () => {
      alive = false;
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
        {tileset && decorTex && doorTex && <Game tileset={tileset} decorTex={decorTex} doorTex={doorTex} screenW={size.w} screenH={size.h} />}
      </Application>
    </div>
  );
}
