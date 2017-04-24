import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"

/** @type {!Gate} */
const ZeroGate = new GateBuilder().
    setSerializedIdAndSymbol("0").
    setTitle("Zero Gate").
    setBlurb("Destroys the universe.").
    setDrawer(args => {
        if (args.isHighlighted || args.isInToolbox) {
            GatePainting.paintBackground(args);
            GatePainting.paintOutline(args);
            GatePainting.paintGateSymbol(args);
            return;
        }

        let {x, y} = args.rect.center();
        let d = Math.min(args.rect.h, args.rect.w);
        args.painter.trace(tracer => {
            tracer.polygon([
                x, y-d/2,
                x-d/2, y,
                x, y+d/2,
                x+d/2, y
            ]);
        }).thenFill('#666').thenStroke('black');
        GatePainting.paintGateSymbol(args);
    }).
    setKnownEffectToMatrix(Matrix.square(0, 0, 0, 0)).
    gate;

export {ZeroGate}
