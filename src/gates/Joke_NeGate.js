import {GateBuilder} from "src/circuit/Gate.js"
import {Matrix} from "src/math/Matrix.js"
import {GatePainting} from "src/draw/GatePainting.js"

const NeGate = new GateBuilder().
    setSerializedId("NeGate").
    setSymbol("-I").
    setTitle("Ne-Gate").
    setBlurb("Negates all amplitudes.").
    setDrawer(args => {
        GatePainting.paintLocationIndependentFrame(args);
        let {x, y} = args.rect.center();
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
    }).
    setKnownEffectToMatrix(Matrix.square(-1, 0, 0, -1)).
    gate;

export {NeGate}
