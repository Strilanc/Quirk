import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"

/** @type {!Gate} */
const ZeroGate = new GateBuilder().
    setSerializedIdAndSymbol("0").
    setTitle("Zero Gate").
    setBlurb("Destroys the universe.").
    setDrawer(GatePainting.makeLocationIndependentGateDrawer('#666')).
    setKnownEffectToMatrix(Matrix.square(0, 0, 0, 0)).
    gate;

export {ZeroGate}
