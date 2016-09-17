import {Gate} from "src/circuit/Gate.js"
import {Matrix} from "src/math/Matrix.js"
import {GatePainting} from "src/draw/GatePainting.js"

const NeGate = Gate.fromKnownMatrix(
    "-I",
    Matrix.square(-1, 0, 0, -1),
    "Ne-Gate",
    "Negates all amplitudes.").
    withSerializedId("NeGate").
    withCustomDrawer(args => {
        let {x, y} = args.rect.center();
        if (args.isHighlighted || args.isInToolbox) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
        } else {
            let d = Math.min(args.rect.h, args.rect.w);
            args.painter.trace(tracer => {
                tracer.polygon([
                    x, y-d/2,
                    x-d/2, y,
                    x, y+d/2,
                    x+d/2, y
                ]);
            }).thenFill('white').thenStroke('black');
        }
        args.painter.print(
            "-I",
            x,
            y,
            'center',
            'middle',
            'black',
            '16px monospace',
            args.rect.w,
            args.rect.h);
    });

export {NeGate}
