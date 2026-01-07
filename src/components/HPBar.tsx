import { type Graphics as PixiGraphics } from "pixi.js";

type Props = {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    flipX?: boolean;
    width?: number;
    height?: number;
    offsetX?: number;
    offsetY?: number;
};

export function HPBar({
    x,
    y,
    hp,
    maxHp,
    flipX = false,
    width = 40,
    height = 6,
    offsetX = 5,
    offsetY = 60,
}: Props) {
    const ratio = maxHp <= 0 ? 0 : Math.max(0, Math.min(1, hp / maxHp));
    const fillW = Math.round(width * ratio);

    const signedOffsetX = flipX ? offsetX : -offsetX;

    return (
        <pixiGraphics
            x={x + signedOffsetX}
            y={y - offsetY}
            draw={(g: PixiGraphics) => {
                g.clear();

                // tło
                g.roundRect(-width / 2, 0, width, height, 2);
                g.fill(0x000000);

                // fill
                if (fillW > 0) {
                    g.roundRect(
                        -width / 2 + 1,
                        1,
                        Math.max(0, fillW - 2),
                        height - 2,
                        2
                    );
                    g.fill(0xff0000);
                }

                // obrys
                g.roundRect(-width / 2, 0, width, height, 2);
                g.stroke({ width: 1, color: 0xffffff, alpha: 0.9 });
            }}
        />
    );
}
