import {Complex} from "src/math/Complex.js"
import {GateBuilder} from "src/circuit/Gate.js"
import {GatePainting} from "src/draw/GatePainting.js"
import {Matrix} from "src/math/Matrix.js"

let MysteryGateSymbol = "?";

let MysteryGateMakerWithMatrix = matrix => new GateBuilder().
    setSerializedIdAndSymbol(MysteryGateSymbol).
    setTitle("Mystery Gate").
    setBlurb("Different every time.\n(Use shift+drag to copy circuit gates.)").
    setDrawer(GatePainting.MATRIX_SYMBOL_DRAWER_EXCEPT_IN_TOOLBOX).
    setKnownEffectToMatrix(matrix).
    gate;

let MysteryGateMaker = () => MysteryGateMakerWithMatrix(Matrix.square(
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5),
    new Complex(Math.random() - 0.5, Math.random() - 0.5)
).closestUnitary(0.00001));

export {MysteryGateSymbol, MysteryGateMaker, MysteryGateMakerWithMatrix};
