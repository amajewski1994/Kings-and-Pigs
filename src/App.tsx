import { Application } from "@pixi/react";
import { Assets, Texture } from "pixi.js";
import { useEffect, useMemo, useState } from "react";

import { TileMap } from "./components/TileMap";
import { makeRoomMap } from "./game/mapGen";

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

  const map = useMemo(() => {
    return makeRoomMap(
      25, // height
      15, // width
      127, // floor index
      {
        tl: 0, // top left index
        t: 1, // top index
        tr: 2, // top right index
        l: 18, // left index
        r: 20, // right index
        bl: 36, // bottom left index
        b: 37, // bottom index
        br: 38, // bottom right index
      }
    );
  }, []);

  return (
    <Application width={1000} height={720} backgroundColor={0x0b1020}>
      {tileset && (
        <TileMap
          tileset={tileset}
          map={map}
          tileSize={32}
          offsetX={32}
          offsetY={32}
          gapX={0}
          gapY={0}
        />
      )}
    </Application>
  );
}
