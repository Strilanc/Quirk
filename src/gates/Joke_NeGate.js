import {GateBuilder} from "src/circuit/Gate.js"
import {Matrix} from "src/math/Matrix.js"
import {Point} from "src/math/Point.js"
import {GatePainting} from "src/draw/GatePainting.js"

const NeGate = new GateBuilder().
    setSerializedId("NeGate").
    setTitle("Ne-Gate").
    setBlurb("Negates all amplitudes.").
    setDrawer(args => {
        GatePainting.paintLocationIndependentFrame(args);
        let {x, y} = args.rect.center();
        args.painter.strokeLine(new Point(x - 6, y), new Point(x + 6, y), 'black', 2);
    }).
    setKnownEffectToMatrix(Matrix.square(-1, 0, 0, -1)).
    gate;

export {NeGate}
