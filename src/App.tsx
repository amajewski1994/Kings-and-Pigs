import { Application } from "@pixi/react";
import { Texture } from "pixi.js";

function App() {
  return (
    <Application width={800} height={600} backgroundColor={0x1099bb}>
      <pixiSprite
        texture={Texture.WHITE}
        x={100}
        y={100}
        width={100}
        height={100}
        tint={0xff0000}
      />
    </Application>
  )
}

export default App
