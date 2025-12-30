import { Application } from "@pixi/react";
import { Assets, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import { Game } from "./Game";

const tilesetUrl = "/assets/Sprites/14-TileSets/Terrain.png";

export default function App() {
  const [tileset, setTileset] = useState<Texture | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const tex = await Assets.load<Texture>(tilesetUrl);
      tex.source.scaleMode = "nearest";
      if (alive) setTileset(tex);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Application width={1000} height={720} backgroundColor={0x0b1020}>
      {tileset && <Game tileset={tileset} />}
    </Application>
  );
}
